import React, { useContext, useState, useEffect } from "react";

// react query
import { useQuery } from "react-query";

// context
import GoalsSelectorVisibleContext from "../../contexts/GoalSelectorVisible";

import removeExtraStrings from "../../helpers/removeExtra";

const GoalSelector = ({ strenth, refresh }) => {
  // context
  const { goalsSelectorVisible, changeGoalsSelectorVisible } = useContext(
    GoalsSelectorVisibleContext
  );

  //   states
  const [mellonUserGoals, setMellonUserGoals] = useState([]);
  const [keyRelationInfo, setKeyRelationInfo] = useState(null);

  // goals
  const [goalsList, setGoalsList] = useState([]);
  const [selectGoal, setSelectGoal] = useState(false);
  // used goals
  const [mellonUserUsedGoals, setMellonUserUsedGoals] = useState([]);

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

  // get user used goals
  const mellonGetUsedGoals = async () => {
    chrome.storage.local.get(["utoken", "uid"], async (data) => {
      if (!data.utoken) {
        return console.log("error getting user token");
      }
      if (!data.uid) {
        return console.log("error getting user id");
      }

      // send get goals request
      let myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + data.utoken);

      let requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      let res = await fetch(
        `https://buckfifty.com/version-test/api/1.1/obj/goal?constraints=[{ "key": "_id", "constraint_type": "equals", "value": ${JSON.stringify(
          data.uid
        )} } ]`,
        requestOptions
      );
      let result = await res.json();

      if (result.response.count > 0) {
        let mellonUsedGoalsBrut = [];
        result.response.results.forEach((elm) => {
          mellonUsedGoalsBrut.push({ name: elm.Name, id: elm._id });
        });

        // set goals
        setMellonUserUsedGoals(mellonUsedGoalsBrut);
      }

      let mellonUsedGoalsBrut = [];
      setMellonUserUsedGoals(mellonUsedGoalsBrut);
    });
  };

  // check default goals (the ones already checked on another source)
  const checkDefaultGoals = () => {
    //
    if (goalsList.length > 0) return;

    // get defautl goals array
    if (mellonUserUsedGoals.length < 1) return console.log("stoped");

    let defaultGoals = [];
    for (let z = 0; z < mellonUserUsedGoals.length; z++) {
      if (mellonUserUsedGoals[z]._id)
        defaultGoals.push(mellonUserUsedGoals[z]._id);
    }

    // get actual goals list
    let mellonGoalsInputs = document.querySelector(
      ".mellon-select-goal-container ul"
    );

    if (!mellonGoalsInputs?.children) return;

    for (let i = 0; i < mellonGoalsInputs?.children?.length; i++) {
      for (let y = 0; y < defaultGoals.length; y++) {
        if (
          Array.from(mellonGoalsInputs.children)
            [i]?.querySelector(".checkbox")
            ?.getAttribute("id")
            ?.trim() === defaultGoals[y]
        ) {
          console.log("hit");
          Array.from(mellonGoalsInputs.children)[i].querySelector(
            ".checkbox"
          ).checked = true;
          setGoalsList([defaultGoals[y]]);
        }
      }
    }

    // verify and check the ones present in the default
  };

  useEffect(() => {
    (async () => {
      await mellonGetGoals();
      await mellonGetUsedGoals();

      // fill default goals
      checkDefaultGoals();
    })();
  }, []);

  useEffect(() => {
    checkDefaultGoals();
  }, [selectGoal, mellonUserGoals, mellonUserUsedGoals]);

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
      )} } ]`,
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

  const updateGoals = async () => {
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
        userToken,
        userLinked
      );

      let myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
      myHeaders.append("Authorization", "Bearer " + userToken);

      var urlencoded = new URLSearchParams();

      urlencoded.append("Goals", JSON.stringify(goalsList ? goalsList : []));

      var requestOptions = {
        method: updateRecord.method,
        headers: myHeaders,
        body: urlencoded,
        redirect: "follow",
      };

      const response = await fetch(updateRecord.url, requestOptions);

      if (response.status >= 200 && response.status < 400) {
        let conId = "";
        for (let x = 0; x < goalsList.length; x++) {
          if (!conId && updateRecord.method === "POST") {
            conId = await response.json();
            conId = conId.id;
          }

          if (!conId && updateRecord.method === "PATCH") {
            conId = updateRecord.id;
          }

          try {
            await updateGoalsDataType(goalsList[x], conId, strenth);
          } catch (error) {
            console.log(error);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }

    refresh();
  };

  return (
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
                          onChange={() => {
                            chooseGoals();
                          }}
                        />
                        <p className="mellon-labels">{elm.name}</p>
                      </li>
                    ) : (
                      <li key={idx}>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-lg"
                          id={elm.id}
                          onChange={() => {
                            chooseGoals();
                          }}
                        />
                        <p className="mellon-labels">{elm.name}</p>
                      </li>
                    )}
                  </>
                );
              })}

              <button
                className="mellon-button"
                onClick={async () => {
                  await updateGoals();

                  // close view
                  changeGoalsSelectorVisible(false);
                }}
              >
                Update
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
        onClick={() => changeGoalsSelectorVisible(false)}
      ></div>
    </>
  );
};

export default GoalSelector;
