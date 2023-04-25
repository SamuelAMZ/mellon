const cloneExtCheckForUid = () => {
  let uid = null;

  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i);
    const value = sessionStorage.getItem(key);

    if (Number(value) !== 0) {
      uid = key;
    }
  }

  let uid_real = uid?.split("db_latest_version_")[1];
  if (uid_real && Number(uid_real?.replace("x", "")) !== NaN) {
    return uid_real;
  }

  return null;
};

// set user uid in localstorage from the background
if (cloneExtCheckForUid()) {
  chrome.runtime.sendMessage(
    { from: "auth_success", uid: cloneExtCheckForUid() },
    function (response) {
      console.log(response.message);
    }
  );
}
