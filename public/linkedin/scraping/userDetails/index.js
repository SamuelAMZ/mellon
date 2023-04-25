// this file will grab user details and update them in the bd
let userLinked = null;
chrome.storage.local.get("uid", function (item) {
  if (item.uid) {
    userLinked = item.uid;
  }
  if (!item.uid) {
    userLinked = null;
  }
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
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

const grabUserDetails = async () => {
  // scroll to bottom
  window.scroll(0, 0);
  await autoScroll();

  //   wait 1sec
  await delay(1000);

  //   start scraping
  const userDetailsObj = {};

  //   user id
  userDetailsObj.uid = userLinked;

  //   get url
  chrome.runtime.sendMessage({ from: "getActualLink" }, (data) => {
    userDetailsObj.url = data.url;
  });

  //   get full name
  userDetailsObj.fullName = document
    .querySelector(".pv-text-details__left-panel h1")
    ?.textContent?.trim()
    .toLowerCase();

  // profile photo
  userDetailsObj.profilePhoto = document.querySelector(
    "button.pv-top-card-profile-picture img"
  )?.src;

  // actual role
  userDetailsObj.actualRole = document
    .querySelector(".pv-text-details__left-panel .text-body-medium")
    ?.textContent?.trim()
    .toLowerCase();

  // education
  let educationArr = [];
  Array.from(
    document
      .querySelector("#education")
      .parentElement.querySelector(".pvs-list__outer-container ul").children
  ).forEach((elm) => {
    educationArr.push(
      elm.querySelector("a > :nth-child(2)").textContent.trim()
    );
  });
  userDetailsObj.education = educationArr;

  // work experience
  let workExperienceArr = [];
  Array.from(
    document
      .querySelector("#experience")
      .parentElement.querySelector(".pvs-list__outer-container ul").children
  ).forEach((elm) => {
    workExperienceArr.push(
      elm
        .querySelector(
          ".pvs-entity.pvs-entity--padded > :nth-child(2) .mr1.t-bold > :nth-child(1)"
        )
        .textContent.trim()
    );
  });
  userDetailsObj.workExperience = workExperienceArr;

  // is first degree
  let isOrNot =
    document.querySelector(".dist-value ").innerText.trim() === "1st"
      ? true
      : false;
  userDetailsObj.isFirstDegree = isOrNot;

  console.log(userDetailsObj);
};

// mutual connections

// -- to fetch
// notes
// potential intro
// goals
// relationship strenght
// professional value

grabUserDetails();
