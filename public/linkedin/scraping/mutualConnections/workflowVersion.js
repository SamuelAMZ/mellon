function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const removeExtraStrings = (name) => {
  if (!name) return name;

  let chuncksOfName = name.split(" ");

  if (chuncksOfName.length < 1) return name;

  // remove emojis
  let filteredFromEmoji = [];

  for (let i = 0; i < chuncksOfName.length; i++) {
    const emojiRegex = /[\u{1F600}-\u{1F6FF}]/u; // Unicode range for emojis

    if (!emojiRegex.test(chuncksOfName[i])) {
      filteredFromEmoji.push(chuncksOfName[i]);
    }
  }

  // remove credentials
  let filteredFromCredentials = [];
  let credentials = [
    "MBA",
    "CPA",
    "PhD",
    "MD",
    "JD",
    "PMP",
    "CFA",
    "CFP",
    "CMA",
    "PE",
    "CISSP",
    "SHRM-CP",
    "PHR",
    "CFE",
    "CRISC",
    "CISA",
    "CFP",
    "ITIL",
  ];

  for (let y = 0; y < filteredFromEmoji.length; y++) {
    let isPresent = false;
    for (let z = 0; z < credentials.length; z++) {
      if (filteredFromEmoji[y] === credentials[z]) {
        isPresent = true;
      }
    }

    if (!isPresent) filteredFromCredentials.push(filteredFromEmoji[y]);
  }

  return filteredFromCredentials.length > 1
    ? filteredFromCredentials.join(" ")
    : "...";
};

// get from the localstorage the actual user linkedin url
// get from localstorage if user is key or potential intro
const getDataFromLocal = async () => {
  let mutualUrl = null;
  let mutualType = null;
  let userToken = null;
  let uid = null;
  let potential_id = null;
  let potential_goal_id = null;

  chrome.storage.local.get(
    [
      "currentMutualUrl",
      "currentMutualType",
      "utoken",
      "uid",
      "potential_id",
      "goal_id",
    ],
    function (result) {
      mutualUrl = result.currentMutualUrl;
      mutualType = result.currentMutualType;
      userToken = result.utoken;
      uid = result.uid;
      potential_id = result.potential_id;
      potential_goal_id = result.goal_id;
    }
  );

  await delay(200);

  return {
    mutualUrl,
    mutualType,
    userToken,
    uid,
    potential_id,
    potential_goal_id,
  };
};

// normalize linkedin urls
const mellonNormalizeLinkedinUrl = (linkedinUrlBrut) => {
  if (!linkedinUrlBrut) {
    return;
  }

  let url = linkedinUrlBrut.trim();

  // Remove the last slash character
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }

  return url;
};

// sendUser to workflow for process
const sendUserToWorkflow = async (linkedinUser) => {
  // data from localstorage
  let userToken = (await getDataFromLocal()).userToken;
  let potential_id = (await getDataFromLocal()).potential_id;
  let goal_id = (await getDataFromLocal()).potential_goal_id;

  // linkedin name
  let linkedinUserFullName = removeExtraStrings(linkedinUser?.name);

  // linkedin user url
  let linkedinUserUrl = mellonNormalizeLinkedinUrl(linkedinUser.profileUrl)
    ? mellonNormalizeLinkedinUrl(linkedinUser.profileUrl.split("?")[0])
    : "";

  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
  myHeaders.append("Authorization", "Bearer " + userToken);

  var urlencoded = new URLSearchParams();
  urlencoded.append("potential_intro", potential_id);
  urlencoded.append("goal", goal_id);
  urlencoded.append("mutual_connection_full_name", linkedinUserFullName);
  urlencoded.append("mutual_connection_linkedin_url", linkedinUserUrl);

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
  } catch (error) {
    console.log(error);
  }
};

// scrap urls
const scrapMutualUsers = async () => {
  // show little alert box on the top
  const mellonCreateBox = () => {
    let mellonAppLinkedinBody = document.querySelector("body");
    let mellonAlertBox = document.createElement("p");
    mellonAlertBox.classList.add("mellon-alert-box");
    mellonAlertBox.textContent =
      "Please refrain from closing this tab while we load your mutual connections. We appreciate your patience. Thank you.";
    mellonAppLinkedinBody.appendChild(mellonAlertBox);
  };
  mellonCreateBox();

  // scroll to the top and then to the bottom
  window.scroll(0, 0);
  const autoScroll = async () => {
    await new Promise((resolve) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  };
  autoScroll();

  //  get pagination number
  const getNumberOfPage = () => {
    let numberOfPage = 1;
    const paginationNumber = document.querySelector(
      "ul.artdeco-pagination__pages.artdeco-pagination__pages--number"
    );
    console.log(paginationNumber);
    if (!paginationNumber) {
      numberOfPage = 1;
    }
    if (paginationNumber) {
      let ulLength = document.querySelector(
        ".artdeco-pagination__pages.artdeco-pagination__pages--number"
      ).children.length;
      let btnText = Array.from(
        document.querySelector(
          ".artdeco-pagination__pages.artdeco-pagination__pages--number"
        ).children
      )[ulLength - 1].innerText;
      numberOfPage = Number(btnText);
    }

    console.log(numberOfPage);
    return numberOfPage;
  };

  const paginateAndGetPeople = async (pagesNum) => {
    for (let index = 0; index < pagesNum; index++) {
      // scroll top then to bottom
      window.scroll(0, 0);
      autoScroll();

      // grad people
      let dataFound = [];

      Array.from(
        document.querySelector("ul.reusable-search__entity-result-list")
          .children
      ).forEach((elm) => {
        dataFound.push({
          profileUrl: elm.querySelector("a.app-aware-link")?.href,
          image: elm.querySelector("a img.presence-entity__image")?.src,
          name: elm
            .querySelector(
              ".entity-result__content.entity-result__divider a span"
            )
            ?.innerText.trim()
            .split("\n")[0],
          role: elm
            .querySelector(
              ".entity-result__content.entity-result__divider .linked-area .entity-result__primary-subtitle"
            )
            ?.innerText.trim(),
          location: elm
            .querySelector(
              ".entity-result__content.entity-result__divider .linked-area .entity-result__secondary-subtitle"
            )
            ?.innerText.trim(),
        });
      });

      // add data to db
      for (let y = 0; y < dataFound.length; y++) {
        // send people found to workflow for backend process
        await sendUserToWorkflow(dataFound[y]);
      }
      dataFound = [];

      // click on next
      const nextBtn = document.querySelector(
        ".artdeco-pagination__button.artdeco-pagination__button--next.artdeco-button"
      );
      nextBtn?.click();

      // wait for loading
      await delay(5000);
    }
  };

  const waitForClass = (selector) => {
    return new Promise((resolve) => {
      const checkExistence = () => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
        } else {
          setTimeout(checkExistence, 100); // Check again after a short delay
        }
      };
      checkExistence();
    });
  };
  // #global-nav
  await waitForClass("#global-nav");

  // wait 1s to be sure
  await delay(2000);

  const numberOfPage = getNumberOfPage();
  await paginateAndGetPeople(numberOfPage);

  // once done close the page
  chrome.runtime.sendMessage({ from: "closeMutualsTab" });
};

// go
const mellonMutualGo = async () => {
  await scrapMutualUsers();
};

mellonMutualGo();
