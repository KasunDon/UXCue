// Side panel UI: click -> message the service worker -> render the reply.
document.getElementById("ping").addEventListener("click", async () => {
  const res = await chrome.runtime.sendMessage({ type: "PING" });
  document.getElementById("count").textContent = String(res.counter);
});
