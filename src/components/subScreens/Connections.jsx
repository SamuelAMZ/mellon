import React, { useState, useContext, useEffect } from "react";

// react query
import { useQuery } from "react-query";

// import loading
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// helpers
import postReq from "../../helpers/postReq";

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

const Connections = () => {
  const [pageNumber, setPageNumber] = useState("0");
  const [searchTerm, setSearchTerm] = useState("");

  const { screen, changeScreen } = useContext(VisibleScrensContext);

  const mellonBackToMenu = () => {
    changeScreen({
      first: false,
      menu: true,
      connections: true,
      singleUser: false,
      connectionList: false,
      newKey: false,
      potential: false,
    });
  };

  // get table data
  const handleConnectionsList = async () => {
    return await postReq(
      {
        page: pageNumber,
        perPage: "15",
        searchTerm: searchTerm,
        userLinked: userLinked,
      },
      "/api/connections-list"
    );
  };

  const {
    data: tableData,
    isLoading: tableLoading,
    refetch: getPaginate,
  } = useQuery(
    ["connection-list", pageNumber, searchTerm],
    handleConnectionsList,
    {
      refetchOnWindowFocus: false,
      enabled: true,
    }
  );

  useEffect(() => {
    console.log(tableData);
  }, [tableData]);

  // redirect to profile on click
  const redirectOnClick = (url) => {
    chrome.runtime.sendMessage({ from: "openUserUrl", url: url });
  };

  return (
    <div className="mellon-connection-list-wrapper">
      <label className="back-btn" onClick={mellonBackToMenu}>
        <IoIosArrowBack /> Back
      </label>

      {tableData && tableData.code === "ok" && (
        <>
          {tableData?.payload?.list?.map((elm, idx) => {
            return (
              <div
                key={idx}
                className="mellon-connection-single-item"
                onClick={() => redirectOnClick(elm.linkedinUrl)}
              >
                <div className="mellon-single-details">
                  {/* profile */}
                  {elm?.profilePhoto ? (
                    <img src={elm?.profilePhoto} alt="profile-icon" />
                  ) : (
                    <CgProfile className="mellon-single-fb" />
                  )}
                </div>

                {/* name */}
                <div className="mellon-single-name">
                  <p>{elm?.fullName}</p>
                </div>

                <div className="mellon-single-icons">
                  <AiOutlineEye />
                  <AiOutlineArrowRight />
                </div>
              </div>
            );
          })}

          <div className="mellon-page-number">
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
          </div>
        </>
      )}

      {/* loading for search */}
      {tableLoading && <div className="mellon-loader-wrapper">loading...</div>}
    </div>
  );
};

export default Connections;
