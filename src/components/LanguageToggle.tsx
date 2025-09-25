'use client';

import { useEffect, useState } from 'react';
import styles from './LanguageToggle.module.css';

declare global {
  interface Window {
    google: any;
  }
}

export default function LanguageToggle() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max

    const checkGoogleTranslate = () => {
      attempts++;
      
      if (typeof window !== 'undefined' && window.google && window.google.translate) {
        setIsLoaded(true);
      } else if (attempts < maxAttempts) {
        setTimeout(checkGoogleTranslate, 100);
      } else {
        // Show fallback after max attempts
        setShowFallback(true);
      }
    };

    checkGoogleTranslate();
  }, []);

  if (showFallback) {
    return (
      <div className={styles.languageToggle}>
        <div className={styles.fallback}>
          <button 
            className={styles.fallbackButton}
            onClick={() => {
              // Simple language toggle for development
              const elements = document.querySelectorAll('[data-translate]');
              elements.forEach(el => {
                const currentText = el.textContent;
                const translatedText = el.getAttribute('data-translate');
                if (translatedText) {
                  el.textContent = translatedText;
                  el.setAttribute('data-translate', currentText || '');
                }
              });
            }}
          >
            IT/EN
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={styles.languageToggle}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.languageToggle}>
      <div id="google_translate_element"></div>
    </div>
  );
}
