import React, { useState, useContext, useEffect } from "react";

// contexts
import VisibleScrensContext from "../contexts/visibleScreens";

// components
import HomeScreen from "./HomeScreen";

const FirstScreen = () => {
  const { screen, changeScreen } = useContext(VisibleScrensContext);

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

        // scrap user profile

        // get latest user details (key relations...)

        // send request to update user profile
      }
    });
  }, []);

  // check user before loading the screens
  const checkUserAndLoadScreens = async () => {
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

  return (
    <>
      {screen.first && (
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

          {/* first circles */}
          <div class="mellon-ext-first-circles">
            <img src={chrome.runtime.getURL("/assets/circle.svg")} alt="star" />
            <img src={chrome.runtime.getURL("/assets/circle.svg")} alt="star" />
            <img src={chrome.runtime.getURL("/assets/circle.svg")} alt="star" />
          </div>

          {/* econd circles */}
          <div class="mellon-ext-second-circles">
            <img src={chrome.runtime.getURL("/assets/circle.svg")} alt="star" />
            <img src={chrome.runtime.getURL("/assets/circle.svg")} alt="star" />
            <img src={chrome.runtime.getURL("/assets/circle.svg")} alt="star" />
          </div>

          {/* users */}
          <div class="mellon-ext-user">
            <img src={chrome.runtime.getURL("/assets/users.svg")} alt="user" />
            <p>0</p>
          </div>
        </div>
      )}

      {screen.connections && <HomeScreen />}
    </>
  );
};

export default FirstScreen;
