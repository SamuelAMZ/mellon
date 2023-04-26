import React, { useState, useContext, useEffect } from "react";

// react query
import { useQuery } from "react-query";

// contexts
import VisibleScrensContext from "../contexts/visibleScreens";

// components
import HomeScreen from "./HomeScreen";

const FirstScreen = () => {
  const { screen, changeScreen } = useContext(VisibleScrensContext);

  const [userDetails, setUserDetails] = useState(null);
  const [isFirstDegree, setIsFirstDegree] = useState(false);

  useEffect(() => {
    // getActualLink
    chrome.runtime.sendMessage({ from: "getActualLink" }, (data) => {
      if (data.url.split("/in/")[0] === "https://www.linkedin.com") {
        changeScreen({
          first: false,
          menu: false,
          connections: true,
          singleUser: true,
          connectionList: false,
          newKey: false,
          potential: false,
        });
      }
    });
  }, []);

  // check user before loading the screens
  const checkUserAndLoadScreens = async () => {
    // check user auth
    chrome.runtime.sendMessage({ from: "auth_check" }, (data) => {
      // error
      if (data.user === false) {
        changeScreen({
          first: false,
          login: true,
          menu: false,
          connections: true,
          singleUser: false,
          connectionList: false,
        });
        return;
      }

      // if not met just show the default back page
      if (data.user === true) {
        // if authed
        changeScreen({
          first: false,
          login: false,
          menu: true,
          connections: true,
          singleUser: false,
          connectionList: false,
        });
      }
    });
  };

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

  useEffect(() => {
    (async () => {
      // grab first detail
      await grabUserDetails();
    })();
  }, []);

  // keep track of the page, when it changed
  useEffect(() => {
    let mellonUserCheck = setInterval(async () => {
      await grabUserDetails();
    }, 500);

    return () => clearInterval(mellonUserCheck);
  }, []);

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

      const req = await fetch(
        `https://mellon.app/version-test/api/1.1/obj/connection?constraints=[ { "key": "linkedin_url_text", "constraint_type": "equals", "value": ${JSON.stringify(
          userDetails?.url
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

      const req = await fetch(
        `https://mellon.app/version-test/api/1.1/obj/potentialIntro?constraints=[ { "key": "linkedin_url_text", "constraint_type": "equals", "value": ${JSON.stringify(
          userDetails?.url
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

  return (
    <>
      {/* first screen for key relations */}
      {screen.first && mellonKeyData && mellonKeyData?._id && (
        <div
          class="mellon-ext-default-container"
          onClick={() => checkUserAndLoadScreens()}
        >
          {/* logo */}
          <img
            class="mellon-ext-logo"
            src={chrome.runtime.getURL("/assets/logo.png")}
            alt="logo"
          />

          {/* star */}
          <img
            src={chrome.runtime.getURL("/assets/start-active.svg")}
            alt="star"
          />

          {/* circles */}
          <div class="mellon-ext-first-circles">
            {new Array(
              (() => {
                if (
                  mellonKeyData?.relationship_strength_option_relationship_strength ===
                  "Low"
                ) {
                  return 1;
                }
                if (
                  mellonKeyData?.relationship_strength_option_relationship_strength ===
                  "Medium"
                ) {
                  return 2;
                }
                if (
                  mellonKeyData?.relationship_strength_option_relationship_strength ===
                  "High"
                ) {
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
                    mellonKeyData?.relationship_strength_option_relationship_strength ===
                    "Low"
                  ) {
                    return 1;
                  }
                  if (
                    mellonKeyData?.relationship_strength_option_relationship_strength ===
                    "Medium"
                  ) {
                    return 2;
                  }
                  if (
                    mellonKeyData?.relationship_strength_option_relationship_strength ===
                    "High"
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

          {/* users */}
          <div class="mellon-ext-user">
            <img src={chrome.runtime.getURL("/assets/users.svg")} alt="user" />
            <p>0</p>
          </div>
        </div>
      )}

      {/* first screen for potential relations */}
      {screen.first && mellonPotentialData && mellonPotentialData?._id && (
        <div
          class="mellon-ext-default-container"
          onClick={() => checkUserAndLoadScreens()}
        >
          {/* logo */}
          <img
            class="mellon-ext-logo"
            src={chrome.runtime.getURL("/assets/logo.png")}
            alt="logo"
          />

          {/* star */}
          <img
            src={chrome.runtime.getURL("/assets/users-active.svg")}
            alt="star"
          />

          {/* circles */}
          <div class="mellon-ext-first-circles">
            {new Array(
              (() => {
                if (mellonPotentialData?.priority_option_priority === "Low") {
                  return 1;
                }
                if (
                  mellonPotentialData?.priority_option_priority === "Medium"
                ) {
                  return 2;
                }
                if (mellonPotentialData?.priority_option_priority === "High") {
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
                  if (mellonPotentialData?.priority_option_priority === "Low") {
                    return 1;
                  }
                  if (
                    mellonPotentialData?.priority_option_priority === "Medium"
                  ) {
                    return 2;
                  }
                  if (
                    mellonPotentialData?.priority_option_priority === "High"
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

          {/* users */}
          <div class="mellon-ext-user">
            <img
              src={chrome.runtime.getURL("/assets/start-active.svg")}
              alt="user"
            />
            <p>0</p>
          </div>
        </div>
      )}

      {/* fallback */}
      {screen.first &&
        mellonKeyData &&
        !mellonKeyData?._id &&
        !mellonPotentialData?._id && (
          <div
            class="mellon-ext-default-container"
            onClick={() => checkUserAndLoadScreens()}
          >
            {/* logo */}
            <img
              class="mellon-ext-logo"
              src={chrome.runtime.getURL("/assets/logo.png")}
              alt="logo"
            />

            {/* star */}
            <img src={chrome.runtime.getURL("/assets/start.svg")} alt="star" />

            {/* circles */}
            <div class="mellon-ext-first-circles">
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

            {/* users */}
            <div class="mellon-ext-user">
              <img
                src={chrome.runtime.getURL("/assets/users.svg")}
                alt="user"
              />
              <p>0</p>
            </div>
          </div>
        )}

      {screen.connections && <HomeScreen />}
    </>
  );
};

export default FirstScreen;
