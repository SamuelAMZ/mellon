let userAuthed = false;
// dynamic showing the popup elmts
let userOutScreen = document.querySelector(".user-out");
let userInScreen = document.querySelector(".user-in");
let settings = document.querySelector("#settings");
let header = document.querySelector(".clone-header");
let footer = document.querySelector(".clone-footer");
let loginForm = document.querySelector("#login");
let emailInput = document.querySelector("#email");
let passwordInput = document.querySelector("#password");
let loginErrorBox = document.querySelector(".mellon-login-error");
let loginBtn = document.querySelector("#login-btn");

// login flow
const loginUser = async (e) => {
  e.preventDefault();

  // loading
  loginBtn.textContent = "Loading...";
  loginBtn.classList.add("loading");

  const message = {
    from: "loginAttempt",
    data: { email: emailInput.value, password: passwordInput.value },
  };
  // Send the message to the background script
  chrome.runtime.sendMessage(message, (data) => {
    // error
    if (data.user === false) {
      loginErrorBox.style.display = "flex";
      loginErrorBox.innerText = data.errorType;

      // stop laoding
      loginBtn.classList.remove("loading");
      loginBtn.textContent = "login";
      return;
    }

    // success
    if (data.user === true) {
      userAuthed = data.uid;
      authUser();
    }
  });

  loginBtn.classList.remove("loading");
  loginBtn.textContent = "login";
};

// auth check
const authUser = () => {
  if (userAuthed) {
    userOutScreen.style.display = "none";
    userInScreen.style.display = "flex";
  }
  if (!userAuthed) {
    userOutScreen.style.display = "flex";
    userInScreen.style.display = "none";
  }
};

// events
loginForm.addEventListener("submit", async (e) => {
  await loginUser(e);
});
settings.addEventListener("click", () => {
  chrome.tabs.create({ url: "https://www.linkedin.com/feed/" });
});
header.addEventListener("click", () => {
  chrome.tabs.create({ url: "https://www.buckfifty.com/core-network" });
});
footer.addEventListener("click", () => {
  chrome.tabs.create({ url: "https://www.buckfifty.com/core-network" });
});

(() => {
  // check in localstorage
  chrome.storage.local.get("uid", function (item) {
    if (item.uid) {
      userAuthed = item.uid;
      authUser();
    }
    if (!item.uid) {
      userAuthed = false;
      authUser();
    }
  });
})();
