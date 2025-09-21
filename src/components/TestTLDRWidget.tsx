'use client';

import { useState, useEffect } from 'react';
import styles from './TLDRWidget.module.css';

interface TLDRUpdate {
  text: string;
  date: string;
  source: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TLDRData {
  today: TLDRUpdate | null;
  recent: TLDRUpdate[];
  total: number;
}

export default function TestTLDRWidget() {
  console.log('TestTLDRWidget component mounting...');
  const [tldrData, setTldrData] = useState<TLDRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('TestTLDRWidget useEffect running...');
    
    // Simulate API call
    setTimeout(() => {
      console.log('TestTLDRWidget: Simulating API response...');
      const mockData: TLDRData = {
        today: null,
        recent: [],
        total: 0
      };
      console.log('TestTLDRWidget: Setting tldrData to:', mockData);
      setTldrData(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    console.log('TestTLDRWidget: Rendering loading state');
    return (
      <div className={styles.widget}>
        <div className={styles.section}>
          <h2 className="title">The brief (TEST)</h2>
        </div>
        <div className={styles.content}>
          <div className={styles.loading}>Loading data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('TestTLDRWidget: Rendering error state');
    return (
      <div className={styles.widget}>
        <div className={styles.section}>
          <h2 className="title">The brief (TEST)</h2>
        </div>
        <div className={styles.content}>
          <div className={styles.error}>
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  // Render old format or no data
  console.log('TestTLDRWidget: Rendering old format or no data. tldrData:', tldrData);
  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h3>The Brief (TEST)</h3>
      </div>
      
      <div className={styles.content}>
        {tldrData?.today ? (
          <div className={styles.todayUpdate}>
            <p>{tldrData.today.text}</p>
            <div className={styles.meta}>
              <span className={styles.date}>
                {new Date(tldrData.today.date).toLocaleDateString()}
              </span>
            </div>
          </div>
        ) : (
          <div className={styles.noUpdate}>
            <p>No data available yet.</p>
            <p className={styles.hint}>
              Waiting for ActivePieces to send the latest market data...
            </p>
            <p className={styles.hint}>
              Data will appear here automatically when available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
