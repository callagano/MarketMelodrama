'use client';

import { useEffect, useRef, memo } from 'react';
import styles from './EconomicCalendar.module.css';

function EconomicCalendar() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "colorTheme": "dark",
        "isTransparent": true,
        "locale": "en",
        "countryFilter": "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu",
        "importanceFilter": "0,1",
        "width": "100%",
        "height": "100%"
      }`;
    container.current.appendChild(script);

    return () => {
      if (container.current && container.current.contains(script)) {
        container.current.removeChild(script);
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Events affecting behaviours</h2>
        <p className={styles.subtitle}>The most important economic events that may affect people's behaviour</p>
      </div>
      
      <div className={styles.widgetContainer}>
        <div className="tradingview-widget-container" ref={container} style={{ height: '500px' }}>
          <div className="tradingview-widget-container__widget" style={{ height: '100%' }}></div>
        </div>
      </div>
    </div>
  );
}

export default memo(EconomicCalendar); 