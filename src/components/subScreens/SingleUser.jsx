import React, { useState, useEffect, useContext } from "react";

// comps
import Loading from "./Loading";
import Nothing from "./Nothing";
import GoalSelector from "./GoalSelector";
import AddNewKeyRelation from "./AddNewKeyRelation";
import AddMutualConnection from "./AddMutualConnection";
import AddMutualManually from "./AddMutualManually";

// react query
import { useQuery, useQueryClient } from "react-query";

// helpers
import postReq from "../../helpers/postReq";
import removeExtraStrings from "../../helpers/removeExtra";

// contexts
import VisibleScrensContext from "../../contexts/visibleScreens";
import GoalsSelectorVisibleContext from "../../contexts/GoalSelectorVisible";
import AddManuallyContext from "../../contexts/AddManually";

// icons
import { IoIosArrowBack } from "react-icons/io";
import { CgProfile } from "react-icons/cg";
import {
  AiOutlineEye,
  AiOutlineArrowRight,
  AiTwotoneStar,
} from "react-icons/ai";

const SingleUser = () => {
  const { screen, changeScreen } = useContext(VisibleScrensContext);
  const { addManually, changeAddManually } = useContext(AddManuallyContext);

  const [userDetails, setUserDetails] = useState(null);
  const [isFirstDegree, setIsFirstDegree] = useState(false);
  const [singleGoal, setSingleGoal] = useState("");
  const [singleGoalId, setSingleGoalId] = useState("");

  // mutual more
  const [mellonZeroOrMore, setMellonZeroOrMore] = useState(false);
  const [mellonMutualLink, setMellonMutualLink] = useState("");

  // loading user more goals
  const [loadingMoreGoals, setLoadingMoreGoals] = useState(false);
  const [moreGoalsData, setMoreGoalsData] = useState(null);

  // key mutual connections state
  const [keyMutualConnections, setKeyMutualConnections] = useState([]);
  const [showKeyMutuals, setShowKeyMutuals] = useState(false);

  // potential intro of key
  const [keyPotentialsIntros, setKeyPotentialsIntros] = useState([]);
  const [showKeyPotentials, setShowKeyPotentials] = useState(false);

  // add mutual connection manually view
  const [showManuallyAdded, setManuallyAdded] = useState(false);

  // notes state
  const [originalNoteText, setOriginalNoteText] = useState("...");
  const [originalNoteTextPotential, setOriginalNoteTextPotential] =
    useState("");

  // context for goals selector widget
  const { goalsSelectorVisible, changeGoalsSelectorVisible } = useContext(
    GoalsSelectorVisibleContext
  );

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

    // profile photo
    let photo = document.querySelector(
      "button.pv-top-card-profile-picture img"
    )?.src;
    userDetailsObj.profilePhoto = photo ? photo : "";

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

      let mellonUserName = removeExtraStrings(userDetails?.fullName?.trim());

      const req = await fetch(
        `https://buckfifty.com/version-test/api/1.1/wf/get-connection?full_name=${mellonUserName}&created_by=${userDetails?.uid}`,
        requestOptions
      );
      let result = await req.json();

      if (result?.status !== "success") return [];

      if (result?.response?.Connection["Is Key Relationship"] !== true)
        return [];

      return result?.response?.Connection;
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

      let linkedinUrl = encodeURIComponent(
        mellonNormalizeLinkedinUrl(userDetails?.url)
      );

      const req = await fetch(
        `https://buckfifty.com/version-test/api/1.1/obj/potentialIntro?constraints=[ { "key": "Linkedin URL", "constraint_type": "equals", "value": ${JSON.stringify(
          linkedinUrl
        )} } ]`,
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
        setSingleGoalId(result?.response?.results[0]._id);
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

    // reset page default hide mutual connection
    setShowKeyMutuals(false);
    setShowKeyPotentials(false);
  }, []);

  // keep track of the page, when it changed
  useEffect(() => {
    let mellonUserCheck = setInterval(async () => {
      await grabUserDetails();
    }, 500);

    return () => clearInterval(mellonUserCheck);
  }, []);

  const mellonBackToMenu = () => {
    if (showKeyMutuals) {
      return setShowKeyMutuals(false);
    }
    if (showKeyPotentials) {
      return setShowKeyPotentials(false);
    }
    if (addManually.active && addManually.previousView === "key") {
      changeAddManually(false);
      setShowKeyMutuals(true);
      return;
    }
    if (addManually.active && addManually.previousView === "potential") {
      changeAddManually(false);
      setShowKeyPotentials(true);
      return;
    }

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
      ".artdeco-card div > a.app-aware-link.inline-flex"
    );
    if (mutualConnetionExist) {
      setMellonZeroOrMore(true);

      // set mutual link
      let mutuallLink = document.querySelector(
        ".artdeco-card div > a.app-aware-link.inline-flex"
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
      !mellonKeyData?.["Relationship Strength"] ||
      mellonKeyData?.["Relationship Strength"] === "N/A"
    ) {
      return 0;
    }
    if (mellonKeyData?.["Relationship Strength"] === "Low") {
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
      !mellonPotentialData?.Priority ||
      mellonPotentialData?.Priority === "N/A"
    ) {
      return 0;
    }
    if (mellonPotentialData?.Priority === "Low") {
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

    // get potential intro id
    let potentialIntroId = mellonPotentialData?._id;
    // get potential intro goal id
    let goalId = singleGoalId;

    await delay(200);

    // set actual user linkedin url and key or potential in localstorage
    chrome.storage.local.set(
      {
        currentMutualUrl: userLink,
        currentMutualType: keyOrPotential,
        potential_id: potentialIntroId,
        goal_id: goalId,
      },
      function () {
        console.log("set new current mutual page user");
      }
    );

    await delay(200);

    console.log(keyOrPotential);

    // redirect to mutual url
    if (keyOrPotential === "potential") {
      chrome.runtime.sendMessage({
        from: "mutualActionPotential",
        url: mellonMutualLink,
      });
      return;
    }

    chrome.runtime.sendMessage({
      from: "mutualAction",
      url: mellonMutualLink,
    });
  };

  // redirect to mellon
  const mellonRedirectToMellon = async (uid) => {
    let url = `https://buckfifty.com/version-test/core-network/${uid}`;

    chrome.runtime.sendMessage({
      from: "openUserUrl",
      url: url,
    });
  };

  // get key relationships data
  const mellonGetUserKeyRelationships = async () => {
    const mellonCheckProfile = async () => {
      let userToken = "";
      let uid = "";
      chrome.storage.local.get("utoken", function (item) {
        userToken = item.utoken;
      });
      chrome.storage.local.get("uid", function (item) {
        uid = item.uid;
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
        `https://buckfifty.com/version-test/api/1.1/obj/connection?constraints=[ { "key": "is_key_relationship_boolean", "constraint_type": "equals", "value": "true" }, { "key": "Created By", "constraint_type": "equals", "value": ${JSON.stringify(
          uid
        )} } ]`,
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
    // reset page default hide mutual connection
    setShowKeyMutuals(false);
    setShowKeyPotentials(false);

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

    let keyUserData = [];
    for (let xy = 0; xy < matches.length; xy++) {
      for (let yx = 0; yx < keyRelations.length; yx++) {
        if (matches[xy] === keyRelations[yx]._id) {
          keyUserData.push(keyRelations[yx]);
        }
      }
    }
    setKeyMutualConnections(keyUserData);
  }, [keyRelations, mellonKeyData, mellonPotentialData]);

  // redirect to profile on click
  const redirectOnClick = (url) => {
    chrome.runtime.sendMessage({ from: "openUserUrl", url: url });
  };

  // get key potential intros
  useEffect(() => {
    if (!mellonKeyData) return;

    // get potential one by one and set the state
    (async () => {
      let myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + userDetails?.utoken);

      let requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      let dataFound = [];

      for (let i = 0; i < mellonKeyData["Potential Intros"]?.length; i++) {
        const req = await fetch(
          `https://buckfifty.com/version-test/api/1.1/obj/potentialIntro?constraints=[ { "key": "_id", "constraint_type": "equals", "value": ${JSON.stringify(
            mellonKeyData["Potential Intros"][i]
          )} } ]`,
          requestOptions
        );

        let result = await req.json();

        if (result?.response?.results.length > 0) {
          dataFound.push(result?.response?.results[0]);
        }
      }

      setKeyPotentialsIntros(dataFound);
    })();
  }, [mellonKeyData]);

  // update notes textarea onclick
  const updateNotesTextarea = async () => {
    if (!mellonKeyData) return;

    window.addEventListener("click", async () => {
      // get original text
      // get actual text
      // compare
      // if not diferrent return
      // if different send PUT request for updating notes

      // actual notes
      let originalNotes = mellonKeyData?.Notes;
      let actualNotes = document.querySelector("#mellon-notes-field")?.value;

      if (!actualNotes || typeof actualNotes === undefined) return;

      if (originalNotes?.trim() === actualNotes?.trim()) return;

      let myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
      myHeaders.append("Authorization", "Bearer " + userToken);

      var urlencoded = new URLSearchParams();
      urlencoded.append("Notes", actualNotes?.trim());

      var requestOptions = {
        method: "PATCH",
        headers: myHeaders,
        body: urlencoded,
        redirect: "follow",
      };

      const response = await fetch(
        `https://buckfifty.com/version-test/api/1.1/obj/connection/${mellonKeyData?._id}`,
        requestOptions
      );
    });
  };
  useEffect(() => {
    if (mellonKeyData) {
      setOriginalNoteText(mellonKeyData?.Notes);
    }

    (async () => {
      await updateNotesTextarea();
    })();
  }, [mellonKeyData]);

  // update relationship strength key
  const updateRelationsStrength = async (idx) => {
    let strength = null;
    if (idx === 0) strength = "Low";
    if (idx === 1) strength = "Medium";
    if (idx === 2) strength = "High";

    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("Authorization", "Bearer " + userToken);

    var urlencoded = new URLSearchParams();
    urlencoded.append("Relationship Strength", strength);

    var requestOptions = {
      method: "PATCH",
      headers: myHeaders,
      body: urlencoded,
      redirect: "follow",
    };

    const response = await fetch(
      `https://buckfifty.com/version-test/api/1.1/obj/connection/${mellonKeyData?._id}`,
      requestOptions
    );
    await getPaginate();
  };

  // update notes textarea onclick potential
  const updateNotesTextareaPotential = async () => {
    if (!mellonPotentialData) return;

    window.addEventListener("click", async () => {
      // get original text
      // get actual text
      // compare
      // if not diferrent return
      // if different send PUT request for updating notes

      // actual notes
      let originalNotesPotential = mellonPotentialData?.Notes;
      let actualNotesPotential = document.querySelector(
        "#mellon-notes-field-potential"
      )?.value;

      // console.log(originalNotes, "-", actualNotes);

      if (originalNotesPotential?.trim() === actualNotesPotential?.trim())
        return;

      let myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
      myHeaders.append("Authorization", "Bearer " + userToken);

      var urlencoded = new URLSearchParams();
      urlencoded.append("Notes", actualNotesPotential.trim());

      var requestOptions = {
        method: "PATCH",
        headers: myHeaders,
        body: urlencoded,
        redirect: "follow",
      };

      const response = await fetch(
        `https://buckfifty.com/version-test/api/1.1/obj/potentialIntro/${mellonPotentialData?._id}`,
        requestOptions
      );
    });
  };
  useEffect(() => {
    if (mellonPotentialData) {
      setOriginalNoteTextPotential(mellonPotentialData?.Notes);
    }

    (async () => {
      await updateNotesTextareaPotential();
    })();
  }, [mellonPotentialData]);

  // update priority potential
  const updatePriority = async (idx) => {
    let strength = null;
    if (idx === 0) strength = "Low";
    if (idx === 1) strength = "Medium";
    if (idx === 2) strength = "High";

    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("Authorization", "Bearer " + userToken);

    var urlencoded = new URLSearchParams();
    urlencoded.append("Priority", strength);

    var requestOptions = {
      method: "PATCH",
      headers: myHeaders,
      body: urlencoded,
      redirect: "follow",
    };

    const response = await fetch(
      `https://buckfifty.com/version-test/api/1.1/obj/potentialIntro/${mellonPotentialData?._id}`,
      requestOptions
    );
    await getPotentialPaginate();
  };

  // update basic info everytime
  const mellonUpdateBasicInfo = async (data, type) => {
    let userToken = null;
    chrome.storage.local.get("utoken", function (item) {
      if (item.utoken) {
        userToken = item.utoken;
      }
      if (!item.utoken) {
        userToken = null;
      }
    });
    await delay(200);

    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("Authorization", "Bearer " + userToken);

    let linkedinUrl = mellonNormalizeLinkedinUrl(userDetails?.url);

    var urlencoded = new URLSearchParams();
    urlencoded.append("Linkedin Description", userDetails?.actualRole);
    urlencoded.append("Linkedin URL", linkedinUrl);
    urlencoded.append("Profile Photo", userDetails?.profilePhoto);

    var requestOptions = {
      method: "PATCH",
      headers: myHeaders,
      body: urlencoded,
      redirect: "follow",
    };

    // if connection
    if (type === "connection") {
      await fetch(
        `https://buckfifty.com/version-test/api/1.1/obj/connection/${data?._id}`,
        requestOptions
      );
    }

    // if potential intro
    if (type === "potential") {
      await fetch(
        `https://buckfifty.com/version-test/api/1.1/obj/potentialIntro/${data?._id}`,
        requestOptions
      );
    }
  };

  useEffect(() => {
    (async () => {
      if (mellonKeyData) {
        await mellonUpdateBasicInfo(mellonKeyData, "connection");
      }
      if (mellonPotentialData) {
        await mellonUpdateBasicInfo(mellonPotentialData, "potential");
      }
    })();
  }, [mellonKeyData, mellonPotentialData]);

  // kepp check if the add mutuals manually view get to active to set other views to false
  useEffect(() => {
    if (addManually.active && addManually.previousView === "potential") {
      setShowKeyPotentials(false);
    }
    if (addManually.active && addManually.previousView === "key") {
      setShowKeyMutuals(false);
    }
  }, [addManually.active]);

  return (
    <>
      <div className="mellon-ext-user-details">
        <label className="back-btn" onClick={mellonBackToMenu}>
          <IoIosArrowBack /> Back
        </label>

        <div className="mellon-single-user-setails">
          <h2>
            {userDetails &&
              removeExtraStrings(userDetails?.fullName?.substr(0, 30))}
            {userDetails &&
              removeExtraStrings(userDetails?.fullName?.length >= 30 && "...")}
          </h2>
          {/* <h3>
            {userDetails && userDetails?.actualRole?.substr(0, 28)}
            {userDetails && userDetails?.actualRole?.length >= 28 && "..."}
          </h3> */}
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
                  View in BuckFifty
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
                    View in BuckFifty
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
                  <div className="mellon-add-new">
                    <AddNewKeyRelation refresh={getPaginate} />

                    <span>OR</span>

                    <button
                      className="mellon-ext-btn btn btn-primary w-full mellon-fallback-btn"
                      onClick={addPotentialIntroView}
                    >
                      + Add Potential Intro
                    </button>
                  </div>

                  {/* <div className="mellon-ext-sep mellon-user-section"></div> */}
                </>
              )}
          </>
        }
      </div>

      {/* (normal) view withour key relations */}
      {!showKeyPotentials && !showKeyMutuals && !addManually.active && (
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
                      {mellonKeyData?.Goals?.length >= 1 && (
                        <p className="mellon-goal-high" title={singleGoal}>
                          {singleGoal?.substr(0, 10)}
                          {singleGoal?.length >= 10 && "..."}
                        </p>
                      )}

                      <span
                        tabIndex={0}
                        className="mellon-more-goals"
                        onClick={() =>
                          mellonFetchUserGoals(mellonKeyData?.Goals)
                        }
                      >
                        {mellonKeyData?.Goals?.length > 1 &&
                          singleGoal &&
                          ` +${mellonKeyData.Goals.length - 1} goal(s)`}
                      </span>

                      {/* when no goal */}
                      {(mellonKeyData?.Goals?.length === 0 ||
                        !mellonKeyData?.Goals) && (
                        <p
                          className="mellon-goal-high add-mellon-goal-high"
                          onClick={() => changeGoalsSelectorVisible(true)}
                        >
                          + Add Goal
                        </p>
                      )}
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
                        moreGoalsData?.map((elm, idx) => {
                          if (idx === 0) return;
                          return (
                            <li title={elm}>
                              <p>
                                {elm?.substr(0, 10)}
                                {elm?.length >= 10 && "..."}
                              </p>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                </div>
                <div className="mellon-body-detial-item">
                  <p>Relationship Quality</p>
                  <div className="mellon-ext-details-circles mellon-ext-details-circles-circles mellon-relation-quality">
                    {new Array(mellonDynamicCircles(mellonKeyData))
                      .fill("")
                      .map((elm, idx) => {
                        return (
                          <img
                            id={idx}
                            key={idx}
                            // onClick={() => updateRelationsStrength(idx)}
                            src={
                              mellonDynamicCircles(mellonKeyData) >= 3
                                ? chrome.runtime.getURL(
                                    "/assets/circle-blue.svg"
                                  )
                                : mellonDynamicCircles(mellonKeyData) === 2
                                ? chrome.runtime.getURL(
                                    "/assets/circle-yellow.svg"
                                  )
                                : mellonDynamicCircles(mellonKeyData) === 1
                                ? chrome.runtime.getURL(
                                    "/assets/circle-red.svg"
                                  )
                                : mellonDynamicCircles(mellonKeyData) <= 0
                                ? chrome.runtime.getURL("/assets/circle.svg")
                                : chrome.runtime.getURL("/assets/circle.svg")
                            }
                          />
                        );
                      })}
                    {new Array(3 - mellonDynamicCircles(mellonKeyData))
                      .fill("")
                      .map((elm, idx) => {
                        return (
                          <img
                            id={mellonDynamicCircles(mellonKeyData) + idx}
                            // onClick={() =>
                            //   updateRelationsStrength(
                            //     mellonDynamicCircles(mellonKeyData) + idx
                            //   )
                            // }
                            src={chrome.runtime.getURL("/assets/circle.svg")}
                            alt="star"
                          />
                        );
                      })}
                  </div>
                </div>
                <div className="mellon-body-detial-item">
                  <p>Potential Intros</p>
                  {/* <div className="mellon-ext-details-circles">
                    <a
                      className="mellon-user-scraped-container"
                      onClick={() => setShowKeyPotentials(true)}
                    >
                      {mellonKeyData?.["Potential Intros"] &&
                      mellonKeyData?.["Potential Intros"]?.length !== 0 ? (
                        <div className="mellon-user-users-scraped">
                          <AiTwotoneStar />
                          {mellonKeyData?.["Potential Intros"]?.length}
                        </div>
                      ) : (
                        "+ Add"
                      )}
                    </a>
                  </div> */}
                  <div className="mellon-ext-details-circles">
                    <img
                      src={chrome.runtime.getURL("/assets/users-active.svg")}
                      alt="user"
                    />
                    <a onClick={() => setShowKeyPotentials(true)}>
                      {mellonKeyData?.["Potential Intros"]?.length
                        ? mellonKeyData?.["Potential Intros"]?.length
                        : "0"}
                    </a>
                  </div>
                </div>
                <div class="mellon-body-detial-item mellon-user-note">
                  <p>Notes</p>
                  <textarea
                    id="mellon-notes-field"
                    class="textarea textarea-bordered"
                    value={originalNoteText}
                    onChange={(e) => {
                      setOriginalNoteText(e.target.value);
                    }}
                    rows="2"
                    placeholder="Nothing yet"
                  ></textarea>
                </div>
                <div class="mellon-user-note"></div>

                {/* select goals widget */}
                {goalsSelectorVisible && (
                  <GoalSelector
                    strenth={mellonKeyData?.["Relationship Strength"]}
                    refresh={getPaginate}
                  />
                )}
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
                      <p className="mellon-goal-high" title={singleGoal}>
                        {singleGoal?.substr(0, 10)}
                        {singleGoal?.length >= 10 && "..."}
                      </p>
                    </div>
                  </div>
                  <div className="mellon-body-detial-item">
                    <p>Priority</p>
                    <div className="mellon-ext-details-circles mellon-ext-details-circles-circles">
                      {new Array(
                        mellonDynamicCirclesPotential(mellonPotentialData)
                      )
                        .fill("")
                        .map((elm, idx) => {
                          return (
                            <img
                              id={idx}
                              onClick={() => updatePriority(idx)}
                              src={
                                mellonDynamicCirclesPotential(
                                  mellonPotentialData
                                ) >= 3
                                  ? chrome.runtime.getURL(
                                      "/assets/circle-blue.svg"
                                    )
                                  : mellonDynamicCirclesPotential(
                                      mellonPotentialData
                                    ) === 2
                                  ? chrome.runtime.getURL(
                                      "/assets/circle-yellow.svg"
                                    )
                                  : mellonDynamicCirclesPotential(
                                      mellonPotentialData
                                    ) === 1
                                  ? chrome.runtime.getURL(
                                      "/assets/circle-red.svg"
                                    )
                                  : mellonDynamicCirclesPotential(
                                      mellonPotentialData
                                    ) <= 0
                                  ? chrome.runtime.getURL("/assets/circle.svg")
                                  : chrome.runtime.getURL("/assets/circle.svg")
                              }
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
                              id={idx}
                              onClick={() =>
                                updatePriority(
                                  mellonDynamicCirclesPotential(
                                    mellonPotentialData
                                  ) + idx
                                )
                              }
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
                      <a
                        className="mellon-user-scraped-container"
                        onClick={() => setShowKeyMutuals(true)}
                      >
                        {mellonPotentialData["Mutual Connections"] &&
                        mellonPotentialData["Mutual Connections"]?.length !==
                          0 ? (
                          <div className="mellon-user-users-scraped">
                            <AiTwotoneStar />
                            {mellonPotentialData["Mutual Connections"]?.length}
                          </div>
                        ) : (
                          "+ Add"
                        )}
                      </a>
                      {/* <p>
                        {mellonZeroOrMore &&
                          mellonPotentialData["Mutual Connections"] && (
                            <a onClick={() => setShowKeyMutuals(true)}>
                              {keyMutualConnections.length}
                            </a>
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
                      </p> */}
                    </div>
                  </div>
                  <div class="mellon-body-detial-item mellon-user-note">
                    <p>Notes</p>
                    <textarea
                      id="mellon-notes-field-potential"
                      class="textarea textarea-bordered"
                      rows="2"
                      placeholder="Nothing yet"
                      value={originalNoteTextPotential}
                      onChange={(e) => {
                        setOriginalNoteTextPotential(e.target.value);
                      }}
                    ></textarea>
                  </div>
                  <div class="mellon-user-note"></div>
                </>
              )}
          </>
        </div>
      )}

      {/* view with potential intro of key */}
      {showKeyPotentials && !showKeyMutuals && !addManually.active && (
        <>
          <div className="mellon-key-mutuals">
            {/* big title */}
            <div className="mellon-mutual-title-container">
              <img
                src={chrome.runtime.getURL("/assets/users-active.svg")}
                alt="star"
              />
              <p>Potential Intros ({keyPotentialsIntros.length}) </p>
            </div>

            {/* users loop */}
            {keyPotentialsIntros.map((elm, idx) => {
              return (
                <div
                  key={idx}
                  className="mellon-connection-single-item mellon-mutual-profile-details"
                  onClick={() => redirectOnClick(elm?.["Linkedin URL"])}
                >
                  <div className="mellon-single-details ">
                    {/* profile */}
                    {elm?.["Profile Photo"] ? (
                      <img src={elm?.["Profile Photo"]} alt="profile-icon" />
                    ) : (
                      <CgProfile className="mellon-single-fb" />
                    )}
                  </div>

                  {/* name */}
                  <div className="mellon-single-name">
                    <p>{elm?.["Full Name"]}</p>
                    <p>{elm?.["Linkedin Description"]}</p>
                    <div className="mellon-mutual-key-sign">
                      <img
                        src={chrome.runtime.getURL("/assets/users-active.svg")}
                        alt="star"
                      />
                      <p>Potential Intro</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* fallback */}
            {keyPotentialsIntros && keyPotentialsIntros.length === 0 && (
              <Nothing />
            )}

            {/* add more widget */}
            {/* <AddMutualConnection
              scrap={() => setAndRedirectMutualPage("key")}
              type={"potential"}
            /> */}
          </div>
        </>
      )}

      {/* view with key relations */}
      {!showKeyPotentials && showKeyMutuals && !addManually.active && (
        <>
          <div className="mellon-key-mutuals">
            {/* big title */}
            <div className="mellon-mutual-title-container">
              <img
                src={chrome.runtime.getURL("/assets/start-active.svg")}
                alt="star"
              />
              <p>Key Mutual Connections ({keyMutualConnections.length}) </p>
            </div>

            {/* users loop */}
            {keyMutualConnections.map((elm, idx) => {
              return (
                <div
                  key={idx}
                  className="mellon-connection-single-item mellon-mutual-profile-details"
                  onClick={() => redirectOnClick(elm?.["Linkedin URL"])}
                >
                  <div className="mellon-single-details ">
                    {/* profile */}
                    {elm?.["Profile Photo"] ? (
                      <img src={elm?.["Profile Photo"]} alt="profile-icon" />
                    ) : (
                      <CgProfile className="mellon-single-fb" />
                    )}
                  </div>

                  {/* name */}
                  <div className="mellon-single-name">
                    <p>{elm?.["Full Name"]}</p>
                    <p>{elm?.["Linkedin Description"]}</p>
                    <div className="mellon-mutual-key-sign">
                      <img
                        src={chrome.runtime.getURL("/assets/start-active.svg")}
                        alt="star"
                      />
                      <p>Key Relationship</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* fallback */}
            {keyMutualConnections &&
              keyMutualConnections.length === 0 &&
              !keyRelationsLoading && <Nothing />}

            {/* loading for search */}
            {keyRelationsLoading && <Loading />}

            {/* add more widget */}
            <AddMutualConnection
              scrap={() => setAndRedirectMutualPage("potential")}
              type={"key"}
            />
          </div>
        </>
      )}

      {/* view add mutual manually */}
      {addManually.active && !showKeyPotentials && !showKeyMutuals && (
        <AddMutualManually
          keyPotentialsIntros={keyPotentialsIntros}
          keyMutualConnections={keyMutualConnections}
          currentUserKey={mellonKeyData}
          currentUserPotential={mellonPotentialData}
        />
      )}
    </>
  );
};
export default SingleUser;
