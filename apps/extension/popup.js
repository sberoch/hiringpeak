const HIRINGPEAK_NEW_CANDIDATE_URL = "http://localhost:3000/candidates/new";

document.addEventListener("DOMContentLoaded", async function () {
  const ackButton = document.getElementById("ackButton");
  const extractButton = document.getElementById("extractButton");
  const statusMessage = document.getElementById("statusMessage");
  const step1 = document.getElementById("step1");
  const step2 = document.getElementById("step2");
  const imageSelection = document.getElementById("imageSelection");
  const imagePreview = document.getElementById("imagePreview");
  const imagePreviewCaption = document.getElementById("imagePreviewCaption");
  let currentProfilePicture = null;

  await checkAndUpdateButtonState();

  async function checkAndUpdateButtonState() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      const isLinkedIn = tab.url && tab.url.includes("linkedin.com");

      if (isLinkedIn) {
        ackButton.disabled = false;
        ackButton.style.opacity = "1";
        ackButton.style.cursor = "pointer";
        statusMessage.textContent = "Listo para obtener datos del candidato";
        statusMessage.style.backgroundColor = "#e7f3ff";
        statusMessage.style.borderColor = "#b8daff";
        statusMessage.style.color = "#004085";
        await loadProfilePreview(tab.id);
      } else {
        ackButton.disabled = true;
        ackButton.style.opacity = "0.6";
        ackButton.style.cursor = "not-allowed";
        statusMessage.textContent =
          "Navega a un perfil de LinkedIn para obtener datos";
        statusMessage.style.backgroundColor = "#fff3cd";
        statusMessage.style.borderColor = "#ffeaa7";
        statusMessage.style.color = "#856404";
        clearProfilePreview();
      }
    } catch (error) {
      console.error("Error al verificar la pestaña:", error);
      ackButton.disabled = true;
      ackButton.style.opacity = "0.6";
      statusMessage.textContent = "Error al verificar la página actual";
      clearProfilePreview();
    }
  }

  ackButton.addEventListener("click", async function () {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab?.id) {
      await loadProfilePreview(tab.id);
    }

    step1.style.display = "none";
    step2.style.display = "block";
    showStatusMessage(
      "PDF descargado. Presiona el botón para extraer los datos restantes.",
      "#d4edda",
      "#c3e6cb",
      "#155724",
    );
  });

  extractButton.addEventListener("click", extractPageData);

  async function extractPageData() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.url || !tab.url.includes("linkedin.com")) {
        showStatusMessage(
          "Por favor, navega a un perfil de LinkedIn primero.",
          "#f8d7da",
          "#f5c6cb",
          "#721c24",
        );
        return;
      }

      statusMessage.textContent = "Recopilando datos...";

      const profilePicture =
        currentProfilePicture || (await getProfilePicture(tab.id));

      if (!profilePicture) {
        showStatusMessage(
          "No se encontró imagen de perfil en esta página.",
          "#f8d7da",
          "#f5c6cb",
          "#721c24",
        );
        return;
      }

      let cleanUrl = tab.url;
      if (cleanUrl.endsWith("overlay/contact-info/")) {
        cleanUrl = cleanUrl.replace("overlay/contact-info/", "");
      }

      const queryParams = new URLSearchParams();
      queryParams.append("pageUrl", cleanUrl);
      queryParams.append("timestamp", new Date().toISOString());
      queryParams.append("profilePicture", profilePicture);

      const targetUrl = `${HIRINGPEAK_NEW_CANDIDATE_URL}?${queryParams.toString()}`;
      chrome.tabs.create({ url: targetUrl });

      showStatusMessage(
        "Datos recopilados y enviados! Nueva pestaña abierta.",
        "#d4edda",
        "#c3e6cb",
        "#155724",
      );
    } catch (error) {
      console.error("HiringPeak Extension - Error al recopilar datos:", error);
      showStatusMessage(
        "Error al recopilar datos. Ver consola para más detalles.",
        "#f8d7da",
        "#f5c6cb",
        "#721c24",
      );
    }
  }

  function extractProfilePicture() {
    const profileImagePattern =
      /profile-(displayphoto|framedphoto)-(scale|shrink)_(\d+)_(\d+)/i;

    const candidates = Array.from(document.querySelectorAll("img"))
      .filter(
        (img) =>
          img.src &&
          img.src.startsWith("https://media.licdn.com/") &&
          profileImagePattern.test(img.src),
      )
      .map((img) => {
        const naturalArea = (img.naturalWidth || 0) * (img.naturalHeight || 0);
        const rect = img.getBoundingClientRect();
        const renderedArea = rect.width * rect.height;

        return {
          src: img.src,
          naturalArea,
          renderedArea,
        };
      });

    if (candidates.length === 0) {
      return null;
    }

    candidates.sort((a, b) => {
      if (b.naturalArea !== a.naturalArea) {
        return b.naturalArea - a.naturalArea;
      }

      return b.renderedArea - a.renderedArea;
    });

    return candidates[0].src;
  }

  async function loadProfilePreview(tabId) {
    try {
      const profilePicture = await getProfilePicture(tabId);

      if (!profilePicture) {
        clearProfilePreview();
        return;
      }

      currentProfilePicture = profilePicture;
      imagePreview.src = profilePicture;
      imagePreviewCaption.textContent =
        "Esta es la foto de perfil que se enviará junto con los datos.";
      imageSelection.style.display = "block";
    } catch (error) {
      console.error("Error al cargar la vista previa de la foto:", error);
      clearProfilePreview();
    }
  }

  async function getProfilePicture(tabId) {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      function: extractProfilePicture,
    });

    return results[0].result;
  }

  function clearProfilePreview() {
    currentProfilePicture = null;
    imagePreview.removeAttribute("src");
    imagePreviewCaption.textContent = "";
    imageSelection.style.display = "none";
  }

  function showStatusMessage(message, bgColor, borderColor, color) {
    statusMessage.textContent = message;
    statusMessage.style.backgroundColor = bgColor;
    statusMessage.style.borderColor = borderColor;
    statusMessage.style.color = color;
  }
});
