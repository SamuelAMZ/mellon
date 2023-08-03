import React, { useContext, useState, useEffect } from "react";

// icons
import { IoIosArrowBack } from "react-icons/io";

// contexts
import VisibleScrensContext from "../../contexts/visibleScreens";

// helpers
import removeExtraStrings from "../../helpers/removeExtra";

const AddPotentialIntro = () => {
  const { screen, changeScreen } = useContext(VisibleScrensContext);

  const [keyRelationInfo, setKeyRelationInfo] = useState({ prority: "Medium" });
  const [addingNewKey, setAddingNewKey] = useState(false);
  const [mellonUserGoals, setMellonUserGoals] = useState([]);

  // goal
  const [goalsSelectorVisible, changeGoalsSelectorVisible] = useState(false);

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

      fetch(
        "https://buckfifty.com/version-test/api/1.1/obj/goal",
        requestOptions
      )
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
    userToken,
    userLinked
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
      )} }, { "key": "Created By", "constraint_type": "equals", "value": ${JSON.stringify(
        userLinked
      )} }  ]`,
      requestOptions
    );
    let result = await response.json();

    if (result.response.count > 0) {
      // return true so we cam use a PUT request instead of a POST
      return {
        method: "PATCH",
        url: `${apiEndpoint}/${result.response.results[0]._id}`,
        data: result.response.results[0],
        id: result.response.results[0]._id,
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
        field === "_id" ||
        field === "Created By (custom)" ||
        field === "last_contact"
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
      setKeyRelationInfo({
        ...keyRelationInfo,
        notes: "",
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
      let photo = document.querySelector(
        "button.pv-top-card-profile-picture img"
      )?.src;
      userDetailsObj.profilePhoto = photo ? photo : "";

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
        "https://buckfifty.com/version-test/api/1.1/obj/potentialIntro",
        userToken,
        userLinked
      );

      let myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
      myHeaders.append("Authorization", "Bearer " + userToken);

      var urlencoded = new URLSearchParams();

      // new values to add
      // let valuesToAdd = [
      //   "Goal",
      //   "Linkedin URL",
      //   "Profile Photo",
      //   "Priority",
      //   "Full Name",
      //   "Notes",
      //   "Linkedin Description",
      // ];

      // add the current existant records
      // addCurrentValues(updateRecord.data, valuesToAdd, urlencoded);

      urlencoded.append("Goal", keyRelationInfo.goal);
      urlencoded.append("Linkedin URL", linkedinUrl);
      urlencoded.append("Profile Photo", mellonUserDetails.profilePhoto);
      urlencoded.append("Priority", keyRelationInfo.prority);
      urlencoded.append(
        "Full Name",
        removeExtraStrings(mellonUserDetails.fullName)
      );
      urlencoded.append(
        "Notes",
        keyRelationInfo.notes ? keyRelationInfo.notes : ""
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
        let conId = "";
        for (let x = 0; x < 1; x++) {
          if (!conId && updateRecord.method === "POST") {
            conId = await response.json();
            conId = conId.id;
          }

          if (!conId && updateRecord.method === "PATCH") {
            conId = updateRecord.id;
          }

          try {
            await updateGoalsDataType(
              keyRelationInfo.goal,
              conId,
              keyRelationInfo.relationshipStrength
            );
          } catch (error) {
            console.log(error);
          }
        }

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

  //  update goals data type
  const updateGoalsDataType = async (goalId, connectionId, strength) => {
    console.log(goalId, "here");
    // get goal details
    const goalDetails = await getGoalDetails(goalId);

    // build key relationship array
    let keyRelationShipsArr = [];
    if (goalDetails.response.results[0]["Key Relationships"]) {
      keyRelationShipsArr =
        goalDetails.response.results[0]["Key Relationships"];
    }

    // build High Strength Relationships array
    let highStrengthArr = [];
    if (goalDetails.response.results[0]["High Strength Relationships"]) {
      highStrengthArr =
        goalDetails.response.results[0]["High Strength Relationships"];
    }

    // build Medium Strength Relationships array
    let mediumStrengthArr = [];
    if (goalDetails.response.results[0]["Medium Strength Relationships"]) {
      mediumStrengthArr =
        goalDetails.response.results[0]["Medium Strength Relationships"];
    }

    // build Low Strength Relationships array
    let lowStrengthArr = [];
    if (goalDetails.response.results[0]["Low Strength Relationships"]) {
      lowStrengthArr =
        goalDetails.response.results[0]["Low Strength Relationships"];
    }

    // potential intro
    let potentialIntroArr = [];
    if (goalDetails.response.results[0]["Potential Intros"]) {
      potentialIntroArr = goalDetails.response.results[0]["Potential Intros"];
    }

    // push new data to arrays
    potentialIntroArr.push(connectionId);

    // new PUT request to update goal
    // get user rest detail
    let userToken = null;
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

    await delay(200);

    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("Authorization", "Bearer " + userToken);

    var urlencoded = new URLSearchParams();

    urlencoded.append(
      "Key Relationships",
      !keyRelationShipsArr || keyRelationShipsArr.length < 1
        ? JSON.stringify([])
        : JSON.stringify(keyRelationShipsArr)
    );
    urlencoded.append(
      "High Strength Relationships",
      !highStrengthArr || highStrengthArr.length < 1
        ? JSON.stringify([])
        : JSON.stringify(highStrengthArr)
    );
    urlencoded.append(
      "Medium Strength Relationships",
      !mediumStrengthArr || mediumStrengthArr.length < 1
        ? JSON.stringify([])
        : JSON.stringify(mediumStrengthArr)
    );
    urlencoded.append(
      "Low Strength Relationships",
      !lowStrengthArr || lowStrengthArr.length < 1
        ? JSON.stringify([])
        : JSON.stringify(lowStrengthArr)
    );
    urlencoded.append(
      "Potential Intros",
      !potentialIntroArr || potentialIntroArr.length < 1
        ? JSON.stringify([])
        : JSON.stringify(potentialIntroArr)
    );
    urlencoded.append("Name", goalDetails.response.results[0].Name);

    var requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: urlencoded,
      redirect: "follow",
    };

    const response = await fetch(
      `https://buckfifty.com/version-test/api/1.1/obj/goal/${goalId}`,
      requestOptions
    );
  };

  // get info about a goal
  const getGoalDetails = async (goalId) => {
    console.log(goalId);
    // get user rest detail
    let userToken = null;
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

    await delay(200);

    let myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + userToken);

    let requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    const req = await fetch(
      `https://buckfifty.com/version-test/api/1.1/obj/goal?constraints=[ { "key": "_id", "constraint_type": "equals", "value": ${JSON.stringify(
        goalId
      )} } ]`,
      requestOptions
    );

    let result = await req.json();
    return result;
  };

  // priority selector
  const prioritySelector = (e, num) => {
    let parentElm = e.target.parentElement;

    if (num === 1) {
      parentElm.children[0].className = "active1";
      parentElm.children[1].className = "";
      parentElm.children[2].className = "";
      setKeyRelationInfo({
        ...keyRelationInfo,
        prority: "Low",
      });
    }
    if (num === 2) {
      parentElm.children[0].className = "active2";
      parentElm.children[1].className = "active2";
      parentElm.children[2].className = "";
      setKeyRelationInfo({
        ...keyRelationInfo,
        prority: "Medium",
      });
    }
    if (num === 3) {
      parentElm.children[0].className = "active3";
      parentElm.children[1].className = "active3";
      parentElm.children[2].className = "active3";
      setKeyRelationInfo({
        ...keyRelationInfo,
        prority: "High",
      });
    }
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
            <ul>
              {mellonUserGoals.length >= 1 ? (
                <>
                  {mellonUserGoals.map((elm, idx) => {
                    return (
                      <>
                        <li key={idx} className="mellon-goal-li">
                          <input
                            type="radio"
                            className="radio mellon-radio"
                            id={elm.id}
                            onChange={(e) => {
                              Array.from(
                                e.target.parentElement.parentElement.children
                              ).forEach((elment) => {
                                let inp = elment.querySelector("input");
                                if (inp) inp.checked = false;
                              });
                              e.target.checked = true;
                              // set this as the goal
                              setKeyRelationInfo({
                                ...keyRelationInfo,
                                goal: elm.id,
                              });
                            }}
                          />
                          <p className="mellon-labels mellon-on-potential-p">
                            {elm.name}
                          </p>
                        </li>
                      </>
                    );
                  })}
                </>
              ) : (
                <p className="mellon-no-goal">No goal yet...</p>
              )}
            </ul>
          </div>
        </div>
        <div className="mellon-form-group">
          <label htmlFor="mellon-goals">Priority</label>
          <div className="mellon-select-container">
            <ul className="mellon-priority-selector">
              <span
                className="active2"
                onClick={(e) => prioritySelector(e, 1)}
              ></span>
              <span
                className="active2"
                onClick={(e) => prioritySelector(e, 2)}
              ></span>
              <span onClick={(e) => prioritySelector(e, 3)}></span>
            </ul>
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
