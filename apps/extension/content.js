(function () {
  "use strict";

  if (!window.location.hostname.includes("linkedin.com")) {
    return;
  }

  if (document.getElementById("hiringpeak-fab")) {
    return;
  }

  const fab = document.createElement("div");
  fab.id = "hiringpeak-fab";
  fab.innerHTML = `
    <img src="${chrome.runtime.getURL(
      "icons/icon48.png",
    )}" alt="HiringPeak" style="width: 32px; height: 32px;">
  `;

  Object.assign(fab.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    width: "56px",
    height: "56px",
    backgroundColor: "white",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: "999999",
    transition: "all 0.3s ease",
    border: "2px solid #0073b1",
  });

  fab.addEventListener("mouseenter", () => {
    fab.style.transform = "scale(1.1)";
  });

  fab.addEventListener("mouseleave", () => {
    fab.style.transform = "scale(1)";
  });

  fab.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "openPopup" });
  });

  document.body.appendChild(fab);
})();
