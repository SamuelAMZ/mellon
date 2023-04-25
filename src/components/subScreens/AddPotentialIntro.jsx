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
              mellonGoalsBrut.push({ name: elm.name_text, id: elm._id });
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

  // handle ading new key
  const handleNewPotentialIntro = async (e) => {
    e.preventDefault();

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
        ?.textContent?.trim()
        .toLowerCase();

      // actual role
      userDetailsObj.actualRole = document
        .querySelector(".pv-text-details__left-panel .text-body-medium")
        ?.textContent?.trim()
        .toLowerCase();

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

      // let newKeyData = { ...keyRelationInfo, ...mellonUserDetails };

      let myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
      myHeaders.append("Authorization", "Bearer " + userToken);

      var urlencoded = new URLSearchParams();
      urlencoded.append("goal_custom_goal", keyRelationInfo.goal);
      urlencoded.append("linkedin_url_text", mellonUserDetails.linkedinUrl);
      urlencoded.append("priority_option_priority", keyRelationInfo.prority);
      urlencoded.append("full_name_text", mellonUserDetails.fullName);
      urlencoded.append("notes_text", keyRelationInfo.notes);

      var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: urlencoded,
        redirect: "follow",
      };

      fetch(
        "https://mellon.app/version-test/api/1.1/obj/potentialIntro",
        requestOptions
      )
        .then((response) => response.json())
        .then((result) => {
          console.log(result);
          if (result.status !== "success") {
            let newKeyErrorBox = document.querySelector(
              ".mellon-new-key-error"
            );

            newKeyErrorBox.style.display = "flex";
            newKeyErrorBox.innerText = result.body?.message;

            // stop laoding
            setAddingNewKey(false);
            return;
          }

          setAddingNewKey(false);

          // redirect to the user page
          backToSingleUser();
        })
        .catch((error) => console.log("error", error));
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
