import translations from "/src/i18n/translations";

let language = null;
let observer = null;

// Get the current language from the document
const getCurrentLanguage = () => document.documentElement.lang.split("-")[0];

function init() {
  setLanguage(getCurrentLanguage());

  // Observe changes to the 'lang' attribute of the document
  observer = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.attributeName === "lang")) {
      setLanguage(getCurrentLanguage());
    }
  });

  observer.observe(document.documentElement, { attributes: true });
}

// Disconnect the observer when it's no longer needed
function cleanup() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

// Set the current language, default to 'en' if not found in translations
function setLanguage(lang) {
  if (lang === language) return;
  language = translations[lang] ? lang : "en";
}

// Return the translation for the key if it exists, otherwise return the key itself
function translate(key) {
  return translations[language][key] || key;
}

export { init, cleanup, setLanguage, translate };
