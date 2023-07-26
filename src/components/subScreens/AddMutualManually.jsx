import React, { useContext, useEffect, useState } from "react";
import AddManuallyContext from "../../contexts/AddManually";

const AddMutualManually = ({
  keyPotentialsIntros,
  keyMutualConnections,
  currentUserKey,
  currentUserPotential,
}) => {
  const { addManually, changeAddManually } = useContext(AddManuallyContext);

  // states
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [existingMutuals, setExistingMutuals] = useState(
    keyPotentialsIntros.length > 0 ? keyPotentialsIntros : keyMutualConnections
  );
  const [showSaveBtn, setShowSaveBtn] = useState(false);

  // selected user
  const [selectedUser, setSelectedUser] = useState(null);

  // current user id
  const [currentUser, setCurrentUser] = useState(null);

  // adding new loading
  const [addingNew, setAddingNew] = useState(false);

  // user details
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

  // search
  // Debounce function to delay the search request
  const debounceSearch = (func, delay) => {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  // filter results
  const returnUniqueKeys = (allKeys, alreadyKeys) => {
    const filterByExclusion = (allKeys, alreadyKeys) => {
      return allKeys.filter(
        (item1) => !alreadyKeys.some((item2) => item1._id === item2._id)
      );
    };

    // Usage
    const filteredArray = filterByExclusion(allKeys, alreadyKeys);
    return filteredArray.length > 0
      ? filteredArray
      : [
          {
            _id: 1,
            "Full Name": "Nothing found",
          },
        ];
  };

  // Search function using fetch and async/await
  const performSearch = async (term) => {
    setIsLoading(true);

    // reset selected user
    setSelectedUser(null);

    try {
      const response = await fetch(
        `https://buckfifty.com/version-test/api/1.1/obj/connection?constraints=[{ "key": "Full Name", "constraint_type": "text contains", "value": "${encodeURIComponent(
          term
        )}" }, { "key": "Is Key Relationship", "constraint_type": "equals", "value": "True" }, { "key": "Created By", "constraint_type": "equals", "value": "${userLinked}" } ]`
      );
      const data = await response.json();
      let result = returnUniqueKeys(data?.response?.results, existingMutuals);
      setSearchResults(result);
      setIsLoading(false);
    } catch (error) {
      // Only handle the error if the request was not aborted intentionally
      console.error("Error fetching search results:", error);
      setIsLoading(false);
    }
  };

  // Debounce the search function to avoid triggering on every keystroke
  const debouncedSearch = debounceSearch(performSearch, 500); // Adjust the delay (in milliseconds) as per your preference

  const handleInputChange = (event) => {
    const { value } = event.target;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // select user
  const selectUser = (user) => {
    // set user to selected
    setSelectedUser(user);

    // set user to the search field
    setSearchTerm(user?.["Full Name"]);

    // hide other results
    setSearchResults([]);

    // show save button
    setShowSaveBtn(true);
  };

  // get current User id
  const getUserId = () => {
    if (currentUserKey?._id) {
      setCurrentUser({
        id: currentUserKey?._id,
        goal: currentUserKey.Goals[0],
      });
    }
    if (currentUserPotential?._id) {
      setCurrentUser({
        id: currentUserPotential?._id,
        goal: currentUserPotential?.Goal,
      });
    }
  };

  useEffect(() => {
    getUserId();
  }, [currentUserKey, currentUserPotential]);

  // add new mutual
  const addNewMutual = async (e) => {
    e.preventDefault();
    setAddingNew(true);
    await delay(200);

    // get fetch url
    // let fetchUrl = "";
    // if (addManually && addManually?.previousView === "potential") {
    //   fetchUrl = `https://buckfifty.com/version-test/api/1.1/obj/connection/${currentUserId}`;
    // }
    // if (addManually && addManually?.previousView === "key") {
    //   fetchUrl = `https://buckfifty.com/version-test/api/1.1/obj/potentialIntro/${currentUserId}`;
    // }
    // get all current mutuals in an array
    // let allMutuals = [];
    // if (existingMutuals && existingMutuals.length > 0) {
    //   existingMutuals?.forEach((elm) => {
    //     allMutuals.push(elm?._id);
    //   });
    // }

    // add the new one
    // allMutuals = [...allMutuals, selectedUser._id];

    // headers
    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("Authorization", "Bearer " + userToken);
    let urlencoded = new URLSearchParams();

    // if (addManually?.previousView === "potential") {
    //   urlencoded.append("Potential Intros", JSON.stringify(allMutuals));
    // }
    // if (addManually?.previousView === "key") {
    //   urlencoded.append("Mutual Connections", JSON.stringify(allMutuals));
    // }

    urlencoded.append("potential_intro", currentUser.id);
    urlencoded.append("goal", currentUser.goal);
    urlencoded.append("mutual_connection_full_name", selectedUser["Full Name"]);
    urlencoded.append(
      "mutual_connection_linkedin_url",
      selectedUser["Linkedin URL"]
    );

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: urlencoded,
      redirect: "follow",
    };

    try {
      let res = await fetch(
        "https://buckfifty.com/version-test/api/1.1/wf/linkedin-intro-mutual-connections",
        requestOptions
      );
      let responseData = await res.json();
      console.log(responseData);
      setAddingNew(false);
    } catch (error) {
      console.log(error);
      setAddingNew(false);
    }

    changeAddManually({
      active: false,
      previousView: addManually.previousView,
    });
    setAddingNew(false);
  };

  return (
    <div className="mellon-add-manually-container">
      {/* title */}
      <div className="mellon-mutual-title-container">
        <img
          src={chrome.runtime.getURL("/assets/start-active.svg")}
          alt="star"
        />
        <p>Add Key Mutual Connections</p>
      </div>
      {/* search bar */}
      <form>
        <span>Search key relationships</span>
        <div className="mellon-search-and-results">
          <input
            type="text"
            placeholder="Search key relationships"
            className="input input-bordered"
            value={searchTerm}
            onChange={handleInputChange}
          />
          <ul className="mellon-add-manually-results-container">
            {isLoading && <li>loading...</li>}
            {!isLoading &&
              searchResults &&
              searchResults.length > 0 &&
              searchResults?.map((elm) => {
                return (
                  <li key={elm?._id} onClick={() => selectUser(elm)}>
                    {elm["Full Name"]}
                  </li>
                );
              })}
          </ul>
        </div>
        {showSaveBtn && selectedUser?._id && (
          <button
            className="mellon-ext-btn btn btn-primary w-full mellon-fallback-btn"
            onClick={addNewMutual}
          >
            {addingNew ? "Saving..." : "Save"}
          </button>
        )}
      </form>
    </div>
  );
};

export default AddMutualManually;
