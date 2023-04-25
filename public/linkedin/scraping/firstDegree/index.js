// this file will taje care of scraping first degree connection
const scrapFirstDegrees = async () => {
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  let userLinked = null;
  chrome.storage.local.get("uid", function (item) {
    if (item.uid) {
      userLinked = item.uid;
    }
    if (!item.uid) {
      userLinked = null;
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
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append(
      "Authorization",
      "Bearer 725b8d6584b071a02e1316945bf7743b"
    );

    var raw = {
      isFirstDegree: true,
      fullName: dataBrut.name ? dataBrut.name : "",
      linkedinUrl: dataBrut.profileUrl ? dataBrut.profileUrl.split("?")[0] : "",
      profilePhoto: dataBrut.image ? dataBrut.image : "",
      userLinked: userLinked,
    };

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(raw),
      redirect: "follow",
    };

    fetch("http://localhost:4001/api/new-connection", requestOptions)
      .then((response) => response.text())
      .then((result) => console.log(result))
      .catch((error) => console.log("error", error));
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
  paginateAndGetPeople(numberOfPage);
};

window.addEventListener("load", scrapFirstDegrees);
