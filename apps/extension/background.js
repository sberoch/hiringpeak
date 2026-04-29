var HIRINGPEAK_URL = "https://app.hiringpeak.com/candidates/new";

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "openHiringPeak") {
    console.log("HiringPeak Extension - Opening new candidate tab");
    var data = message.data;
    var params = new URLSearchParams();

    if (data.pageUrl) params.set("pageUrl", data.pageUrl);
    if (data.fullName) params.set("fullName", data.fullName);
    if (data.currentPosition) params.set("currentPosition", data.currentPosition);
    if (data.email) params.set("email", data.email);
    if (data.phone) params.set("phone", data.phone);
    if (data.profilePicture) params.set("profilePicture", data.profilePicture);
    if (data.timestamp) params.set("timestamp", data.timestamp);

    var url = HIRINGPEAK_URL + "?" + params.toString();
    chrome.tabs.create({ url: url });
  }
});
