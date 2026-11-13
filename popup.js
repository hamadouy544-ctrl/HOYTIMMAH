document.addEventListener("DOMContentLoaded", () => {
  const boutons = document.querySelectorAll("button[data-lang]");
  boutons.forEach(bouton => {
    bouton.addEventListener("click", () => {
      let langue = bouton.getAttribute("data-lang");
      chrome.storage.local.set({ langue: langue }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) chrome.tabs.reload(tabs[0].id);
        });
        window.close();
      });
    });
  });

  const btnVoix = document.getElementById("btn-voix");
  if (btnVoix) {
    btnVoix.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: () => { window.dispatchEvent(new Event("hoytimmah-parler")); }
          });
        }
      });
      window.close();
    });
  }
});