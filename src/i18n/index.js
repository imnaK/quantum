import translations from '/src/i18n/translations';

let language = null;
let observer = null;

const getCurrentLanguage = () => document.documentElement.lang.split('-')[0];

function init() {
  setLanguage(getCurrentLanguage());

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'lang') {
        setLanguage(getCurrentLanguage());
      }
    });
  });

  observer.observe(document.documentElement, { attributes: true });
}

function cleanup() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

function setLanguage(newLanguage) {
  if (newLanguage === language) return;

  if (translations[newLanguage]) {
    language = newLanguage;
  } else {
    language = 'en';
  }
}

function translate(key) {
  return translations[language][key] || key;
}

export { init, cleanup, setLanguage, translate };