// Minimal MV3 service worker. Holds a little state and answers PINGs so the
// harness can prove side-panel <-> SW messaging and SW-via-evaluate.
let counter = 0;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "PING") {
    counter += 1;
    sendResponse({ pong: true, counter });
  }
  return true; // keep the message channel open for the async response
});

// A value the harness reads via serviceWorker.evaluate().
globalThis.__uxcue = { startedAt: Date.now(), get counter() { return counter; } };
