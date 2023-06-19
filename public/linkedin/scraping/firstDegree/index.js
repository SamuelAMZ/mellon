// this file will taje care of scraping first degree connection
const scrapFirstDegrees = async () => {
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

  // show little alert box on the top
  const mellonCreateBox = () => {
    let mellonAppLinkedinBody = document.querySelector("body");
    let mellonAlertBox = document.createElement("p");
    mellonAlertBox.classList.add("mellon-alert-box");
    mellonAlertBox.textContent =
      "Please refrain from closing this tab while we load your first-degree connections. This is a one-time process, and we appreciate your patience. Thank you.";
    mellonAppLinkedinBody.appendChild(mellonAlertBox);
  };
  mellonCreateBox();

  let userToken = null;
  let uid = null;
  chrome.storage.local.get("utoken", function (item) {
    if (item.utoken) {
      userToken = item.utoken;
    }
    if (!item.utoken) {
      userToken = null;
    }
  });
  chrome.storage.local.get("uid", function (item) {
    if (item.uid) {
      uid = item.uid;
    }
    if (!item.uid) {
      uid = null;
    }
  });

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

  // normalize linkedin urls
  const mellonNormalizeLinkedinUrl = (linkedinUrlBrut) => {
    let url = linkedinUrlBrut;

    // Remove the last slash character
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }

    return url;
  };

  // check before adding to db (prevent duplicates)
  const mellonPreventDuplicates = async (
    linkedinUrl,
    apiEndpoint,
    userNameKey
  ) => {
    let myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + userToken);

    let requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    const req = await fetch(
      `https://buckfifty.com/version-test/api/1.1/wf/get-connection?full_name=${userNameKey}&created_by=${uid}`,
      requestOptions
    );
    let result = await req.json();

    if (result?.response?.Connection && result?.response?.Connection._id) {
      return {
        method: "PATCH",
        url: `${apiEndpoint}/${result?.response?.Connection._id}`,
        data: result?.response?.Connection,
      };
    }

    return { method: "POST", url: apiEndpoint, data: {} };

    // let response = await fetch(
    //   `${apiEndpoint}?constraints=[ { "key": "Linkedin URL", "constraint_type": "equals", "value": ${JSON.stringify(
    //     linkedinUrl
    //   )} } ]`,
    //   requestOptions
    // );
    // let result = await response.json();

    // if (result.response.count > 0) {
    //   // return true so we cam use a PATCH request instead of a POST
    //   return {
    //     method: "PATCH",
    //     url: `${apiEndpoint}/${result.response.results[0]._id}`,
    //     data: result.response.results[0],
    //   };
    // }
    // return { method: "POST", url: apiEndpoint, data: {} };
  };

  // add the current record that are present in the db, so the PATCH request will not override them
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

  // add to db
  const addToDb = async (dataBrut) => {
    let linkedinUrl = dataBrut.profileUrl
      ? mellonNormalizeLinkedinUrl(dataBrut.profileUrl.split("?")[0])
      : "";

    let userNameKey = removeExtraStrings(dataBrut?.name);

    // check if the user already exist for the current user
    let updateRecord = await mellonPreventDuplicates(
      linkedinUrl,
      "https://buckfifty.com/version-test/api/1.1/obj/connection",
      userNameKey
    );

    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("Authorization", "Bearer " + userToken);

    let urlencoded = new URLSearchParams();

    // add the updated new values
    if (updateRecord.method !== "PATCH") {
      urlencoded.append("Is Key Relationship", "false");
    }
    urlencoded.append("is First Degree", "true");
    urlencoded.append("Linkedin URL", linkedinUrl);
    urlencoded.append("Profile Photo", dataBrut.image ? dataBrut.image : "");
    urlencoded.append(
      "Full Name",
      dataBrut.name ? removeExtraStrings(dataBrut.name) : ""
    );
    urlencoded.append(
      "Linkedin Description",
      dataBrut.role ? dataBrut.role : "..."
    );

    let requestOptions = {
      method: updateRecord.method,
      headers: myHeaders,
      body: urlencoded,
      redirect: "follow",
    };

    let response = await fetch(updateRecord.url, requestOptions);
    let result = response.json();
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

  // wait for header class to be visible

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
  chrome.runtime.sendMessage({ from: "closeFirstDegreeTab" });
};

window.addEventListener("load", scrapFirstDegrees);
