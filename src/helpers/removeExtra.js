// will help with removing extra trings like MBA, Phd... and emojis
const removeExtraStrings = (name) => {
  // remove credential after the comma
  // let nameWithoutCredential = name.split(",")[1];
  if (!name) return;

  // remove emojis
  let filteredFromEmoji = name
    ?.replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ""
    )
    ?.trim();

  let filteredFromEmojiArr = filteredFromEmoji.split(" ");
  if (filteredFromEmojiArr.length < 1) return filteredFromEmoji;

  // remove credentials
  let filteredFromCredentials = [];
  let credentials = [
    "DR",
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

  for (let y = 0; y < filteredFromEmojiArr.length; y++) {
    let isPresent = false;
    for (let z = 0; z < credentials.length; z++) {
      if (
        filteredFromEmojiArr[y]?.toLowerCase() ===
          credentials[z]?.toLowerCase() ||
        filteredFromEmojiArr[y]?.toLowerCase() ===
          `${credentials[z]?.toLowerCase()}.` ||
        filteredFromEmojiArr[y]?.toLowerCase() ===
          `${credentials[z]?.toLowerCase()},`
      ) {
        isPresent = true;
      }
    }

    if (!isPresent) filteredFromCredentials.push(filteredFromEmojiArr[y]);
  }

  let actualName =
    filteredFromCredentials.length > 1
      ? filteredFromCredentials.join(" ")
      : "...";

  // remove comma
  let nameWithoutComma = actualName.replaceAll(",", "").replaceAll(".", "");

  return nameWithoutComma;
};

export default removeExtraStrings;
