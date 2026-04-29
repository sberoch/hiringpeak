var HIRINGPEAK_URL = "https://app.hiringpeak.com/candidates/new";

var profileData = null;

document.addEventListener("DOMContentLoaded", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var tab = tabs[0];

    if (!tab || !tab.url || !tab.url.includes("linkedin.com")) {
      document.getElementById("loading").style.display = "none";
      document.getElementById("not-linkedin").style.display = "block";
      return;
    }

    chrome.tabs.sendMessage(
      tab.id,
      { action: "scrapeProfile" },
      function (response) {
        document.getElementById("loading").style.display = "none";

        if (chrome.runtime.lastError || !response) {
          console.log(
            "HiringPeak Extension - Error getting profile data:",
            chrome.runtime.lastError,
          );
          document.getElementById("error").style.display = "block";
          return;
        }

        profileData = response;
        showProfileData(response);
      },
    );
  });

  document.getElementById("send-button").addEventListener("click", function () {
    if (!profileData) return;

    var params = new URLSearchParams();
    if (profileData.pageUrl) params.set("pageUrl", profileData.pageUrl);
    if (profileData.fullName) params.set("fullName", profileData.fullName);
    if (profileData.currentPosition)
      params.set("currentPosition", profileData.currentPosition);
    if (profileData.email) params.set("email", profileData.email);
    if (profileData.phone) params.set("phone", profileData.phone);
    if (profileData.profilePicture)
      params.set("profilePicture", profileData.profilePicture);
    if (profileData.timestamp)
      params.set("timestamp", profileData.timestamp);

    var url = HIRINGPEAK_URL + "?" + params.toString();
    console.log("HiringPeak Extension - Opening:", url);
    chrome.tabs.create({ url: url });
    window.close();
  });
});

function showProfileData(data) {
  var nameEl = document.getElementById("profile-name");
  var positionEl = document.getElementById("profile-position");
  var pictureEl = document.getElementById("profile-picture");
  var dataSection = document.getElementById("profile-data");

  nameEl.textContent = data.fullName || "Sin nombre";
  positionEl.textContent = data.currentPosition || "Sin cargo";

  if (data.profilePicture) {
    pictureEl.src = data.profilePicture;
    pictureEl.style.display = "block";
  }

  dataSection.style.display = "block";
}
