import React, { useState, useEffect, useContext } from "react";

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
        `https://mellon.app/version-test/api/1.1/obj/connection?constraints=[ { "key": "Linkedin URL", "constraint_type": "equals", "value": ${JSON.stringify(
          linkedinUrl
        )} }, { "key": "Is Key Relationship", "constraint_type": "equals", "value": "true" } ]`,
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
        `https://mellon.app/version-test/api/1.1/obj/potentialIntro?constraints=[ { "key": "Linkedin URL", "constraint_type": "equals", "value": ${JSON.stringify(
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
        if (mellonKeyData.Goals) {
          goalIdToSend = mellonKeyData.Goals;
        }
        if (mellonPotentialData.Goal) {
          goalIdToSend = mellonPotentialData.Goal;
        }

        const req = await fetch(
          `https://mellon.app/version-test/api/1.1/obj/goal?constraints=[ { "key": "_id", "constraint_type": "equals", "value": ${JSON.stringify(
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
    // document.querySelector(".artdeco-card div.ph5.pb5 > a.app-aware-link").href

    // detect the classname
    waitForClass(".artdeco-card div.ph5.pb5 > a.app-aware-link", function () {
      setMellonZeroOrMore(true);

      // set mutual link
      let mutuallLink = document.querySelector(
        ".artdeco-card div.ph5.pb5 > a.app-aware-link"
      ).href;
      setMellonMutualLink(mutuallLink);
    });
  };
  useEffect(() => {
    detectIfMoreMutualConnection();
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
                <a className="link">View in mellon</a>

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
                  <div className="mellon-key-or-not">
                    <img
                      src={chrome.runtime.getURL("/assets/start.svg")}
                      alt="star"
                    />
                    <p>Connection (Not a Key Relationship)</p>
                  </div>
                  {isFirstDegree ? (
                    <button
                      className="mellon-ext-btn btn btn-primary w-full"
                      onClick={addNewRelationView}
                    >
                      + Add Key Relationship
                    </button>
                  ) : (
                    <button
                      className="mellon-ext-btn btn btn-primary w-full"
                      onClick={addPotentialIntroView}
                    >
                      + Add Potential Intro
                    </button>
                  )}

                  <div className="mellon-ext-sep mellon-user-section"></div>
                </>
              )}
          </>
        }
      </div>

      <div className="mellon-ext-user-details-body">
        <>
          {(mellonKeyLoading || mellonPotentialLoading) && <p>Loading...</p>}

          {/* if it s key relation */}
          {!mellonKeyLoading && mellonKeyData && mellonKeyData?._id && (
            <>
              <div className="mellon-body-detial-item">
                <p>Goals</p>
                <div className="mellon-ext-details-circles">
                  <p className="mellon-goal-high">{singleGoal}</p>
                </div>
              </div>
              <div className="mellon-body-detial-item">
                <p>Relationship Strength</p>
                <div className="mellon-ext-details-circles">
                  {new Array(
                    (() => {
                      if (
                        mellonKeyData?.["Relationship Strength"] === "Low" ||
                        !mellonKeyData?.["Relationship Strength"] ||
                        mellonKeyData?.["Relationship Strength"] === "N/A"
                      ) {
                        return 1;
                      }
                      if (
                        mellonKeyData?.["Relationship Strength"] === "Medium"
                      ) {
                        return 2;
                      }
                      if (mellonKeyData?.["Relationship Strength"] === "High") {
                        return 3;
                      }
                    })()
                  )
                    .fill("")
                    .map((elm, idx) => {
                      return (
                        <img
                          src={chrome.runtime.getURL("/assets/circle-red.svg")}
                          alt="star"
                        />
                      );
                    })}
                  {new Array(
                    3 -
                      (() => {
                        if (
                          mellonKeyData?.["Relationship Strength"] === "Low" ||
                          !mellonKeyData?.["Relationship Strength"] ||
                          mellonKeyData?.["Relationship Strength"] === "N/A"
                        ) {
                          return 1;
                        }
                        if (
                          mellonKeyData?.["Relationship Strength"] === "Medium"
                        ) {
                          return 2;
                        }
                        if (
                          mellonKeyData?.["Relationship Strength"] === "High"
                        ) {
                          return 3;
                        }
                      })()
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
                          chrome.tabs.create({ url: mellonMutualLink });
                        }}
                      >
                        More
                      </a>
                    ) : (
                      "0"
                    )}
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
                      (() => {
                        if (
                          mellonPotentialData?.Priority === "Low" ||
                          !mellonPotentialData?.Priority
                        ) {
                          return 1;
                        }
                        if (mellonPotentialData?.Priority === "Medium") {
                          return 2;
                        }
                        if (mellonPotentialData?.Priority === "High") {
                          return 3;
                        }
                      })()
                    )
                      .fill("")
                      .map((elm, idx) => {
                        return (
                          <img
                            src={chrome.runtime.getURL(
                              "/assets/circle-red.svg"
                            )}
                            alt="star"
                          />
                        );
                      })}
                    {new Array(
                      3 -
                        (() => {
                          if (
                            mellonPotentialData?.Priority === "Low" ||
                            !mellonPotentialData?.Priority
                          ) {
                            return 1;
                          }
                          if (mellonPotentialData?.Priority === "Medium") {
                            return 2;
                          }
                          if (mellonPotentialData?.Priority === "High") {
                            return 3;
                          }
                        })()
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
                </div>
                <div className="mellon-body-detial-item">
                  <p>Other Mutual Connections</p>
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
                <div className="mellon-body-detial-item">
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
                </div>
              </>
            )}
        </>
      </div>
    </>
  );
};

export default SingleUser;
