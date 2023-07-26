import React, { useContext } from "react";
import AddManuallyContext from "../../contexts/AddManually";

const AddMutualConnection = ({ scrap, type }) => {
  const { addManually, changeAddManually } = useContext(AddManuallyContext);

  return (
    <div className="mellon-add-mutual-connection-widget-wraper">
      <button
        className="mellon-ext-btn btn btn-primary w-full mellon-fallback-btn"
        onClick={scrap(type)}
      >
        + Scrape Mutual Connections
      </button>
      <button
        className="mellon-ext-btn btn btn-primary w-full mellon-fallback-btn"
        onClick={() => {
          changeAddManually({
            active: true,
            previousView: type,
          });
        }}
      >
        + Add Manually
      </button>
    </div>
  );
};

export default AddMutualConnection;
