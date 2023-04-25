import React, { useContext, useState } from "react";

// contexts
import VisibleScrensContext from "../contexts/visibleScreens";

const MenuScreen = () => {
  const { screen, changeScreen } = useContext(VisibleScrensContext);

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

  return (
    <div className="mellon-menu-screen-container">
      <button className="mellon-button" onClick={mellonFirstDegreeView}>
        First Degree Connections
      </button>
      <button className="mellon-button">Your Key Relations</button>
      <button className="mellon-button">Your Potential Intros</button>
      <button className="mellon-button" onClick={mellonUserView}>
        Current User Profile
      </button>
    </div>
  );
};

export default MenuScreen;
