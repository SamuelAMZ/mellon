import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// create dom element
let mellonsassWidget = document.createElement("div");
mellonsassWidget.setAttribute("id", "mellonsass-container");
document.body.appendChild(mellonsassWidget);

// append all code in the element
const root = ReactDOM.createRoot(
  document.getElementById("mellonsass-container")
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
