import React, { useContext, useState } from "react";

// context
import VisibleScrensContext from "../../contexts/visibleScreens";

const LoginScreen = () => {
  const { screen, changeScreen } = useContext(VisibleScrensContext);

  const [mellonLoginData, setMellonLogindata] = useState({
    email: "",
    password: "",
  });
  const [mellonLoginLoading, setMellonLoginLoading] = useState(false);

  const mellonHandleLogin = async (e) => {
    e.preventDefault();

    // loading
    setMellonLoginLoading(true);

    const message = {
      from: "loginAttempt",
      data: {
        email: mellonLoginData.email,
        password: mellonLoginData.password,
      },
    };
    // Send the message to the background script
    chrome.runtime.sendMessage(message, (data) => {
      // error
      if (data.user === false) {
        let loginErrorBox = document.querySelector(".mellon-login-error");

        loginErrorBox.style.display = "flex";
        loginErrorBox.innerText = data.errorType;

        // stop laoding
        setMellonLoginLoading(false);
        return;
      }

      // success
      if (data.user === true) {
        changeScreen({
          first: false,
          login: false,
          menu: true,
          connections: true,
          singleUser: false,
          connectionList: false,
        });
      }
    });

    //   stop loading
    setMellonLoginLoading(false);
  };

  return (
    <div class="mellon-user-login">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        id="Blocked_Account_"
        data-name="Blocked Account "
        width="70"
        viewBox="0 0 29 28.998"
      >
        <path
          id="Path_19"
          data-name="Path 19"
          d="M114.5-179a7,7,0,0,0-7,7,7,7,0,0,0,7,7,7,7,0,0,0,7-7A7,7,0,0,0,114.5-179Zm0,2a5,5,0,0,1,5,5,5,5,0,0,1-5,5,5,5,0,0,1-5-5A5,5,0,0,1,114.5-177Z"
          transform="translate(-100.5 179)"
          fill-rule="evenodd"
        />
        <path
          id="Path_31"
          data-name="Path 31"
          d="M102.5-153H115a1,1,0,0,1,1,1,1,1,0,0,1-1,1H101.5a1,1,0,0,1-1-1v-2a9,9,0,0,1,9-9H115a1,1,0,0,1,1,1,1,1,0,0,1-1,1h-5.5a7,7,0,0,0-7,7Z"
          transform="translate(-100.5 179)"
          fill-rule="evenodd"
        />
        <path
          id="Path_42"
          data-name="Path 42"
          d="M123-163a6.5,6.5,0,0,0-6.5,6.5A6.5,6.5,0,0,0,123-150a6.5,6.5,0,0,0,6.5-6.5A6.5,6.5,0,0,0,123-163Zm0,2a4.5,4.5,0,0,1,4.5,4.5A4.5,4.5,0,0,1,123-152a4.5,4.5,0,0,1-4.5-4.5A4.5,4.5,0,0,1,123-161Z"
          transform="translate(-100.5 179)"
          fill-rule="evenodd"
        />
        <path
          id="Path_49"
          data-name="Path 49"
          d="M120.295-157.793l4,4a1,1,0,0,0,1.414,0,1,1,0,0,0,0-1.414l-4-4a1,1,0,0,0-1.414,0A1,1,0,0,0,120.295-157.793Z"
          transform="translate(-100.5 179)"
          fill-rule="evenodd"
        />
        <path
          id="Path_53"
          data-name="Path 53"
          d="M124.293-159.207l-4,4a1,1,0,0,0,0,1.414,1,1,0,0,0,1.414,0l4-4a1,1,0,0,0,0-1.414A1,1,0,0,0,124.293-159.207Z"
          transform="translate(-100.5 179)"
          fill-rule="evenodd"
        />
      </svg>

      <h1>Login to your account</h1>

      <form className="mellon-login-form" onSubmit={mellonHandleLogin}>
        <p class="mellon-login-error"></p>
        <div class="mellon-form-group">
          <label for="email">Email</label>
          <input
            type="email"
            name="email"
            id="email"
            placeholder="doe@gmail.com"
            onChange={(e) =>
              setMellonLogindata({
                ...mellonLoginData,
                email: e.target.value.trim(),
              })
            }
          />
        </div>
        <div class="mellon-form-group">
          <label for="password">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            placeholder="******"
            onChange={(e) =>
              setMellonLogindata({
                ...mellonLoginData,
                password: e.target.value,
              })
            }
          />
        </div>
        {mellonLoginLoading ? (
          <button className="mellon-button loading">Loading...</button>
        ) : (
          <button className="mellon-button">Login</button>
        )}
      </form>
    </div>
  );
};

export default LoginScreen;
