// trigger new share
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // login attempt
  if (message.from === "loginAttempt") {
    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    let urlencoded = new URLSearchParams();
    urlencoded.append("email", message.data.email.trim());
    urlencoded.append("password", message.data.password);

    let requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: urlencoded,
      redirect: "follow",
    };

    fetch(
      "https://buckfifty.com/version-test/api/1.1/wf/generate-user-token",
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => {
        console.log(result);
        if (result.status === "success") {
          chrome.storage.local.set(
            { uid: result.response.user_id, utoken: result.response.token },
            function () {
              sendResponse({ user: true, uid: result.response.user_id });
              console.log("user login success...");
            }
          );
        }

        if (result.status !== "success" || result.statusCode === 400) {
          sendResponse({ user: false, errorType: result.message });
          console.log(result.message);
        }
      })
      .catch((error) => console.log("error", error));
  }

  // check the login uid and set it to the localstorage
  if (message.from === "auth_success") {
    chrome.storage.local.set({ uid: message.uid }, function () {
      console.log("user login success...");
    });
  }

  if (message.from === "auth_check") {
    chrome.storage.local.get("uid", function (item) {
      if (item.uid) {
        sendResponse({ user: true, uid: item.uid });
      }
      if (!item.uid) {
        sendResponse({ user: false });
      }
    });
  }

  // open first degree tab
  if (message.from === "openFirstDegreeTab") {
    function delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // let alreadyExist = false;
    chrome.tabs.query({}, async (tabs) => {
      await delay(200);

      chrome.tabs.create(
        {
          url: "https://www.linkedin.com/search/results/people/?network=%5B%22F%22%5D",
          active: true,
        },
        (tabs) => {
          const tabId = tabs.id;

          // Execute the content script on the current tab
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["linkedin/scraping/firstDegree/index.js"],
          });

          //set already scrape first degree to true
          chrome.storage.local.set({ alreadyFirsts: true }, function () {
            console.log("setted 1st degrees already scrapped");
          });
        }
      );
    });
  }

  // close first degree tab once done
  // closeFirstDegreeTab
  if (message.from === "closeFirstDegreeTab") {
    function delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    chrome.tabs.query({}, async (tabs) => {
      for (let i = 0; i < tabs.length; i++) {
        if (
          tabs[i].url.includes(
            "https://www.linkedin.com/search/results/people/?network=%5B%22F%22%5D"
          )
        ) {
          chrome.tabs.remove(tabs[i].id);
          await delay(200);
        }
      }
    });
  }

  // open linkedin user page
  if (message.from === "openUserUrl") {
    chrome.tabs.create(
      {
        url: message.url,
        active: true,
      },
      (tabs) => {
        const tabId = tabs.id;

        // Execute the content script on the current tab
        // chrome.scripting.executeScript({
        //   target: { tabId: tabId },
        //   files: ["linkedin/scraping/userDetails/index.js"],
        // });
      }
    );
  }

  // get actual link
  if (message.from === "getActualLink") {
    chrome.tabs.query(
      { active: true, lastFocusedWindow: true },
      function (tabs) {
        let url = tabs[0].url;
        sendResponse({ url: url });
      }
    );
  }

  // open mutual connection url
  if (message.from === "mutualAction") {
    chrome.tabs.create(
      {
        url: message.url,
        active: true,
      },
      (tabs) => {
        const tabId = tabs.id;

        // Execute the content script on the current tab
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ["linkedin/scraping/mutualConnections/index.js"],
        });
      }
    );
  }

  // open potential mutual connection url
  if (message.from === "mutualActionPotential") {
    chrome.tabs.create(
      {
        url: message.url,
        active: true,
      },
      (tabs) => {
        const tabId = tabs.id;

        // Execute the content script on the current tab
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ["linkedin/scraping/mutualConnections/workflowVersion.js"],
        });
      }
    );
  }

  // close mutual connection page
  if (message.from === "closeMutualsTab") {
    function delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    chrome.tabs.query({}, async (tabs) => {
      for (let i = 0; i < tabs.length; i++) {
        if (
          tabs[i].url.includes(
            "https://www.linkedin.com/search/results/people/?facetConnectionOf"
          )
        ) {
          chrome.tabs.remove(tabs[i].id);
          await delay(200);
        }
      }
    });
  }

  // open popup on click on icon on other sites
  if (message.from === "openPopup") {
    chrome.action.openPopup();
  }

  return true;
});
