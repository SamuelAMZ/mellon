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

const HomeScreen = () => {
  const { screen, changeScreen } = useContext(VisibleScrensContext);

  useEffect(() => {
    // getActualLink
    chrome.runtime.sendMessage({ from: "getActualLink" }, (data) => {
      console.log(data);
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
          {screen.singleUser && <SingleUser />}
          {screen.newKey && <AddNewKeyRelation />}
          {screen.potential && <AddPotentialIntro />}
          {screen.menu && <MenuScreen />}
        </div>
      </div>
    </>
  );
};

export default HomeScreen;
