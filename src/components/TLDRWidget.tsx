'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import styles from './TLDRWidget.module.css';

interface TLDRData {
  success: boolean;
  tldr: string;
  source: string;
  timestamp: string;
  scraped: boolean;
  error?: string;
}

export default function TLDRWidget() {
  const [tldrData, setTldrData] = useState<TLDRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTLDR = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tldr-scraper');
        
        if (!response.ok) {
          throw new Error('Failed to fetch TLDR data');
        }
        
        const data = await response.json();
        setTldrData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch TLDR');
        setTldrData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTLDR();
    
    // Refresh every 30 minutes
    const interval = setInterval(fetchTLDR, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <Card className={styles.tldrCard}>
        <CardHeader>
          <CardTitle className={styles.title}>TLDR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.loadingContainer}>
            <p className={styles.loadingText}>Loading market analysis...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !tldrData?.success) {
    return (
      <Card className={styles.tldrCard}>
        <CardHeader>
          <CardTitle className={styles.title}>TLDR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>
              {error || tldrData?.error || 'Failed to load market analysis'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={styles.tldrCard}>
      <CardHeader>
        <CardTitle className={styles.title}>TLDR</CardTitle>
        <div className={styles.sourceInfo}>
          <span className={styles.source}>Source: {tldrData.source}</span>
          <span className={styles.timestamp}>
            Updated: {formatTimestamp(tldrData.timestamp)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className={styles.contentContainer}>
          <p className={styles.tldrText}>{tldrData.tldr}</p>
          {tldrData.scraped && (
            <div className={styles.scrapedIndicator}>
              <span className={styles.scrapedBadge}>Live Data</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
