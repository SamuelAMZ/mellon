import React, { useState, useEffect, useContext } from "react";

// comps
import Loading from "./Loading";

// react query
import { useQuery } from "react-query";

// helpers
import postReq from "../../helpers/postReq";

// contexts
import VisibleScrensContext from "../../contexts/visibleScreens";

// icons
import { IoIosArrowBack } from "react-icons/io";

const SingleUser = () => {
  const { screen, changeScreen } = useContext(VisibleScrensContext);

  const [userDetails, setUserDetails] = useState(null);
  const [isFirstDegree, setIsFirstDegree] = useState(false);
  const [singleGoal, setSingleGoal] = useState("");

  // mutual more
  const [mellonZeroOrMore, setMellonZeroOrMore] = useState(false);
  const [mellonMutualLink, setMellonMutualLink] = useState("");

  // loading user more goals
  const [loadingMoreGoals, setLoadingMoreGoals] = useState(false);
  const [moreGoalsData, setMoreGoalsData] = useState(null);

  // key mutual connections state
  const [keyMutualConnections, setKeyMutualConnections] = useState([]);

  // get user first details
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
  function waitForClass(className, callback) {
    var intervalId = setInterval(function () {
      var elements = document.querySelector(className);
      if (elements && elements.offsetHeight > 0) {
        clearInterval(intervalId);
        callback();
      }
    }, 100); // check every 100 milliseconds
  }

  const grabUserDetails = async () => {
    //   wait 1sec
    await delay(300);

    //   start scraping
    const userDetailsObj = {};

    //   user id
    userDetailsObj.uid = userLinked;
    userDetailsObj.utoken = userToken;

    //   get url
    chrome.runtime.sendMessage({ from: "getActualLink" }, (data) => {
      userDetailsObj.url = data.url;
    });

    //   get full name
    userDetailsObj.fullName = document
      .querySelector(".pv-text-details__left-panel h1")
      ?.textContent?.trim();

    // actual role
    userDetailsObj.actualRole = document
      .querySelector(".pv-text-details__left-panel .text-body-medium")
      ?.textContent?.trim();

    // is first degree
    let isOrNot =
      document.querySelector(".dist-value")?.innerText.trim() === "1st"
        ? true
        : false;
    userDetailsObj.isFirstDegree = isOrNot;

    // set first degree or not
    setIsFirstDegree(isOrNot);

    // set user details
    setUserDetails(userDetailsObj);
  };

  // normalize linkedin urls
  const mellonNormalizeLinkedinUrl = (linkedinUrlBrut) => {
    if (!linkedinUrlBrut) {
      return;
    }

    let url = linkedinUrlBrut.trim();

    // Remove the last slash character
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }

    return url;
  };

  // get key relations details
  const handleConnectionsList = async () => {
    await delay(200);

    const mellonCheckProfile = async () => {
      let myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + userDetails?.utoken);

      let requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      let linkedinUrl = mellonNormalizeLinkedinUrl(userDetails?.url);

      const req = await fetch(
        `https://buckfifty.com/version-test/api/1.1/obj/connection?constraints=[ { "key": "Linkedin URL", "constraint_type": "equals", "value": ${JSON.stringify(
          linkedinUrl
        )} }, { "key": "Is Key Relationship", "constraint_type": "equals", "value": "true" } ]`,
        requestOptions
      );

      let result = await req.json();

      if (result?.response?.results.length > 0) {
        return result?.response?.results[0];
      } else {
        return [];
      }
    };

    // check if linkedin profile exist already for the current user
    return await mellonCheckProfile();
  };

  const {
    data: mellonKeyData,
    isLoading: mellonKeyLoading,
    refetch: getPaginate,
  } = useQuery(["key-list", userDetails?.fullName], handleConnectionsList, {
    refetchOnWindowFocus: false,
    enabled: true,
  });

  // get single potential intro
  const handlePotentialList = async () => {
    await delay(200);

    const mellonCheckProfile = async () => {
      let myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + userDetails?.utoken);

      let requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      let linkedinUrl = mellonNormalizeLinkedinUrl(userDetails?.url);

      const req = await fetch(
        `https://buckfifty.com/version-test/api/1.1/obj/potentialIntro?constraints=[ { "key": "Linkedin URL", "constraint_type": "equals", "value": ${JSON.stringify(
          linkedinUrl
        )} } ]`,
        requestOptions
      );

      let result = await req.json();

      console.log(result?.response?.results[0], "res");

      if (result?.response?.results.length > 0) {
        return result?.response?.results[0];
      } else {
        return [];
      }
    };

    // check if linkedin profile exist already for the current user
    return await mellonCheckProfile();
  };

  const {
    data: mellonPotentialData,
    isLoading: mellonPotentialLoading,
    refetch: getPotentialPaginate,
  } = useQuery(["potential-list", userDetails?.fullName], handlePotentialList, {
    refetchOnWindowFocus: false,
    enabled: true,
  });

  // get goal
  useEffect(() => {
    if (mellonKeyData || mellonPotentialData) {
      (async () => {
        let myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer " + userDetails?.utoken);

        let requestOptions = {
          method: "GET",
          headers: myHeaders,
          redirect: "follow",
        };

        let goalIdToSend = "";
        if (mellonKeyData?.Goals) {
          goalIdToSend = [mellonKeyData.Goals[0]];
        }
        if (mellonPotentialData?.Goal) {
          goalIdToSend = mellonPotentialData.Goal;
        }

        const req = await fetch(
          `https://buckfifty.com/version-test/api/1.1/obj/goal?constraints=[ { "key": "_id", "constraint_type": "equals", "value": ${JSON.stringify(
            goalIdToSend
          )} } ]`,
          requestOptions
        );

        let result = await req.json();

        setSingleGoal(result?.response?.results[0].Name);
      })();
    }
  }, [mellonKeyData, mellonPotentialData]);

  useEffect(() => {
    (async () => {
      // grab first detail
      await grabUserDetails();
      // update user info
      await getPaginate();
    })();
  }, []);

  // keep track of the page, when it changed
  useEffect(() => {
    let mellonUserCheck = setInterval(async () => {
      await grabUserDetails();
    }, 500);

    return () => clearInterval(mellonUserCheck);
  }, []);

  const mellonBackToMenu = () => {
    changeScreen({
      first: false,
      menu: true,
      connections: true,
      singleUser: false,
      connectionList: false,
      newKey: false,
      potential: false,
    });
  };

  // add key relation
  const addNewRelationView = () => {
    changeScreen({
      first: false,
      menu: false,
      connections: true,
      singleUser: false,
      connectionList: false,
      newKey: true,
      potential: false,
    });
  };

  // add potential intro
  const addPotentialIntroView = () => {
    changeScreen({
      first: false,
      menu: false,
      connections: true,
      singleUser: false,
      connectionList: false,
      newKey: false,
      potential: true,
    });
  };

  // check if this is a user page or not
  useEffect(() => {
    chrome.runtime.sendMessage({ from: "getActualLink" }, (data) => {
      if (data.url.split("/in/")[0] !== "https://www.linkedin.com") {
        changeScreen({
          first: false,
          menu: true,
          connections: true,
          singleUser: false,
          connectionList: false,
          newKey: false,
        });
      }
    });
  }, []);

  // more mutual connection or not
  const detectIfMoreMutualConnection = () => {
    const mutualConnetionExist = document?.querySelector(
      ".artdeco-card div.ph5.pb5 > a.app-aware-link"
    );
    if (mutualConnetionExist) {
      setMellonZeroOrMore(true);

      // set mutual link
      let mutuallLink = document.querySelector(
        ".artdeco-card div.ph5.pb5 > a.app-aware-link"
      ).href;
      setMellonMutualLink(mutuallLink);
    } else {
      setMellonZeroOrMore(false);
      setMellonMutualLink("");
    }
  };
  useEffect(() => {
    let mellonMutualCheck = setInterval(() => {
      detectIfMoreMutualConnection();
    }, 500);

    return () => clearInterval(mellonMutualCheck);
  }, []);

  // if not on user page shut down the widget
  useEffect(() => {
    let mellonPageCheck = setInterval(async () => {
      chrome.runtime.sendMessage({ from: "getActualLink" }, (data) => {
        if (data.url.split("/in/")[0] !== "https://www.linkedin.com") {
          changeScreen({
            first: true,
            menu: false,
            connections: false,
            singleUser: false,
            connectionList: false,
            newKey: false,
            potential: false,
          });
        }
      });
    }, 500);

    return () => clearInterval(mellonPageCheck);
  }, []);

  // function returning the number of circles for the strenth
  const mellonDynamicCircles = (mellonKeyData) => {
    if (
      mellonKeyData?.["Relationship Strength"] === "Low" ||
      !mellonKeyData?.["Relationship Strength"] ||
      mellonKeyData?.["Relationship Strength"] === "N/A"
    ) {
      return 1;
    }
    if (mellonKeyData?.["Relationship Strength"] === "Medium") {
      return 2;
    }
    if (mellonKeyData?.["Relationship Strength"] === "High") {
      return 3;
    }
  };
  const mellonDynamicCirclesPotential = (mellonPotentialData) => {
    if (
      mellonPotentialData?.Priority === "Low" ||
      !mellonPotentialData?.Priority ||
      mellonPotentialData?.Priority === "N/A"
    ) {
      return 1;
    }
    if (mellonPotentialData?.Priority === "Medium") {
      return 2;
    }
    if (mellonPotentialData?.Priority === "High") {
      return 3;
    }
  };

  // fetch all user individual goals
  const mellonFetchUserGoals = async (idArr) => {
    setLoadingMoreGoals(true);

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

    let goalReturned = [];

    for (let i = 0; i < idArr.length; i++) {
      let myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + userToken);

      let requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      const req = await fetch(
        `https://buckfifty.com/version-test/api/1.1/obj/goal?constraints=[ { "key": "_id", "constraint_type": "equals", "value": ${JSON.stringify(
          idArr[i]
        )} } ]`,
        requestOptions
      );

      let result = await req.json();

      if (result?.response?.results?.length > 0) {
        goalReturned.push(result.response.results[0].Name);
      }
    }

    setLoadingMoreGoals(false);
    setMoreGoalsData(goalReturned);
  };

  // handle set and redirect to mutual connection page
  const setAndRedirectMutualPage = async (keyOrPotential) => {
    // actual user link
    let userLink = "";
    chrome.runtime.sendMessage({ from: "getActualLink" }, (data) => {
      userLink = data.url;
    });

    await delay(200);

    // set actual user linkedin url and key or potential in localstorage
    chrome.storage.local.set(
      {
        currentMutualUrl: userLink,
        currentMutualType: keyOrPotential,
      },
      function () {
        console.log("set new current mutual page user");
      }
    );

    await delay(200);

    // redirect to mutual url
    chrome.runtime.sendMessage({
      from: "mutualAction",
      url: mellonMutualLink,
    });
  };

  // redirect to mellon
  const mellonRedirectToMellon = async (uid) => {
    let url = `https://buckfifty.com/version-test/core_network/${uid}`;

    chrome.runtime.sendMessage({
      from: "openUserUrl",
      url: url,
    });
  };

  // get key relationships data
  const mellonGetUserKeyRelationships = async () => {
    const mellonCheckProfile = async () => {
      let userToken = "";
      chrome.storage.local.get("utoken", function (item) {
        userToken = item.utoken;
      });

      await delay(200);

      let myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + userToken);

      let requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      const req = await fetch(
        `https://buckfifty.com/version-test/api/1.1/obj/connection?constraints=[ { "key": "is_key_relationship_boolean", "constraint_type": "equals", "value": "true" } ]`,
        requestOptions
      );

      let result = await req.json();

      if (result?.response?.results.length > 0) {
        return result?.response?.results;
      } else {
        return [];
      }
    };

    // check if linkedin profile exist already for the current user
    return await mellonCheckProfile();
  };

  const { data: keyRelations, isLoading: keyRelationsLoading } = useQuery(
    ["keys-list"],
    mellonGetUserKeyRelationships,
    {
      refetchOnWindowFocus: false,
      enabled: true,
    }
  );

  useEffect(() => {
    if (!keyRelations) {
      return;
    }
    if (!mellonKeyData && !mellonPotentialData) {
      return;
    }

    let keyConnectionsTemp = [];
    let mutualFromUser = [];

    // setKeyMutualConnections
    if (keyRelations.length < 1) {
      return setKeyMutualConnections([]);
    }

    for (let y = 0; y < keyRelations.length; y++) {
      keyConnectionsTemp.push(keyRelations[y]._id);
    }

    // if the key relationship found  || potential intro
    // extract it s mutual connections
    // check for those that are present in both (key relations and on the key user)
    // add then to the keymutualstemps array

    // if user is key
    if (mellonKeyData && mellonKeyData["Mutual Connections"]) {
      mutualFromUser = [...mellonKeyData["Mutual Connections"]];
    }

    // if user is potential intro
    if (mellonPotentialData && mellonPotentialData["Mutual Connections"]) {
      mutualFromUser = [...mellonPotentialData["Mutual Connections"]];
    }

    // check for those that are present in both
    let matches = [];
    for (let i = 0; i < keyConnectionsTemp.length; i++) {
      for (let x = 0; x < mutualFromUser.length; x++) {
        if (keyConnectionsTemp[i] === mutualFromUser[x]) {
          matches.push(mutualFromUser[x]);
        }
      }
    }

    console.log(matches);
    setKeyMutualConnections(matches);
  }, [keyRelations, mellonKeyData, mellonPotentialData]);

  return (
    <>
      <div className="mellon-ext-user-details">
        <label className="back-btn" onClick={mellonBackToMenu}>
          <IoIosArrowBack /> Back
        </label>

        <div className="mellon-single-user-setails">
          <h2>
            {userDetails && userDetails?.fullName?.substr(0, 30)}
            {userDetails && userDetails?.fullName?.length >= 30 && "..."}
          </h2>
          <h3>
            {userDetails && userDetails?.actualRole?.substr(0, 28)}
            {userDetails && userDetails?.actualRole?.length >= 28 && "..."}
          </h3>
        </div>

        {/* when it s key relation */}
        {
          <>
            {!mellonKeyLoading && mellonKeyData && mellonKeyData?._id && (
              <>
                <div className="mellon-key-or-not">
                  <img
                    src={chrome.runtime.getURL("/assets/start-active.svg")}
                    alt="star"
                  />
                  <p>Key Relationship</p>
                </div>
                <a
                  className="link"
                  onClick={() => mellonRedirectToMellon(mellonKeyData?._id)}
                >
                  View in mellon
                </a>

                <div className="mellon-ext-sep mellon-user-section"></div>
              </>
            )}
          </>
        }

        {/* when it s potential intro */}
        {
          <>
            {!mellonPotentialLoading &&
              mellonPotentialData &&
              mellonPotentialData?._id && (
                <>
                  <div className="mellon-key-or-not">
                    <img
                      src={chrome.runtime.getURL("/assets/users-active.svg")}
                      alt="star"
                    />
                    <p>Potential Intro</p>
                  </div>

                  <a
                    className="link"
                    onClick={() =>
                      mellonRedirectToMellon(mellonPotentialData?._id)
                    }
                  >
                    View in mellon
                  </a>

                  <div className="mellon-ext-sep mellon-user-section"></div>
                </>
              )}
          </>
        }

        {/* when it s not either */}
        {
          <>
            {!mellonKeyLoading &&
              !mellonPotentialLoading &&
              !mellonKeyData?._id &&
              !mellonPotentialData?._id && (
                <>
                  {/* <div className="mellon-key-or-not">
                    <img
                      src={chrome.runtime.getURL("/assets/start.svg")}
                      alt="star"
                    />
                    <p>Connection (Not a Key Relationship)</p>
                  </div> */}
                  {isFirstDegree ? (
                    <button
                      className="mellon-ext-btn btn btn-primary w-full mellon-fallback-btn"
                      onClick={addNewRelationView}
                    >
                      + Add Key Relationship
                    </button>
                  ) : (
                    <button
                      className="mellon-ext-btn btn btn-primary w-full mellon-fallback-btn"
                      onClick={addPotentialIntroView}
                    >
                      + Add Potential Intro
                    </button>
                  )}

                  {/* <div className="mellon-ext-sep mellon-user-section"></div> */}
                </>
              )}
          </>
        }
      </div>

      <div className="mellon-ext-user-details-body">
        <>
          {(mellonKeyLoading || mellonPotentialLoading) && <Loading />}

          {/* if it s key relation */}
          {!mellonKeyLoading && mellonKeyData && mellonKeyData?._id && (
            <>
              <div className="mellon-body-detial-item">
                <p>Goals</p>
                <div className="dropdown dropdown-end">
                  <div className="mellon-ext-details-circles">
                    <p className="mellon-goal-high">{singleGoal}</p>
                    <span
                      tabIndex={0}
                      className="mellon-more-goals"
                      onClick={() => mellonFetchUserGoals(mellonKeyData?.Goals)}
                    >
                      {mellonKeyData?.Goals?.length > 1 &&
                        singleGoal &&
                        ` +${mellonKeyData.Goals.length - 1} goal(s)`}
                    </span>
                  </div>

                  {/* more goals dropdown content */}
                  <ul
                    tabIndex={0}
                    className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
                  >
                    {loadingMoreGoals && (
                      <p className="more-goals-loading">Loading...</p>
                    )}
                    {!loadingMoreGoals &&
                      moreGoalsData &&
                      moreGoalsData?.map((elm) => {
                        return (
                          <li>
                            <p>{elm}</p>
                          </li>
                        );
                      })}
                  </ul>
                </div>

                {/* <div className="dropdown dropdown-end">
  <label tabIndex={0} className="btn m-1">Click</label>
  <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
    <li><a>Item 1</a></li>
    <li><a>Item 2</a></li>
  </ul>
</div> */}
              </div>
              <div className="mellon-body-detial-item">
                <p>Relationship Strength</p>
                <div className="mellon-ext-details-circles">
                  {new Array(mellonDynamicCircles(mellonKeyData))
                    .fill("")
                    .map((elm, idx) => {
                      return (
                        <img
                          src={
                            mellonDynamicCircles(mellonKeyData) > 1
                              ? chrome.runtime.getURL("/assets/circle-blue.svg")
                              : chrome.runtime.getURL("/assets/circle-red.svg")
                          }
                          alt="star"
                        />
                      );
                    })}
                  {new Array(3 - mellonDynamicCircles(mellonKeyData))
                    .fill("")
                    .map((elm, idx) => {
                      return (
                        <img
                          src={chrome.runtime.getURL("/assets/circle.svg")}
                          alt="star"
                        />
                      );
                    })}
                </div>
              </div>
              <div className="mellon-body-detial-item">
                <p>Potential Intros</p>
                <div className="mellon-ext-details-circles">
                  <img
                    src={chrome.runtime.getURL("/assets/users.svg")}
                    alt="user"
                  />
                  <p>0</p>
                </div>
              </div>
              <div className="mellon-body-detial-item">
                <p>Mutual Connections</p>
                <div className="mellon-ext-details-circles">
                  <p>
                    {mellonZeroOrMore &&
                      mellonKeyData["Mutual Connections"] && (
                        <a>{mellonKeyData["Mutual Connections"].length}</a>
                      )}
                    {mellonZeroOrMore &&
                      !mellonKeyData["Mutual Connections"] && (
                        <a onClick={() => setAndRedirectMutualPage("key")}>
                          View
                        </a>
                      )}
                    {!mellonZeroOrMore && <p>0</p>}
                  </p>
                </div>
              </div>
              <div class="mellon-body-detial-item mellon-user-note">
                <p>Notes</p>
                <textarea
                  class="textarea textarea-bordered"
                  value={mellonKeyData?.Notes}
                  rows="2"
                  placeholder="Nothing yet"
                  readOnly
                ></textarea>
              </div>
              <div class="mellon-user-note"></div>
            </>
          )}

          {/* if its potential intro */}
          {!mellonPotentialLoading &&
            mellonPotentialData &&
            mellonPotentialData?._id && (
              <>
                <div className="mellon-body-detial-item">
                  <p>Goals</p>
                  <div className="mellon-ext-details-circles">
                    <p className="mellon-goal-high">{singleGoal}</p>
                  </div>
                </div>
                <div className="mellon-body-detial-item">
                  <p>Priority</p>
                  <div className="mellon-ext-details-circles">
                    {new Array(
                      mellonDynamicCirclesPotential(mellonPotentialData)
                    )
                      .fill("")
                      .map((elm, idx) => {
                        return (
                          <img
                            src={
                              mellonDynamicCirclesPotential(
                                mellonPotentialData
                              ) > 1
                                ? chrome.runtime.getURL(
                                    "/assets/circle-blue.svg"
                                  )
                                : chrome.runtime.getURL(
                                    "/assets/circle-red.svg"
                                  )
                            }
                            alt="star"
                          />
                        );
                      })}
                    {new Array(
                      3 - mellonDynamicCirclesPotential(mellonPotentialData)
                    )
                      .fill("")
                      .map((elm, idx) => {
                        return (
                          <img
                            src={chrome.runtime.getURL("/assets/circle.svg")}
                            alt="star"
                          />
                        );
                      })}
                  </div>
                </div>
                <div className="mellon-body-detial-item">
                  <p>Key Mutual Connections</p>
                  <div className="mellon-ext-details-circles">
                    <img
                      src={chrome.runtime.getURL("/assets/users-active.svg")}
                      alt="user"
                    />
                    <p>
                      {mellonZeroOrMore &&
                        mellonPotentialData["Mutual Connections"] && (
                          <a>{keyMutualConnections.length}</a>
                        )}
                      {mellonZeroOrMore &&
                        !mellonPotentialData["Mutual Connections"] && (
                          <a
                            onClick={() =>
                              setAndRedirectMutualPage("potential")
                            }
                          >
                            View
                          </a>
                        )}
                      {!mellonZeroOrMore && <p>0</p>}
                    </p>
                  </div>
                </div>
                <div class="mellon-body-detial-item mellon-user-note">
                  <p>Notes</p>
                  <textarea
                    class="textarea textarea-bordered"
                    value={mellonPotentialData?.Notes}
                    rows="2"
                    placeholder="Nothing yet"
                    readOnly
                  ></textarea>
                </div>
                <div class="mellon-user-note"></div>
              </>
            )}

          {/* if it s not either */}
          {!mellonKeyLoading &&
            !mellonKeyData._id &&
            !mellonPotentialLoading &&
            !mellonPotentialData._id && (
              <>
                {/* <div className="mellon-body-detial-item">
                  <p>Priority</p>
                  <div className="mellon-ext-details-circles">
                    <img
                      src={chrome.runtime.getURL("/assets/circle.svg")}
                      alt="star"
                    />
                    <img
                      src={chrome.runtime.getURL("/assets/circle.svg")}
                      alt="star"
                    />
                    <img
                      src={chrome.runtime.getURL("/assets/circle.svg")}
                      alt="star"
                    />
                  </div>
                </div>
                <div className="mellon-body-detial-item">
                  <p>Relationship Strength</p>
                  <div className="mellon-ext-details-circles">
                    <img
                      src={chrome.runtime.getURL("/assets/circle.svg")}
                      alt="star"
                    />
                    <img
                      src={chrome.runtime.getURL("/assets/circle.svg")}
                      alt="star"
                    />
                    <img
                      src={chrome.runtime.getURL("/assets/circle.svg")}
                      alt="star"
                    />
                  </div>
                </div>
                <div className="mellon-body-detial-item">
                  <p>Potential Intros</p>
                  <div className="mellon-ext-details-circles">
                    <img
                      src={chrome.runtime.getURL("/assets/users.svg")}
                      alt="user"
                    />
                    <p>0</p>
                  </div>
                </div>
                <div className="mellon-body-detial-item">
                  <p>Mutual Connections</p>
                  <div className="mellon-ext-details-circles">
                    <p>
                      {mellonZeroOrMore ? (
                        <a
                          onClick={() => {
                            chrome.runtime.sendMessage({
                              from: "openUserUrl",
                              url: mellonMutualLink,
                            });
                          }}
                        >
                          More
                        </a>
                      ) : (
                        "0"
                      )}
                    </p>
                  </div>
                </div> */}
              </>
            )}
        </>
      </div>
    </>
  );
};

export default SingleUser;
