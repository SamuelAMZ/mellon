import React, { useState, useContext, useEffect } from "react";

// react query
import { useQuery } from "react-query";

//comps
import Nothing from "./Nothing";
import Loading from "./Loading";

// contexts
import VisibleScrensContext from "../../contexts/visibleScreens";

// icons
import { IoIosArrowBack } from "react-icons/io";

// icons
import { CgProfile } from "react-icons/cg";
import { AiOutlineEye, AiOutlineArrowRight } from "react-icons/ai";

let userLinked = null;
chrome.storage.local.get("uid", function (item) {
  if (item.uid) {
    userLinked = item.uid;
  }
  if (!item.uid) {
    userLinked = null;
  }
});

const Keys = () => {
  const [pageNumber, setPageNumber] = useState("0");
  const [searchTerm, setSearchTerm] = useState("");

  const { screen, changeScreen } = useContext(VisibleScrensContext);

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const mellonBackToMenu = () => {
    changeScreen({
      first: false,
      menu: true,
      connections: true,
      singleUser: false,
      connectionList: false,
      newKey: false,
      potential: false,
      keysList: false,
      potentialsList: false,
    });
  };

  // get table data
  const handleConnectionsList = async () => {
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
        `https://buckfifty.com/version-test/api/1.1/obj/connection?constraints=[ { "key": "is_key_relationship_boolean", "constraint_type": "equals", "value": "true" }, { "key": "Created By", "constraint_type": "equals", "value": "${uid}" }  ]`,
        requestOptions
      );

      let result = await req.json();

      console.log(result?.response?.results, "keys");

      if (result?.response?.results.length > 0) {
        return result?.response?.results;
      } else {
        return [];
      }
    };

    // check if linkedin profile exist already for the current user
    return await mellonCheckProfile();
  };

  const {
    data: tableData,
    isLoading: tableLoading,
    refetch: getPaginate,
  } = useQuery(["keys-list", pageNumber, searchTerm], handleConnectionsList, {
    refetchOnWindowFocus: false,
    enabled: true,
  });

  // redirect to profile on click
  const redirectOnClick = (url) => {
    chrome.runtime.sendMessage({ from: "openUserUrl", url: url });
  };

  return (
    <div className="mellon-connection-list-wrapper">
      <label className="back-btn" onClick={mellonBackToMenu}>
        <IoIosArrowBack /> Back
      </label>

      {tableData && tableData.length > 0 && !tableLoading && (
        <>
          {tableData.map((elm, idx) => {
            return (
              <div
                key={idx}
                className="mellon-connection-single-item"
                onClick={() => redirectOnClick(elm?.["Linkedin URL"])}
              >
                <div className="mellon-single-details">
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
                </div>

                <div className="mellon-single-icons">
                  <AiOutlineEye />
                  <AiOutlineArrowRight />
                </div>
              </div>
            );
          })}

          {/* <div className="mellon-page-number">
            <p>Page: {Number(pageNumber) + 1}</p>
          </div>
          <div className="mellon-next-actions">
            {Number(pageNumber) > 0 && (
              <button
                className="btn w-full"
                onClick={() => setPageNumber(String(Number(pageNumber) - 1))}
              >
                Prev
              </button>
            )}
            <button
              className="btn btn-primary w-full"
              onClick={() => setPageNumber(String(Number(pageNumber) + 1))}
            >
              Next
            </button>
          </div> */}
        </>
      )}

      {/* fallback */}
      {tableData && tableData.length === 0 && !tableLoading && <Nothing />}

      {/* loading for search */}
      {tableLoading && <Loading />}
    </div>
  );
};

export default Keys;
