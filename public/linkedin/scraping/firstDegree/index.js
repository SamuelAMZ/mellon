// this file will taje care of scraping first degree connection
const scrapFirstDegrees = async () => {
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

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

  let userLinked = null;
  let userToken = null;
  chrome.storage.local.get("uid", function (item) {
    if (item.uid) {
      userLinked = item.uid;
    }
    if (!item.uid) {
      userLinked = null;
    }
  });
  chrome.storage.local.get("utoken", function (item) {
    if (item.utoken) {
      userToken = item.utoken;
    }
    if (!item.utoken) {
      userToken = null;
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

  // add to db
  const addToDb = async (dataBrut) => {
    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("Authorization", "Bearer " + userToken);

    var urlencoded = new URLSearchParams();
    urlencoded.append("is_key_relationship_boolean", "false");
    urlencoded.append("isfirstdegree_boolean", "true");
    urlencoded.append(
      "linkedin_url_text",
      dataBrut.profileUrl ? dataBrut.profileUrl.split("?")[0] : ""
    );
    urlencoded.append(
      "profile_photo_image",
      dataBrut.image ? dataBrut.image : ""
    );
    urlencoded.append("full_name_text", dataBrut.name ? dataBrut.name : "");

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: urlencoded,
      redirect: "follow",
    };

    fetch(
      "https://mellon.app/version-test/api/1.1/obj/connection",
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => {
        console.log(result);
      });
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

      console.log(dataFound);
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
  chrome.runtime.sendMessage({ from: "closeFirstDegreeTab" });
};

window.addEventListener("load", scrapFirstDegrees);
