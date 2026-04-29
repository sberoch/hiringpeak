const HIRINGPEAK_URL = "https://app.hiringpeak.com/candidates/new";
const PARAM_FIELDS = [
  "pageUrl",
  "fullName",
  "currentPosition",
  "email",
  "phone",
  "profilePicture",
  "timestamp",
];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openHiringPeak") {
    console.log("HiringPeak Extension - Opening new candidate tab");
    const params = new URLSearchParams();
    for (const field of PARAM_FIELDS) {
      if (message.data[field]) params.set(field, message.data[field]);
    }
    chrome.tabs.create({ url: `${HIRINGPEAK_URL}?${params}` });
  }
});
