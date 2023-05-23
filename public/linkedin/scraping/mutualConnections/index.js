// get from the localstorage the actual user linkedin url
// get from localstorage if user is key or potential intro

// check if user exist or not (potential intro or key)
// if user not exist, return
// if exist return current user data

// scrap urls

// for each url,
// check if url is present as a connection
// if not, create the connection (POST) and add to the mutual arr
// if exist, add the uid to the current user mutuals array (PUT)

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// get from the localstorage the actual user linkedin url
// get from localstorage if user is key or potential intro
const getDataFromLocal = async () => {
  let mutualUrl = null;
  let mutualType = null;
  let userToken = null;

  chrome.storage.local.get(
    ["currentMutualUrl", "currentMutualType", "utoken"],
    function (result) {
      mutualUrl = result.currentMutualUrl;
      mutualType = result.currentMutualType;
      userToken = result.utoken;
    }
  );

  await delay(200);

  return { mutualUrl, mutualType, userToken };
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

// check if user exist or not (potential intro or key)
// if user not exist, return
// if exist return current user data
const checkUserExist = async () => {
  let userExist = false;
  let userToken = (await getDataFromLocal()).userToken;
  let userUrl = (await getDataFromLocal()).mutualUrl;

  const mellonCheckKeyProfile = async () => {
    let myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + userToken);

    let requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    let linkedinUrl = mellonNormalizeLinkedinUrl(userUrl);

    const req = await fetch(
      `https://buckfifty.com/version-test/api/1.1/obj/connection?constraints=[ { "key": "Linkedin URL", "constraint_type": "equals", "value": ${JSON.stringify(
        linkedinUrl
      )} }, { "key": "Is Key Relationship", "constraint_type": "equals", "value": "true" } ]`,
      requestOptions
    );

    let result = await req.json();

    if (result?.response?.results.length > 0) {
      return result?.response?.results[0];
    } else {
      return false;
    }
  };
  const mellonCheckPotentialProfile = async () => {
    let myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + userToken);

    let requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    let linkedinUrl = mellonNormalizeLinkedinUrl(userUrl);

    const req = await fetch(
      `https://buckfifty.com/version-test/api/1.1/obj/potentialIntro?constraints=[ { "key": "Linkedin URL", "constraint_type": "equals", "value": ${JSON.stringify(
        linkedinUrl
      )} } ]`,
      requestOptions
    );

    let result = await req.json();

    if (result?.response?.results.length > 0) {
      return result?.response?.results[0];
    } else {
      return false;
    }
  };

  // if curent mutual type is key
  if ((await getDataFromLocal()).mutualType === "key") {
    userExist = await mellonCheckKeyProfile();
  }

  // if curent mutual type is potential
  if ((await getDataFromLocal()).mutualType === "potential") {
    userExist = await mellonCheckPotentialProfile();
  }

  return userExist;
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

  // add the current record that are present in the db, so the PUT request will not override them
  const addCurrentValues = (data, valuesToAdd, urlencoded) => {
    if (!data._id) {
      return;
    }

    // loop inside the data
    // if field is not egal to the defaults
    // the update ones
    // add the rest to an array
    // filter the array
    // append

    let fieldsToAdd = [];

    const check = (field) => {
      for (let i = 0; i < valuesToAdd.length; i++) {
        if (field === valuesToAdd[i]) {
          return false;
        }
      }

      if (
        field === "Modified Date" ||
        field === "Created Date" ||
        field === "Created By" ||
        field === "_id"
      ) {
        return false;
      }

      return true;
    };

    for (let prop in data) {
      if (check(prop)) {
        fieldsToAdd.push({ field: prop, value: data[prop] });
      }
    }

    for (let i = 0; i < fieldsToAdd.length; i++) {
      urlencoded.append(fieldsToAdd[i].field, fieldsToAdd[i].value);
    }
  };

  //   check if mutual user found in DOM exist
  const isMutualUserFoundExist = async (linkedinUrl) => {
    let userToken = (await getDataFromLocal()).userToken;

    let myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + userToken);

    let requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    let response = await fetch(
      `https://buckfifty.com/version-test/api/1.1/obj/connection?constraints=[ { "key": "Linkedin URL", "constraint_type": "equals", "value": ${JSON.stringify(
        linkedinUrl
      )} } ]`,
      requestOptions
    );
    let result = await response.json();

    if (result.response.count > 0) {
      // return true so we cam use a PUT request instead of a POST
      return result.response.results[0];
    }

    return false;
  };

  //   create user (connection)
  const mellonMutualCreateUser = async (dataBrut) => {
    let userToken = (await getDataFromLocal()).userToken;

    // get target user id
    let currentUser = await checkUserExist();

    let linkedinUrl = dataBrut.profileUrl
      ? mellonNormalizeLinkedinUrl(dataBrut.profileUrl.split("?")[0])
      : "";

    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("Authorization", "Bearer " + userToken);

    let urlencoded = new URLSearchParams();

    // add the updated new values
    urlencoded.append("Is Key Relationship", "false");
    urlencoded.append("is First Degree", "true");
    urlencoded.append("Linkedin URL", linkedinUrl);
    urlencoded.append("Potential Intros", JSON.stringify([currentUser._id]));
    urlencoded.append("Profile Photo", dataBrut.image ? dataBrut.image : "");
    urlencoded.append("Full Name", dataBrut.name ? dataBrut.name : "");
    urlencoded.append(
      "Linkedin Description",
      dataBrut.role ? dataBrut.role : "..."
    );

    let requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: urlencoded,
      redirect: "follow",
    };

    try {
      let response = await fetch(
        "https://buckfifty.com/version-test/api/1.1/obj/connection",
        requestOptions
      );
      let result = await response.json();
      return result.id;
    } catch (error) {
      console.log(error);
      return;
    }
  };

  //   fetch new created user
  const fetchConnection = async (uid) => {
    let userToken = (await getDataFromLocal()).userToken;

    let myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + userToken);

    let requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    const req = await fetch(
      `https://buckfifty.com/version-test/api/1.1/obj/connection?constraints=[ { "key": "_id", "constraint_type": "equals", "value": ${JSON.stringify(
        uid
      )} } ]`,
      requestOptions
    );

    let result = await req.json();

    if (result?.response?.results.length > 0) {
      return result?.response?.results[0];
    } else {
      return console.log("error finding user");
    }
  };

  //   update current user mutual connections list
  const mellonUpdateUserMutualList = async (
    newMutualId,
    existingData,
    fetchUrl
  ) => {
    let userToken = (await getDataFromLocal()).userToken;

    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("Authorization", "Bearer " + userToken);

    let urlencoded = new URLSearchParams();

    // new values to add
    let valuesToAdd = ["Mutual Connections"];

    // get current user
    let currentUser = await checkUserExist();

    // add the current existant records
    addCurrentValues(currentUser, valuesToAdd, urlencoded);

    // configure arr of mutuals to add
    let mutualArr = [];
    if (currentUser["Mutual Connections"]) {
      mutualArr = [...currentUser["Mutual Connections"]];
    }
    mutualArr.push(newMutualId);

    // add the updated new values
    urlencoded.append("Mutual Connections", JSON.stringify(mutualArr));

    let requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: urlencoded,
      redirect: "follow",
    };

    let response = await fetch(
      `${fetchUrl}/${currentUser._id}`,
      requestOptions
    );

    // console.log("going 4");
    // let result = await response.json();
    console.log("done");
  };

  // update connection potential intro list
  const mellonUpdateConnectionPotentials = async (targetCon) => {
    // fetch connection
    let connection = await fetchConnection(targetCon);

    // update it s potential intro
    let userToken = (await getDataFromLocal()).userToken;

    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("Authorization", "Bearer " + userToken);

    let urlencoded = new URLSearchParams();

    // new values to add
    let valuesToAdd = ["Potential Intros", "Goals"];

    // get current user
    let currentUser = await checkUserExist();

    // add the current existant records
    addCurrentValues(connection, valuesToAdd, urlencoded);

    // configure arr of mutuals to add
    let potentialArr = [];
    if (connection["Potential Intros"]) {
      potentialArr = [...connection["Potential Intros"]];
    }
    potentialArr.push(currentUser._id);

    // fix goals json parsing error
    let goalsArr = [];
    if (connection.Goals) {
      goalsArr = [...connection.Goals];
    }

    // add the updated new values
    urlencoded.append("Potential Intros", JSON.stringify(potentialArr));
    urlencoded.append("Goals", JSON.stringify(goalsArr));

    let requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: urlencoded,
      redirect: "follow",
    };

    let response = await fetch(
      `https://buckfifty.com/version-test/api/1.1/obj/connection/${connection._id}`,
      requestOptions
    );
  };

  // add to db
  const addToDb = async (dataBrut) => {
    let mutualsArr = "";
    let mutulUserData = null;

    // check if mutual user exist (connections) ---
    let linkedinUrl = dataBrut.profileUrl
      ? mellonNormalizeLinkedinUrl(dataBrut.profileUrl.split("?")[0])
      : "";
    let isMutualExist = await isMutualUserFoundExist(linkedinUrl);

    // if not, create user (connection) new func for each
    // then add it s uid in the mutuals array ---
    if (!isMutualExist) {
      mutualsArr = await mellonMutualCreateUser(dataBrut);
      console.log("1");
    }

    // if exist, add uid to mutuals arr
    if (isMutualExist) {
      mutualsArr = isMutualExist._id;

      // update connection potential intro list
      await mellonUpdateConnectionPotentials(mutualsArr);
    }

    // dynamicly determine the right update PUT url from local
    let dynamicPutUrl = "";
    let mutualType = null;

    chrome.storage.local.get(["currentMutualType"], function (result) {
      mutualType = result.currentMutualType;
    });

    await delay(200);

    if (mutualType === "key") {
      dynamicPutUrl =
        "https://buckfifty.com/version-test/api/1.1/obj/connection";
    }
    if (mutualType === "potential") {
      dynamicPutUrl =
        "https://buckfifty.com/version-test/api/1.1/obj/potentialIntro";
    }

    // send a PUT to update current user ---
    await mellonUpdateUserMutualList(mutualsArr, mutulUserData, dynamicPutUrl);
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
        await addToDb(dataFound[y]);
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

  // wait 1s
  await delay(1000);

  const numberOfPage = getNumberOfPage();
  await paginateAndGetPeople(numberOfPage);

  // once done close the page
  chrome.runtime.sendMessage({ from: "closeMutualsTab" });
};

// go
const mellonMutualGo = async () => {
  let isMellonUserExist = await checkUserExist();

  if (isMellonUserExist) {
    console.log("user exist");
    await scrapMutualUsers();
  }
};

mellonMutualGo();
