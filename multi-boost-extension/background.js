// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ MultiBoost extension installed");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'uploadComplete') {
    console.log(`✅ Upload complete for file: ${message.fileName}`);
  }
});
