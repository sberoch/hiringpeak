let profileData = null;

document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];

    if (!tab || !tab.url || !tab.url.includes("linkedin.com")) {
      document.getElementById("loading").style.display = "none";
      document.getElementById("not-linkedin").style.display = "block";
      return;
    }

    chrome.tabs.sendMessage(
      tab.id,
      { action: "scrapeProfile" },
      (response) => {
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

  document.getElementById("send-button").addEventListener("click", () => {
    if (!profileData) return;
    chrome.runtime.sendMessage({ action: "openHiringPeak", data: profileData });
    window.close();
  });
});

function showProfileData(data) {
  const nameEl = document.getElementById("profile-name");
  const positionEl = document.getElementById("profile-position");
  const pictureEl = document.getElementById("profile-picture");
  const dataSection = document.getElementById("profile-data");

  nameEl.textContent = data.fullName || "Sin nombre";
  positionEl.textContent = data.currentPosition || "Sin cargo";

  if (data.profilePicture) {
    pictureEl.src = data.profilePicture;
    pictureEl.style.display = "block";
  }

  dataSection.style.display = "block";
}
