(() => {
  if (document.getElementById("hiringpeak-fab")) return;

  const fab = document.createElement("img");
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

  fab.addEventListener("mouseenter", () => {
    fab.style.transform = "scale(1.1)";
  });
  fab.addEventListener("mouseleave", () => {
    fab.style.transform = "scale(1)";
  });

  fab.addEventListener("click", () => {
    console.log("HiringPeak Extension - FAB clicked, scraping profile...");
    const data = scrapeProfile();
    chrome.runtime.sendMessage({ action: "openHiringPeak", data });
  });

  document.body.appendChild(fab);
  console.log("HiringPeak Extension - FAB injected");

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "scrapeProfile") {
      console.log("HiringPeak Extension - Scrape requested by popup");
      sendResponse(scrapeProfile());
    }
  });

  function queryFirst(...selectors) {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return null;
  }

  function scrapeProfile() {
    const nameEl = queryFirst("h1.text-heading-xlarge", "h1");
    const fullName = nameEl ? nameEl.innerText.trim() : "";

    const headlineEl = queryFirst(
      ".text-body-medium.break-words",
      ".pv-top-card--list .text-body-medium",
    );
    const currentPosition = headlineEl ? headlineEl.innerText.trim() : "";

    const photoEl = queryFirst(
      'img.pv-top-card-profile-picture__image--show[src*="media"]',
      '.pv-top-card__photo img[src*="media"]',
      'img.presence-entity__image[src*="media"]',
    );
    const profilePicture = photoEl ? photoEl.src : "";

    const pageUrl = window.location.href;

    console.log("HiringPeak Extension - Scraped:", {
      fullName,
      currentPosition,
      profilePicture: profilePicture ? "(found)" : "(not found)",
      pageUrl,
    });

    return {
      fullName,
      currentPosition,
      profilePicture,
      pageUrl,
      email: "",
      phone: "",
      timestamp: new Date().toISOString(),
    };
  }
})();
