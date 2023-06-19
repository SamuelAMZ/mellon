import React, { useContext, useEffect, useState } from "react";

// contexts
import VisibleScrensContext from "../contexts/visibleScreens";

const MenuScreen = () => {
  const { screen, changeScreen } = useContext(VisibleScrensContext);

  const [mellonShowUserBtn, setMellonShowUserBtn] = useState(false);

  const mellonFirstDegreeView = () => {
    changeScreen({
      first: false,
      menu: false,
      connections: true,
      singleUser: false,
      connectionList: true,
      newKey: false,
    });
  };
  const mellonUserView = () => {
    changeScreen({
      first: false,
      menu: false,
      connections: true,
      singleUser: true,
      connectionList: false,
      newKey: false,
      potential: false,
    });
  };
  const mellonKeysView = () => {
    changeScreen({
      first: false,
      menu: false,
      connections: true,
      singleUser: false,
      connectionList: false,
      newKey: false,
      potential: false,
      keysList: true,
      potentialsList: false,
    });
  };
  const mellonPotentialsView = () => {
    changeScreen({
      first: false,
      menu: false,
      connections: true,
      singleUser: false,
      connectionList: false,
      newKey: false,
      potential: false,
      keysList: false,
      potentialsList: true,
    });
  };
  const mellonSyncConnections = () => {
    chrome.runtime.sendMessage({ from: "auth_check" }, (data) => {
      // if not met just show the default back page
      console.log(data);
      if (data.user === true) {
        // if authed
        chrome.runtime.sendMessage({ from: "openFirstDegreeTab" });
      }
    });
  };

  // hide current linkedin btn when not on user page
  useEffect(() => {
    let mellonUserPageCheck = setInterval(async () => {
      chrome.runtime.sendMessage({ from: "getActualLink" }, (data) => {
        if (data.url.split("/in/")[0] === "https://www.linkedin.com") {
          setMellonShowUserBtn(true);
        } else {
          setMellonShowUserBtn(false);
        }
      });
    }, 500);

    return () => clearInterval(mellonUserPageCheck);
  }, []);

  return (
    <div className="mellon-menu-screen-container">
      {/* <button className="mellon-button" onClick={mellonFirstDegreeView}>
        First Degree Connections
      </button> */}
      <button className="mellon-button" onClick={mellonKeysView}>
        Your Key Relationships
      </button>
      <button className="mellon-button" onClick={mellonPotentialsView}>
        Your Potential Intros
      </button>
      <button className="mellon-button" onClick={mellonSyncConnections}>
        Sync Connections
      </button>
      {mellonShowUserBtn && (
        <button className="mellon-button" onClick={mellonUserView}>
          Current User Profile
        </button>
      )}
    </div>
  );
};

export default MenuScreen;
