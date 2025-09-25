'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './LanguageToggle.module.css';

type Lang = 'EN' | 'IT';

// Simple in-memory cache during session
const translationCache = new Map<string, string>();

function getElementsToTranslate(): Array<{ el: Element; key: string; original: string }>{
  const els = Array.from(document.querySelectorAll('[data-i18n]'));
  return els.map((el) => {
    const key = (el.getAttribute('data-i18n-key') || (el as HTMLElement).innerText || '').trim();
    const original = (el as HTMLElement).innerText;
    return { el, key, original };
  }).filter(block => block.original && block.original.length > 0); // Filter out empty elements
}

async function translateBatch(texts: string[], targetLang: Lang, sourceLang?: Lang): Promise<string[]> {
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, targetLang, sourceLang })
  });
  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || 'Translate failed');
  }
  return json.translations as string[];
}

export default function LanguageToggle() {
  const [lang, setLang] = useState<Lang>('EN');
  const [busy, setBusy] = useState(false);

  const nextLang: Lang = useMemo(() => (lang === 'EN' ? 'IT' : 'EN'), [lang]);

  useEffect(() => {
    // Initialize current language from html[lang]
    const htmlLang = (document.documentElement.lang || 'en').toUpperCase();
    if (htmlLang === 'IT') setLang('IT');
  }, []);

  const handleToggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Wait a bit for any dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const blocks = getElementsToTranslate();
      if (blocks.length === 0) {
        document.documentElement.lang = nextLang.toLowerCase();
        setLang(nextLang);
        return;
      }

      // Build list, using cache when available
      const toFetch: string[] = [];
      const indices: number[] = [];
      const originalTexts = blocks.map((b) => b.original);

      originalTexts.forEach((t, i) => {
        const cacheKey = `${nextLang}:${t}`;
        if (!translationCache.has(cacheKey)) {
          toFetch.push(t);
          indices.push(i);
        }
      });

      let fetchedTranslations: string[] = [];
      if (toFetch.length > 0) {
        fetchedTranslations = await translateBatch(toFetch, nextLang, lang);
        fetchedTranslations.forEach((translated, j) => {
          const i = indices[j];
          const original = originalTexts[i];
          translationCache.set(`${nextLang}:${original}`, translated);
        });
      }

      // Apply translations
      blocks.forEach((b) => {
        const translated = translationCache.get(`${nextLang}:${b.original}`);
        const target = translated || b.original;
        
        // Check if the element uses dangerouslySetInnerHTML (like TLDR highlights)
        if (b.el.hasAttribute('data-i18n-key') && b.el.getAttribute('data-i18n-key') === b.original) {
          // For elements with data-i18n-key, update the key attribute and innerHTML
          b.el.setAttribute('data-i18n-key', target);
          (b.el as HTMLElement).innerHTML = (b.el as HTMLElement).innerHTML.replace(b.original, target);
        } else {
          // For regular text elements
          (b.el as HTMLElement).innerText = target;
        }
      });

      // Handle dynamic texts that change based on state
      const dynamicElements = document.querySelectorAll('[data-i18n-key="Read More"], [data-i18n-key="Read Less"]');
      const dynamicTexts = ['Read More', 'Read Less'];
      const dynamicToFetch = dynamicTexts.filter(t => !translationCache.has(`${nextLang}:${t}`));
      
      if (dynamicToFetch.length > 0) {
        const dynamicTranslations = await translateBatch(dynamicToFetch, nextLang, lang);
        dynamicToFetch.forEach((text, i) => {
          translationCache.set(`${nextLang}:${text}`, dynamicTranslations[i]);
        });
      }
      
      dynamicElements.forEach((el) => {
        const key = el.getAttribute('data-i18n-key');
        if (key) {
          const translated = translationCache.get(`${nextLang}:${key}`);
          if (translated) {
            (el as HTMLElement).innerText = translated;
          }
        }
      });

      // Update document language
      document.documentElement.lang = nextLang.toLowerCase();
      setLang(nextLang);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      className={`${styles.toggle} ${busy ? styles.busy : ''}`}
      onClick={handleToggle}
      aria-label={`Switch to ${nextLang}`}
      disabled={busy}
    >
      {busy ? '…' : nextLang}
    </button>
  );
}


