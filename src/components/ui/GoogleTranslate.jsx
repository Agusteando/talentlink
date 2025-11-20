// --- src\components\ui\GoogleTranslate.jsx ---
'use client';
import { useEffect } from 'react';
import { setCookie, getCookie } from 'cookies-next'; // You might need: npm install cookies-next

export default function GoogleTranslate() {
  useEffect(() => {
    // 1. Define the Google Translate Init function globally
    window.googleTranslateElementInit = function () {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'es',
          includedLanguages: 'en,es', // Only allow English and Spanish
          autoDisplay: false,
        },
        'google_translate_element'
      );
    };

    // 2. Load the script if not loaded
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div style={{ display: 'none' }}>
       {/* The invisible container where Google injects the widget */}
      <div id="google_translate_element"></div>
    </div>
  );
}