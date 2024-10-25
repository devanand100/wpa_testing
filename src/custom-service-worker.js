importScripts("ngsw-worker.js");
self.addEventListener("push", (event) => {
  console.log("push event", event);
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Default Title";
  const options = {
    body: data.body || "Default Body",
    icon: "assets/icons/icon-512x512.png", // Update this path to your icon
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
