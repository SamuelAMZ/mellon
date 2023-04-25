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

  // get user first details
  let userLinked = null;
  chrome.storage.local.get("uid", function (item) {
    if (item.uid) {
      userLinked = item.uid;
    }
    if (!item.uid) {
      userLinked = null;
    }
  });
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  const grabUserDetails = async () => {
    //   wait 1sec
    await delay(300);

    //   start scraping
    const userDetailsObj = {};

    //   user id
    userDetailsObj.uid = userLinked;

    //   get url
    chrome.runtime.sendMessage({ from: "getActualLink" }, (data) => {
      userDetailsObj.url = data.url;
    });

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

    // set first degree or not
    setIsFirstDegree(isOrNot);

    // set user details
    setUserDetails(userDetailsObj);
  };

  // update user details
  const handleConnectionsList = async () => {
    await delay(100);
    return await postReq(
      {
        uid: userDetails?.uid,
        linkedinUrl: userDetails?.url,
      },
      "/api/key-relation"
    );
  };
  const {
    data: mellonKeyData,
    isLoading: mellonKeyLoading,
    refetch: getPaginate,
  } = useQuery(["key-list", userDetails?.fullName], handleConnectionsList, {
    refetchOnWindowFocus: false,
    enabled: true,
  });

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

  // ad potential intro
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
            {!mellonKeyLoading &&
              mellonKeyData &&
              mellonKeyData.code === "ok" && (
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

        {/* when it s not either */}
        {
          <>
            {!mellonKeyLoading &&
              mellonKeyData &&
              mellonKeyData.code === "bad" && (
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
          {mellonKeyLoading && <p>Loading...</p>}

          {/* if it s key relation */}
          {!mellonKeyLoading &&
            mellonKeyData &&
            mellonKeyData.code === "ok" && (
              <>
                <div className="mellon-body-detial-item">
                  <p>Professional Value</p>
                  <div className="mellon-ext-details-circles">
                    {new Array(
                      Number(
                        mellonKeyData?.payload?.userFinded?.professionalValue
                      )
                    )
                      .fill("")
                      .map((elm, idx) => {
                        return (
                          <img
                            src={chrome.runtime.getURL(
                              "/assets/circle-blue.svg"
                            )}
                            alt="star"
                          />
                        );
                      })}
                    {new Array(
                      3 -
                        Number(
                          mellonKeyData?.payload?.userFinded?.professionalValue
                        )
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
                  <p>Relationship Strength</p>
                  <div className="mellon-ext-details-circles">
                    {new Array(
                      Number(
                        mellonKeyData?.payload?.userFinded?.relationshipStrength
                      )
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
                        Number(
                          mellonKeyData?.payload?.userFinded
                            ?.relationshipStrength
                        )
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
                    <p>0</p>
                  </div>
                </div>
                <div class="mellon-body-detial-item mellon-user-note">
                  <p>Notes</p>
                  <textarea
                    class="textarea textarea-bordered"
                    value={mellonKeyData?.payload?.userFinded?.notes}
                    rows="2"
                    placeholder="Nothing yet"
                  ></textarea>
                </div>
                <div class="mellon-user-note"></div>
              </>
            )}

          {/* if its potential intro */}

          {/* if it s not either */}
          {((!mellonKeyLoading &&
            mellonKeyData &&
            mellonKeyData.code === "bad") ||
            (!mellonKeyLoading && !mellonKeyData)) && (
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
                  <p>0</p>
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
