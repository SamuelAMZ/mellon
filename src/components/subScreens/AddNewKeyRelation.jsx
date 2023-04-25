import React, { useContext, useState } from "react";

// icons
import { IoIosArrowBack } from "react-icons/io";

// contexts
import VisibleScrensContext from "../../contexts/visibleScreens";

const AddNewKeyRelation = () => {
  const { screen, changeScreen } = useContext(VisibleScrensContext);

  const [keyRelationInfo, setKeyRelationInfo] = useState(null);
  const [addingNewKey, setAddingNewKey] = useState(false);

  const backToSingleUser = () => {
    changeScreen({
      first: false,
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

  // handle ading new key
  const handleNewKeyRelation = async (e) => {
    e.preventDefault();

    setAddingNewKey(true);

    // get user rest detail
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
      await delay(100);

      //   start scraping
      const userDetailsObj = {};

      //   user id
      userDetailsObj.uid = userLinked;

      //   get url
      chrome.runtime.sendMessage({ from: "getActualLink" }, (data) => {
        userDetailsObj.linkedinUrl = data.url;
      });

      await delay(100);

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

      return userDetailsObj;
    };
    try {
      let mellonUserDetails = await grabUserDetails();

      let newKeyData = { ...keyRelationInfo, ...mellonUserDetails };

      var myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append(
        "Authorization",
        "Bearer 725b8d6584b071a02e1316945bf7743b"
      );

      var raw = newKeyData;

      var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(raw),
        redirect: "follow",
      };

      fetch("http://localhost:4001/api/new-keyrelation", requestOptions)
        .then((response) => response.text())
        .then((result) => {
          console.log(result);
        })
        .catch((error) => console.log("error", error));

      setAddingNewKey(false);

      // redirect to the user page
      backToSingleUser();
    } catch (error) {
      setAddingNewKey(false);
    }

    setAddingNewKey(false);
  };

  return (
    <div className="mellon-add-new-key-relation-wrapper">
      <div className="mellon-key-header">
        <label className="back-btn" onClick={backToSingleUser}>
          <IoIosArrowBack /> Back
        </label>
        <h3>Add new Key Relationship</h3>
        <p>Add {mellonGetUserName()} as Key relationship</p>
      </div>
      <form onSubmit={handleNewKeyRelation}>
        <div className="mellon-form-group">
          <label htmlFor="mellon-goals">Goals</label>
          <div className="mellon-select-container">
            <select
              className="mellon-select"
              onChange={(e) => {
                setKeyRelationInfo({
                  ...keyRelationInfo,
                  goal: e.target.value,
                });
              }}
            >
              <option disabled selected>
                Select a goal
              </option>
              <option value="1681302240545x441696144196894700">
                Business Development
              </option>
              <option value="1681302240545x441696144196894700">
                Fundraising
              </option>
            </select>
          </div>
        </div>
        <div className="mellon-form-group">
          <label htmlFor="mellon-goals">Professional Value</label>
          <div className="mellon-select-container">
            <select
              className="mellon-select"
              onChange={(e) => {
                setKeyRelationInfo({
                  ...keyRelationInfo,
                  professionalValue: e.target.value,
                });
              }}
            >
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
          <label htmlFor="mellon-goals">Relationship Strength</label>
          <div className="mellon-select-container">
            <select
              className="mellon-select"
              onChange={(e) => {
                setKeyRelationInfo({
                  ...keyRelationInfo,
                  relationshipStrength: e.target.value,
                });
              }}
            >
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
          <textarea
            placeholder="Optional note"
            onChange={(e) => {
              setKeyRelationInfo({
                ...keyRelationInfo,
                notes: e.target.value,
              });
            }}
          ></textarea>
        </div>

        <div className="mellon-form-group">
          {addingNewKey && <button className="mellon-button">Adding...</button>}
          {!addingNewKey && <button className="mellon-button">Add new</button>}
        </div>
      </form>
    </div>
  );
};

export default AddNewKeyRelation;
