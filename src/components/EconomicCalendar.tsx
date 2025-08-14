'use client';

import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import styles from './EconomicCalendar.module.css';

interface EconomicCalendarProps {
  className?: string;
}

export default function EconomicCalendar({ className }: EconomicCalendarProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // MarketWatch Economic Calendar Widget
    const script = document.createElement('script');
    script.src = 'https://www.marketwatch.com/investing/calendar';
    script.async = true;
    script.setAttribute('data-width', '100%');
    script.setAttribute('data-height', '600');
    script.setAttribute('data-theme', 'dark');

    if (containerRef.current) {
      const widgetContainer = containerRef.current.querySelector('.marketwatch-widget-container');
      if (widgetContainer) {
        widgetContainer.appendChild(script);
      }
    }

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <Card className={`${styles.economicCalendar} ${className || ''}`}>
      <CardContent className={styles.cardContent}>
        <div className={styles.header}>
          <h2 className={styles.title}>Economic Calendar</h2>
          <p className={styles.subtitle}>
            Track earnings, IPOs, and economic events
          </p>
        </div>
        
        <div className={styles.calendarContainer} ref={containerRef}>
          <div className="marketwatch-widget-container">
            <iframe 
              src="https://www.marketwatch.com/investing/calendar"
              width="100%"
              height="600"
              frameBorder="0"
              allowFullScreen
              style={{ backgroundColor: 'transparent' }}
            />
          </div>
        </div>

        <div className={styles.footer}>
          <p className={styles.disclaimer}>
            Data provided by MarketWatch. Includes earnings releases, IPO dates, and economic indicators.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
