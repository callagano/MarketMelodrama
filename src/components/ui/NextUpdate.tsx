'use client';

import { useState, useEffect } from 'react';
import styles from './NextUpdate.module.css';

interface NextUpdateProps {
  className?: string;
  showTime?: boolean;
}

export default function NextUpdate({ 
  className = '', 
  showTime = true 
}: NextUpdateProps) {
  const [nextUpdate, setNextUpdate] = useState<string>('');

  useEffect(() => {
    const updateNextUpdate = () => {
      const now = new Date();
      const nextRun = new Date(now);
      
      // Set to next 4:00 AM UTC
      nextRun.setUTCHours(4, 0, 0, 0);
      if (now.getUTCHours() >= 4) {
        nextRun.setUTCDate(nextRun.getUTCDate() + 1);
      }
      
      // Check if it's weekend for Fear & Greed
      const dayOfWeek = nextRun.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      if (isWeekend) {
        // Skip to Monday for Fear & Greed
        const daysUntilMonday = (8 - dayOfWeek) % 7;
        nextRun.setUTCDate(nextRun.getUTCDate() + daysUntilMonday);
      }
      
      const diffMs = nextRun.getTime() - now.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffHours < 1) {
        setNextUpdate(`${diffMinutes}m`);
      } else if (diffHours < 24) {
        setNextUpdate(`${diffHours}h ${diffMinutes}m`);
      } else {
        const diffDays = Math.floor(diffHours / 24);
        setNextUpdate(`${diffDays}d ${diffHours % 24}h`);
      }
    };

    updateNextUpdate();
    
    // Update every minute
    const interval = setInterval(updateNextUpdate, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!showTime) return null;

  return (
    <div className={`${styles.nextUpdate} ${className}`}>
      <span className={styles.label}>Next update:</span>
      <span className={styles.time}>{nextUpdate}</span>
    </div>
  );
}
