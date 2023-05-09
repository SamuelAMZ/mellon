import React, { useContext, useState, useEffect } from "react";

// icons
import { IoIosArrowBack } from "react-icons/io";

// contexts
import VisibleScrensContext from "../../contexts/visibleScreens";

const AddPotentialIntro = () => {
  const { screen, changeScreen } = useContext(VisibleScrensContext);

  const [keyRelationInfo, setKeyRelationInfo] = useState(null);
  const [addingNewKey, setAddingNewKey] = useState(false);
  const [mellonUserGoals, setMellonUserGoals] = useState([]);

  const backToSingleUser = () => {
    changeScreen({
      first: false,
      menu: false,
      connections: true,
      singleUser: true,
      connectionList: false,
      newKey: false,
      potential: false,
    });
  };

  const mellonGetUserName = () => {
    let mellonUser = document
      .querySelector(".pv-text-details__left-panel h1")
      ?.textContent?.trim()
      .toLowerCase();

    let mellonTheName = "user";

    mellonUser
      ? (mellonTheName = mellonUser.trim().split(" ")[0])
      : (mellonTheName = "user");
    return mellonTheName;
  };

  // get user goals
  const mellonGetGoals = async () => {
    // get user token
    chrome.storage.local.get("utoken", (data) => {
      if (!data.utoken) {
        return console.log("error getting user token");
      }

      // send get goals request
      let myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + data.utoken);

      let requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      fetch("https://mellon.app/version-test/api/1.1/obj/goal", requestOptions)
        .then((response) => response.json())
        .then((result) => {
          if (result.response.count > 0) {
            let mellonGoalsBrut = [];
            result.response.results.forEach((elm) => {
              mellonGoalsBrut.push({ name: elm.Name, id: elm._id });
            });

            // set goals
            setMellonUserGoals(mellonGoalsBrut);
          }
        })
        .catch((error) => console.log("error", error));
    });
  };

  useEffect(() => {
    (async () => {
      await mellonGetGoals();
    })();
  }, []);

  // normalize linkedin urls
  const mellonNormalizeLinkedinUrl = (linkedinUrlBrut) => {
    let url = linkedinUrlBrut.trim();

    // Remove the last slash character
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }

    return url;
  };

  // check before adding to db (prevent duplicates)
  const mellonPreventDuplicates = async (
    linkedinUrl,
    apiEndpoint,
    userToken
  ) => {
    let myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + userToken);

    let requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    let response = await fetch(
      `${apiEndpoint}?constraints=[ { "key": "Linkedin URL", "constraint_type": "equals", "value": ${JSON.stringify(
        linkedinUrl
      )} } ]`,
      requestOptions
    );
    let result = await response.json();

    if (result.response.count > 0) {
      // return true so we cam use a PUT request instead of a POST
      return {
        method: "PUT",
        url: `${apiEndpoint}/${result.response.results[0]._id}`,
        data: result.response.results[0],
      };
    }
    return { method: "POST", url: apiEndpoint, data: {} };
  };

  // add the current record that are present in the db, so the PUT request will not override them
  const addCurrentValues = (data, valuesToAdd, urlencoded) => {
    if (!data._id) {
      return;
    }

    // loop inside the data
    // if field is not egal to the defaults
    // the update ones
    // add the rest to an array
    // filter the array
    // append

    let fieldsToAdd = [];

    const check = (field) => {
      for (let i = 0; i < valuesToAdd.length; i++) {
        if (field === valuesToAdd[i]) {
          return false;
        }
      }

      if (
        field === "Modified Date" ||
        field === "Created Date" ||
        field === "Created By" ||
        field === "_id"
      ) {
        return false;
      }

      return true;
    };

    for (let prop in data) {
      if (check(prop)) {
        fieldsToAdd.push({ field: prop, value: data[prop] });
      }
    }

    for (let i = 0; i < fieldsToAdd.length; i++) {
      urlencoded.append(fieldsToAdd[i].field, fieldsToAdd[i].value);
    }
  };

  // handle ading new potential
  const handleNewPotentialIntro = async (e) => {
    e.preventDefault();

    // check form inputs
    if (!keyRelationInfo.notes) {
      console.log("hitted");
      setKeyRelationInfo({
        ...keyRelationInfo,
        notes: "...",
      });
    }

    setAddingNewKey(true);

    // get user rest detail
    let userLinked = null;
    let userToken = null;
    chrome.storage.local.get("uid", function (item) {
      if (item.uid) {
        userLinked = item.uid;
      }
      if (!item.uid) {
        userLinked = null;
      }
    });
    chrome.storage.local.get("utoken", function (item) {
      if (item.utoken) {
        userToken = item.utoken;
      }
      if (!item.utoken) {
        userToken = null;
      }
    });
    function delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    const grabUserDetails = async () => {
      //   wait 1sec
      await delay(100);

      //   start scraping
      const userDetailsObj = {};

      //   user id
      userDetailsObj.uid = userLinked;

      //   get url
      chrome.runtime.sendMessage({ from: "getActualLink" }, (data) => {
        userDetailsObj.linkedinUrl = data.url;
      });

      await delay(100);

      //   get full name
      userDetailsObj.fullName = document
        .querySelector(".pv-text-details__left-panel h1")
        ?.textContent?.trim();

      // actual role
      userDetailsObj.actualRole = document
        .querySelector(".pv-text-details__left-panel .text-body-medium")
        ?.textContent?.trim();

      // profile photo
      userDetailsObj.profilePhoto = document.querySelector(
        "button.pv-top-card-profile-picture img"
      )?.src;

      // is first degree
      let isOrNot =
        document.querySelector(".dist-value")?.innerText.trim() === "1st"
          ? true
          : false;
      userDetailsObj.isFirstDegree = isOrNot;

      return userDetailsObj;
    };
    try {
      let mellonUserDetails = await grabUserDetails();

      // normalize limkedin url
      let linkedinUrl = mellonUserDetails.linkedinUrl
        ? mellonNormalizeLinkedinUrl(mellonUserDetails.linkedinUrl)
        : "";

      // check if the user already exist for the current user
      let updateRecord = await mellonPreventDuplicates(
        linkedinUrl,
        "https://mellon.app/version-test/api/1.1/obj/potentialIntro",
        userToken
      );

      let myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
      myHeaders.append("Authorization", "Bearer " + userToken);

      var urlencoded = new URLSearchParams();

      // new values to add
      let valuesToAdd = [
        "Goal",
        "Linkedin URL",
        "Profile Photo",
        "Priority",
        "Full Name",
        "Notes",
        "Linkedin Description",
      ];

      console.log(mellonUserDetails);

      // add the current existant records
      addCurrentValues(updateRecord.data, valuesToAdd, urlencoded);

      urlencoded.append("Goal", keyRelationInfo.goal);
      urlencoded.append("Linkedin URL", linkedinUrl);
      urlencoded.append("Profile Photo", mellonUserDetails.profilePhoto);
      urlencoded.append("Priority", keyRelationInfo.prority);
      urlencoded.append("Full Name", mellonUserDetails.fullName);
      urlencoded.append(
        "Notes",
        keyRelationInfo.notes ? keyRelationInfo.notes : "..."
      );
      urlencoded.append("Linkedin Description", mellonUserDetails.actualRole);

      var requestOptions = {
        method: updateRecord.method,
        headers: myHeaders,
        body: urlencoded,
        redirect: "follow",
      };

      const response = await fetch(updateRecord.url, requestOptions);

      if (response.status >= 200 && response.status < 400) {
        setAddingNewKey(false);

        // redirect to the user page
        backToSingleUser();
        return;
      }

      if (result.status !== "success") {
        let newKeyErrorBox = document.querySelector(".mellon-new-key-error");

        newKeyErrorBox.style.display = "flex";
        newKeyErrorBox.innerText = result.body?.message;

        // stop laoding
        setAddingNewKey(false);
        return;
      }
    } catch (error) {
      setAddingNewKey(false);
    }

    setAddingNewKey(false);
  };

  return (
    <div className="mellon-add-new-key-relation-wrapper">
      <div className="mellon-key-header">
        <label className="back-btn" onClick={backToSingleUser}>
          <IoIosArrowBack /> Back
        </label>
        <h3>Add New Potential Intro</h3>
        <p>Add {mellonGetUserName()} as Potential Intro</p>
      </div>
      <form onSubmit={handleNewPotentialIntro}>
        <p className="mellon-new-key-error"></p>
        <div className="mellon-form-group">
          <label htmlFor="mellon-goals">Goals</label>

          <div className="mellon-select-container">
            <select
              className="mellon-select"
              onChange={(e) => {
                setKeyRelationInfo({
                  ...keyRelationInfo,
                  goal: e.target.value,
                });
              }}
              required
            >
              <option disabled selected>
                Select a goal
              </option>
              {mellonUserGoals.map((elm, idx) => {
                return (
                  <option key={idx} value={elm.id}>
                    {elm.name}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        <div className="mellon-form-group">
          <label htmlFor="mellon-goals">Priority</label>
          <div className="mellon-select-container">
            <select
              className="mellon-select"
              onChange={(e) => {
                setKeyRelationInfo({
                  ...keyRelationInfo,
                  prority: e.target.value,
                });
              }}
              required
            >
              <option value="" selected disabled>
                Select an option
              </option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>
        <div className="mellon-form-group">
          <label htmlFor="mellon-goals">Notes</label>
          <textarea
            placeholder="Optional note"
            onChange={(e) => {
              setKeyRelationInfo({
                ...keyRelationInfo,
                notes: e.target.value,
              });
            }}
          ></textarea>
        </div>

        <div className="mellon-form-group">
          {addingNewKey && <button className="mellon-button">Adding...</button>}
          {!addingNewKey && <button className="mellon-button">Add new</button>}
        </div>
      </form>
    </div>
  );
};

export default AddPotentialIntro;
