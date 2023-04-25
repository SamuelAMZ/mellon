import React, { useContext, useState } from "react";

// icons
import { IoIosArrowBack } from "react-icons/io";

// contexts
import VisibleScrensContext from "../../contexts/visibleScreens";

const AddPotentialIntro = () => {
  const { screen, changeScreen } = useContext(VisibleScrensContext);

  const backToSingleUser = () => {
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

  const mellonGetUserName = () => {
    let mellonUser = document
      .querySelector(".pv-text-details__left-panel h1")
      ?.textContent?.trim()
      .toLowerCase();

    let mellonTheName = "user";

    mellonUser
      ? (mellonTheName = mellonUser.trim().split(" ")[0])
      : (mellonTheName = "user");
    return mellonTheName;
  };

  return (
    <div className="mellon-add-new-key-relation-wrapper">
      <div className="mellon-key-header">
        <label className="back-btn" onClick={backToSingleUser}>
          <IoIosArrowBack /> Back
        </label>
        <h3>Add New Potential Intro</h3>
        <p>Add {mellonGetUserName()} as Potential Intro</p>
      </div>
      <form>
        <div className="mellon-form-group">
          <label htmlFor="mellon-goals">Goals</label>

          <div className="mellon-select-container">
            <select className="mellon-select">
              <option disabled selected>
                Select a goal
              </option>
              <option>Business Development</option>
              <option>Fundraising</option>
            </select>
          </div>
        </div>
        <div className="mellon-form-group">
          <label htmlFor="mellon-goals">Priority</label>
          <div className="mellon-select-container">
            <select className="mellon-select">
              <option value="" selected disabled>
                Select an option
              </option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
        </div>
        <div className="mellon-form-group">
          <label htmlFor="mellon-goals">Notes</label>
          <textarea placeholder="Optional note"></textarea>
        </div>

        <div className="mellon-form-group">
          <button className="mellon-button">Add new</button>
        </div>
      </form>
    </div>
  );
};

export default AddPotentialIntro;
