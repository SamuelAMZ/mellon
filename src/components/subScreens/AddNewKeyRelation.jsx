import React, { useContext, useState, useEffect } from "react";

// icons
import { IoIosArrowBack } from "react-icons/io";

// contexts
import VisibleScrensContext from "../../contexts/visibleScreens";

const AddNewKeyRelation = () => {
  const { screen, changeScreen } = useContext(VisibleScrensContext);

  const [keyRelationInfo, setKeyRelationInfo] = useState(null);
  const [addingNewKey, setAddingNewKey] = useState(false);
  const [mellonUserGoals, setMellonUserGoals] = useState([]);

  // goals
  const [goalsList, setGoalsList] = useState([]);
  const [selectGoal, setSelectGoal] = useState(false);

  const backToSingleUser = () => {
    changeScreen({
      first: false,
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

  // handle ading new key
  const handleNewKeyRelation = async (e) => {
    e.preventDefault();

    // check form inputs
    if (goalsList.length < 1) {
      return alert("Select at least one goal");
    }
    if (!keyRelationInfo.notes) {
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
        "https://buckfifty.com/version-test/api/1.1/obj/connection",
        userToken
      );

      let myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
      myHeaders.append("Authorization", "Bearer " + userToken);

      var urlencoded = new URLSearchParams();

      // new values to add
      let valuesToAdd = [
        "Goals",
        "Is Key Relationship",
        "is First Degree",
        "Linkedin URL",
        "Profile Photo",
        "Relationship Strength",
        "Full Name",
        "Notes",
        "Linkedin Description",
      ];

      // add the current existant records
      addCurrentValues(updateRecord.data, valuesToAdd, urlencoded);

      urlencoded.append("Goals", JSON.stringify(keyRelationInfo.goal));
      urlencoded.append("Is Key Relationship", "true");
      urlencoded.append("is First Degree", "true");
      urlencoded.append("Linkedin URL", linkedinUrl);
      urlencoded.append("Profile Photo", mellonUserDetails.profilePhoto);
      urlencoded.append(
        "Relationship Strength",
        keyRelationInfo.relationshipStrength
      );
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
        let conId = "";
        for (let x = 0; x < keyRelationInfo.goal.length; x++) {
          if (!conId && updateRecord.method === "POST") {
            conId = await response.json();
            conId = conId.id;
          }

          if (!conId && updateRecord.method === "PUT") {
            conId = updateRecord.id;
          }

          try {
            await updateGoalsDataType(
              keyRelationInfo.goal[x],
              conId,
              keyRelationInfo.relationshipStrength
            );
          } catch (error) {
            console.log(error);
          }
        }

        // closing the add new screen
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

  // choose goals widget
  const chooseGoals = () => {
    let goalsIds = [];
    let mellonGoalsInputs = document.querySelector(
      ".mellon-select-goal-container ul"
    );

    Array.from(mellonGoalsInputs.children).forEach((elm) => {
      if (elm.querySelector(".checkbox")?.checked) {
        goalsIds.push(elm.querySelector(".checkbox").getAttribute("id"));
      }
    });

    setGoalsList(goalsIds);
  };
  const checkedChecker = (goalId) => {
    let checkOrNot = false;
    goalsList.forEach((elm) => {
      if (elm === goalId) {
        checkOrNot = true;
      }
    });

    return checkOrNot;
  };

  //  update goals data type
  const updateGoalsDataType = async (goalId, connectionId, strength) => {
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
    keyRelationShipsArr.push(connectionId);
    if (strength === "High") {
      highStrengthArr.push(connectionId);
    }
    if (strength === "Medium") {
      mediumStrengthArr.push(connectionId);
    }
    if (strength === "Low" || !strength) {
      lowStrengthArr.push(connectionId);
    }

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

  return (
    <div className="mellon-add-new-key-relation-wrapper">
      <div className="mellon-key-header">
        <label className="back-btn" onClick={backToSingleUser}>
          <IoIosArrowBack /> Back
        </label>
        <h3>Add new Key Relationship</h3>
        <p>Add {mellonGetUserName()} as Key relationship</p>
      </div>
      <form onSubmit={handleNewKeyRelation}>
        <p className="mellon-new-key-error"></p>
        <div className="mellon-form-group">
          <label htmlFor="mellon-goals">Goals</label>
          <div className="mellon-select-container">
            <div
              className="mellon-select mellon-select-goal"
              onClick={() => setSelectGoal(true)}
            >
              {goalsList && goalsList.length > 0
                ? `${goalsList.length} goal(s) selected`
                : "Select goals"}
            </div>
          </div>
        </div>

        <div className="mellon-form-group">
          <label htmlFor="mellon-goals">Relationship Strength</label>
          <div className="mellon-select-container">
            <select
              className="mellon-select"
              required
              onChange={(e) => {
                setKeyRelationInfo({
                  ...keyRelationInfo,
                  relationshipStrength: e.target.value,
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

      {/* goals list view */}
      {selectGoal && (
        <>
          <div className="mellon-select-goal-container">
            {/* list */}
            <ul>
              {mellonUserGoals.length >= 1 ? (
                <>
                  {mellonUserGoals.map((elm, idx) => {
                    return (
                      <>
                        {checkedChecker(elm.id) ? (
                          <li key={idx}>
                            <input
                              type="checkbox"
                              className="checkbox checkbox-lg"
                              id={elm.id}
                              checked
                              onChange={chooseGoals}
                            />
                            <p className="mellon-labels">{elm.name}</p>
                          </li>
                        ) : (
                          <li key={idx}>
                            <input
                              type="checkbox"
                              className="checkbox checkbox-lg"
                              id={elm.id}
                              onChange={chooseGoals}
                            />
                            <p className="mellon-labels">{elm.name}</p>
                          </li>
                        )}
                      </>
                    );
                  })}

                  <button
                    className="mellon-button"
                    onClick={() => {
                      console.log(keyRelationInfo, goalsList);
                      setKeyRelationInfo({
                        ...keyRelationInfo,
                        goal: goalsList,
                      });
                      setSelectGoal(false);
                    }}
                  >
                    Done
                  </button>
                </>
              ) : (
                <p className="mellon-no-goal">No goal yet...</p>
              )}
            </ul>

            {/* done btn */}
          </div>
          <div
            className="mellon-select-goal-container-back"
            onClick={() => setSelectGoal(false)}
          ></div>
        </>
      )}
    </div>
  );
};

export default AddNewKeyRelation;
