
chrome.runtime.onInstalled.addListener(() => {
  console.log("Recomendo Instagram instalado.");
});

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, {
    openGrowbot: true
  });
});
