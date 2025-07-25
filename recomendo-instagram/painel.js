document.addEventListener('DOMContentLoaded', function () {
  const startButton = document.getElementById('startBot');

  startButton.addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { cmd: 'start' });
    });
  });
});
