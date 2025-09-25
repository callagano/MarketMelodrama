'use client';

import { useState, useEffect } from 'react';
import styles from './LastUpdated.module.css';

interface LastUpdatedProps {
  timestamp?: string | number;
  className?: string;
  showRelative?: boolean;
  prefix?: string;
  showNextUpdate?: boolean;
  useCronTime?: boolean; // if true, prefer cron schedule time over live fetch time
  weekdaysOnly?: boolean; // skip weekends when computing cron time (e.g., Fear & Greed)
}

export default function LastUpdated({ 
  timestamp, 
  className = '', 
  showRelative = true,
  prefix = 'Updated',
  showNextUpdate = false,
  useCronTime = true,
  weekdaysOnly = false
}: LastUpdatedProps) {
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const computeLastCronTime = (): Date => {
      const now = new Date();
      const last = new Date(now);
      // set to 04:00:00 UTC of today
      last.setUTCHours(4, 0, 0, 0);
      // if current time is before 04:00 UTC, go to previous day
      if (now.getUTCHours() < 4 || (now.getUTCHours() === 4 && (now.getUTCMinutes() === 0 ? now.getUTCSeconds() < 0 : false))) {
        last.setUTCDate(last.getUTCDate() - 1);
      }
      if (weekdaysOnly) {
        // If weekend, roll back to last Friday 04:00 UTC
        let day = last.getUTCDay(); // 0 Sun, 6 Sat
        if (day === 0) { // Sunday -> go back 2 days to Friday
          last.setUTCDate(last.getUTCDate() - 2);
        } else if (day === 6) { // Saturday -> go back 1 day to Friday
          last.setUTCDate(last.getUTCDate() - 1);
        }
      }
      return last;
    };

    const effectiveTime: Date | null = useCronTime
      ? computeLastCronTime()
      : (timestamp ? new Date(timestamp) : null);

    if (!effectiveTime || isNaN(effectiveTime.getTime())) {
      setTimeString('No data');
      return;
    }

    const updateTimeString = () => {
      const now = new Date();
      const updateTime = effectiveTime;
      
      if (isNaN(updateTime.getTime())) {
        setTimeString('Invalid date');
        return;
      }

      if (showRelative) {
        const diffMs = now.getTime() - updateTime.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) {
          setTimeString('Just now');
        } else if (diffMinutes < 60) {
          setTimeString(`${diffMinutes}m ago`);
        } else if (diffHours < 24) {
          setTimeString(`${diffHours}h ago`);
        } else if (diffDays < 7) {
          setTimeString(`${diffDays}d ago`);
        } else {
          // For older data, show the actual date
          setTimeString(updateTime.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }));
        }
      } else {
        setTimeString(updateTime.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }));
      }
    };

    updateTimeString();
    
    // Update every minute for relative time
    if (showRelative) {
      const interval = setInterval(updateTimeString, 60000);
      return () => clearInterval(interval);
    }
  }, [timestamp, showRelative, useCronTime, weekdaysOnly]);

  return (
    <div className={`${styles.lastUpdated} ${className}`}>
      <span className={styles.prefix}>{prefix}:</span>
      <span className={styles.time}>{timeString}</span>
    </div>
  );
}
