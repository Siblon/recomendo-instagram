document.getElementById("iniciarBot").addEventListener("click", () => {
  const maxPerfis = parseInt(document.getElementById("maxPerfis").value, 10);
  const maxCurtidas = parseInt(document.getElementById("maxCurtidas").value, 10);
  const minDelay = parseInt(document.getElementById("minDelay").value, 10);
  const maxDelay = parseInt(document.getElementById("maxDelay").value, 10);

  if (isNaN(maxPerfis) || maxPerfis <= 0) {
    return alert("Número de perfis inválido");
  }
  if (isNaN(maxCurtidas) || maxCurtidas < 0 || maxCurtidas > 4) {
    return alert("Fotos para curtir deve ser 0-4");
  }
  if (isNaN(minDelay) || minDelay < 0) {
    return alert("Delay mínimo inválido");
  }
  if (isNaN(maxDelay) || maxDelay < minDelay) {
    return alert("Delay máximo deve ser >= mínimo");
  }

  const config = { maxPerfis, maxCurtidas, minDelay, maxDelay };

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["contentscript.js"]
    }, () => {
      chrome.tabs.sendMessage(tabId, { type: "config", data: config });
    });
  });
});
