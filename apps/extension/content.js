(function () {
  if (document.getElementById("hiringpeak-fab")) return;

  var fab = document.createElement("img");
  fab.id = "hiringpeak-fab";
  fab.src = chrome.runtime.getURL("icons/logo.png");
  fab.alt = "HiringPeak";
  fab.title = "Enviar a HiringPeak";
  fab.style.cssText = [
    "position: fixed",
    "bottom: 24px",
    "right: 24px",
    "width: 56px",
    "height: 56px",
    "cursor: pointer",
    "z-index: 999999",
    "border-radius: 50%",
    "box-shadow: 0 2px 8px rgba(0,0,0,0.3)",
    "transition: transform 0.2s",
  ].join(";");

  fab.addEventListener("mouseenter", function () {
    fab.style.transform = "scale(1.1)";
  });
  fab.addEventListener("mouseleave", function () {
    fab.style.transform = "scale(1)";
  });

  fab.addEventListener("click", function () {
    console.log("HiringPeak Extension - FAB clicked, scraping profile...");
    var data = scrapeProfile();
    chrome.runtime.sendMessage({ action: "openHiringPeak", data: data });
  });

  document.body.appendChild(fab);
  console.log("HiringPeak Extension - FAB injected");

  chrome.runtime.onMessage.addListener(function (
    message,
    sender,
    sendResponse,
  ) {
    if (message.action === "scrapeProfile") {
      console.log("HiringPeak Extension - Scrape requested by popup");
      var data = scrapeProfile();
      sendResponse(data);
    }
  });

  function scrapeProfile() {
    var fullName = "";
    var currentPosition = "";
    var profilePicture = "";

    var nameEl = document.querySelector("h1.text-heading-xlarge");
    if (!nameEl) {
      nameEl = document.querySelector("h1");
    }
    if (nameEl) {
      fullName = nameEl.innerText.trim();
    }

    var headlineEl = document.querySelector(".text-body-medium.break-words");
    if (!headlineEl) {
      headlineEl = document.querySelector(
        ".pv-top-card--list .text-body-medium",
      );
    }
    if (headlineEl) {
      currentPosition = headlineEl.innerText.trim();
    }

    var photoEl = document.querySelector(
      'img.pv-top-card-profile-picture__image--show[src*="media"]',
    );
    if (!photoEl) {
      photoEl = document.querySelector(
        '.pv-top-card__photo img[src*="media"]',
      );
    }
    if (!photoEl) {
      photoEl = document.querySelector(
        'img.presence-entity__image[src*="media"]',
      );
    }
    if (photoEl) {
      profilePicture = photoEl.src;
    }

    var pageUrl = window.location.href;

    console.log("HiringPeak Extension - Scraped:", {
      fullName: fullName,
      currentPosition: currentPosition,
      profilePicture: profilePicture ? "(found)" : "(not found)",
      pageUrl: pageUrl,
    });

    return {
      fullName: fullName,
      currentPosition: currentPosition,
      profilePicture: profilePicture,
      pageUrl: pageUrl,
      email: "",
      phone: "",
      timestamp: new Date().toISOString(),
    };
  }
})();
