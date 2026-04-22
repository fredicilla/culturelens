// language.js
// Manage Bilingual English / Saudi Arabic State

window.currentLang = localStorage.getItem('cultureLensLang') || 'en';

function toggleLanguage() {
  window.currentLang = window.currentLang === 'en' ? 'ar' : 'en';
  localStorage.setItem('cultureLensLang', window.currentLang);
  applyLanguage();
}

function applyLanguage() {
  const isAr = window.currentLang === 'ar';
  
  // 1. Update HTML dir and lang
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  document.documentElement.lang = window.currentLang;
  
  // 2. Update all static translatable elements
  document.querySelectorAll('.translatable').forEach(el => {
    el.style.opacity = '0';
    setTimeout(() => {
      const newText = el.getAttribute(`data-${window.currentLang}`);
      if (newText) {
        // If it's HTML content instead of just text (e.g. for spans within)
        if (el.hasAttribute('data-html')) {
            el.innerHTML = newText;
        } else {
            el.textContent = newText;
        }
      }
      el.style.opacity = '1';
    }, 150);
  });
  
  // 3. Update toggle button label (if it exists on new page)
  const btnLabel = document.getElementById('lang-label');
  if (btnLabel) {
    btnLabel.textContent = isAr ? '🇬🇧 English' : '🇸🇦 العربية';
  }
  
  // 4. Handle body classes for generic CSS targetting
  if (isAr) {
    document.body.classList.add('arabic-mode');
  } else {
    document.body.classList.remove('arabic-mode');
  }

  // 5. Fire event for custom JS components to catch
  const event = new CustomEvent('languageChanged', { detail: { lang: window.currentLang } });
  document.dispatchEvent(event);
}

// Automatically apply immediately
document.addEventListener('DOMContentLoaded', applyLanguage);
// Run once proactively if DOM is already ready
if (document.readyState === "complete" || document.readyState === "interactive") {
    applyLanguage();
}
