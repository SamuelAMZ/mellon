// will help with removing extra trings like MBA, Phd... and emojis
const removeExtraStrings = (name) => {
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

export default removeExtraStrings;
