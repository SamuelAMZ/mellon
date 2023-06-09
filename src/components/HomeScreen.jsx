import React, { useState, useContext, useEffect } from "react";

// contexts
import VisibleScrensContext from "../contexts/visibleScreens";

// libs
import { GrClose } from "react-icons/gr";

// components
import Connections from "./subScreens/Connections";
import SingleUser from "./subScreens/SingleUser";
import AddNewKeyRelation from "./subScreens/AddNewKeyRelation";
import AddPotentialIntro from "./subScreens/AddPotentialIntro";
import MenuScreen from "./MenuScreen";
import LoginScreen from "./auth/loginScreen";
import Keys from "./subScreens/Keys";
import Potentials from "./subScreens/Potentials";
import MutualConnections from "./subScreens/MutualConnections";
import FallbackScreen from "./FallbackScreen";

const HomeScreen = () => {
  const { screen, changeScreen } = useContext(VisibleScrensContext);

  let id;

  useEffect(() => {
    // getActualLink
    chrome.runtime.sendMessage({ from: "getActualLink" }, (data) => {
      if (data.url.split("/in/")[0] === "https://www.linkedin.com/") {
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
    });
  };
  useEffect(() => {
    (async () => {
      await checkUserAndLoadScreens();
    })();
  }, [
    screen.login,
    screen.first,
    screen.singleUser,
    screen.connectionList,
    screen.menu,
  ]);

  // clearign the setInterval
  // useEffect(() => {

  // }, [screen])

  return (
    <>
      <div className="mellon-ext-single-user">
        <div className="mellon-ext-header">
          <img
            className="mellon-logo"
            src={chrome.runtime.getURL("/assets/content-logo.png")}
            alt="mellon-logo"
          />
          <div
            className="mellon-extension-more"
            onClick={() =>
              changeScreen({
                first: true,
                menu: false,
                connections: false,
                singleUser: false,
                connectionList: false,
                newKey: false,
                potential: false,
              })
            }
          >
            <GrClose className="mellon-close-icon" />
          </div>
        </div>

        <div className="mellon-container-connections">
          {screen.connectionList && <Connections />}
          {screen.login && <LoginScreen />}
          {screen.singleUser && <SingleUser />}
          {screen.newKey && <AddNewKeyRelation />}
          {screen.potential && <AddPotentialIntro />}
          {screen.menu && <MenuScreen />}
          {screen.keysList && <Keys />}
          {screen.potentialsList && <Potentials />}
          {screen.mutualConnections && <MutualConnections />}
          {screen.fallback && <FallbackScreen />}
        </div>
      </div>
    </>
  );
};

export default HomeScreen;
