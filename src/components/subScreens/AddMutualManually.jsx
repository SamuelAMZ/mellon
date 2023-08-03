import React, { useContext, useEffect, useState } from "react";

// react query
import { useQueryClient } from "react-query";

// context
import AddManuallyContext from "../../contexts/AddManually";

const AddMutualManually = ({
  keyPotentialsIntros,
  keyMutualConnections,
  currentUserKey,
  currentUserPotential,
}) => {
  // react query
  const queryClient = useQueryClient();

  // context
  const { addManually, changeAddManually } = useContext(AddManuallyContext);

  // states
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [existingMutuals, setExistingMutuals] = useState(
    keyPotentialsIntros.length > 0 ? keyPotentialsIntros : keyMutualConnections
  );
  const [showSaveBtn, setShowSaveBtn] = useState(false);
  const [searchableAllKeys, setSearchableAllKeys] = useState([]);

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
  // filter results
  const returnUniqueKeys = (allKeys, alreadyKeys) => {
    const filterByExclusion = (allKeys, alreadyKeys) => {
      return allKeys.filter(
        (item1) => !alreadyKeys.some((item2) => item1._id === item2._id)
      );
    };

    // Usage
    const filteredArray = filterByExclusion(allKeys, alreadyKeys);
    return filteredArray;
  };

  const fetchAllFirstDegrees = async () => {
    await delay(300);
    try {
      const response = await fetch(
        `https://buckfifty.com/version-test/api/1.1/obj/connection?constraints=[{ "key": "Is Key Relationship", "constraint_type": "equals", "value": "True" }, { "key": "Created By", "constraint_type": "equals", "value": "${userLinked}" } ]`
      );
      const data = await response.json();
      let result = returnUniqueKeys(data?.response?.results, existingMutuals);
      setSearchableAllKeys(result);
    } catch (error) {
      // Only handle the error if the request was not aborted intentionally
      console.error("Error fetching all keys", error);
    }
  };

  // Search function using fetch and async/await
  const performSearch = async (term) => {
    setIsLoading(true);

    // reset selected user
    setSelectedUser(null);

    // filtering
    const filteredNames = searchableAllKeys.filter((name) =>
      name["Full Name"]?.toLowerCase().includes(term.toLowerCase())
    );

    // set result
    setSearchResults(
      filteredNames.length > 0
        ? filteredNames
        : [
            {
              _id: 1,
              "Full Name": "Nothing found",
            },
          ]
    );

    setIsLoading(false);
  };

  const handleInputChange = async (event) => {
    const { value } = event.target;
    setSearchTerm(value);
    await performSearch(searchTerm);
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
    (async () => {
      await fetchAllFirstDegrees();
    })();
  }, []);

  useEffect(() => {
    getUserId();
  }, [currentUserKey, currentUserPotential]);

  // add new mutual
  const addNewMutual = async (e) => {
    e.preventDefault();
    setAddingNew(true);
    await delay(200);

    // headers
    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("Authorization", "Bearer " + userToken);
    let urlencoded = new URLSearchParams();

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

    // refresh user page
    queryClient.refetchQueries("potential-list");
    queryClient.refetchQueries("key-list");

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
                  <li
                    key={elm?._id}
                    onClick={() => {
                      // return if elm === nothing found
                      if (elm?._id === 1) return;
                      // else select elm
                      selectUser(elm);
                    }}
                  >
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
