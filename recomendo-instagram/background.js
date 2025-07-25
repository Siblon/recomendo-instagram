chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ Extensão Recomendo Instagram instalada!");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.tipo === "log") console.log("📋 LOG:", request.msg);
  if (request.tipo === "perfilVisitado") console.log(`👣 Visitado: ${request.msg}`);
  if (request.tipo === "erro") console.error("❌ Erro:", request.msg);
  sendResponse({ status: "ok" });
});
