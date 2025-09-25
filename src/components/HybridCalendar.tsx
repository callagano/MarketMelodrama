'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import styles from './HybridCalendar.module.css';

interface IPOEvent {
  id: number;
  company: string;
  symbol: string;
  date: string;
  priceRange: string;
  sharesOffered: string;
  totalValue: string;
  exchange: string;
  underwriters: string;
}

export default function HybridCalendar() {
  const [activeTab, setActiveTab] = useState<'economic' | 'ipo'>('economic');
  const [ipoData, setIpoData] = useState<IPOEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // TradingView Economic Calendar Widget
  useEffect(() => {
    if (activeTab === 'economic' && containerRef.current) {
      // Clear previous widget
      const existingWidget = containerRef.current.querySelector('.tradingview-widget-container');
      if (existingWidget) {
        existingWidget.remove();
      }

      // Create new widget container
      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'tradingview-widget-container';
      containerRef.current.appendChild(widgetContainer);

      // Create script element
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "width": "100%",
        "height": "600",
        "colorTheme": "dark",
        "isTransparent": false,
        "locale": "en",
        "importanceFilter": "1",
        "countryFilter": "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu"
      });

      widgetContainer.appendChild(script);

      return () => {
        if (widgetContainer && widgetContainer.parentNode) {
          widgetContainer.parentNode.removeChild(widgetContainer);
        }
      };
    }
  }, [activeTab]);

  // Fetch IPO data
  const fetchIPOData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/ipo-calendar');
      
      if (!response.ok) {
        throw new Error('Failed to fetch IPO data');
      }
      
      const result = await response.json();
      if (result.success) {
        setIpoData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch IPO data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'ipo') {
      fetchIPOData();
    }
  }, [activeTab]);

  // Fetch IPO data when component first loads to show count immediately
  useEffect(() => {
    fetchIPOData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <Card className={styles.hybridCalendar}>
      <CardContent className={styles.cardContent}>
        <div className={styles.header}>
          <h2 className="title">Market calendar</h2>
          <p className="subtitle" data-i18n data-i18n-key="What's on the people's agenda?">What's on the <span className="people-highlight">people</span>'s agenda?</p>
        </div>
        <div className={styles.tabContainer}>
          <button
            className={`${styles.tabButton} ${activeTab === 'economic' ? styles.active : ''}`}
            onClick={() => setActiveTab('economic')}
            data-i18n
            data-i18n-key="Economic Events"
          >
            Economic Events
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'ipo' ? styles.active : ''}`}
            onClick={() => setActiveTab('ipo')}
            data-i18n
            data-i18n-key="Next IPOs"
          >
            Next IPOs
          </button>
        </div>

        <div className={styles.contentContainer}>
          {activeTab === 'economic' && (
            <div ref={containerRef} className={styles.tradingViewContainer}>
              {/* TradingView widget will be inserted here */}
            </div>
          )}

          {activeTab === 'ipo' && (
            <div className={styles.tableContainer}>
              {loading ? (
                <div className={styles.loadingContainer}>
                  <p className={styles.loadingText} data-i18n data-i18n-key="Loading IPO data...">Loading IPO data...</p>
                </div>
              ) : error ? (
                <div className={styles.errorContainer}>
                  <p className={styles.errorText} data-i18n data-i18n-key="Error">Error: {error}</p>
                </div>
              ) : (
                <>
                  <div className={styles.tableHeader}>
                    <div className={styles.dateHeader} data-i18n data-i18n-key="Date">Date</div>
                    <div className={styles.symbolHeader} data-i18n data-i18n-key="Symbol">Symbol</div>
                    <div className={styles.companyHeader} data-i18n data-i18n-key="Company">Company</div>
                    <div className={styles.exchangeHeader} data-i18n data-i18n-key="Exchange">Exchange</div>
                    <div className={styles.priceHeader} data-i18n data-i18n-key="Price Range">Price Range</div>
                    <div className={styles.sharesHeader} data-i18n data-i18n-key="Shares">Shares</div>
                  </div>
                  <div className={styles.tableBody}>
                    {ipoData.map((ipo) => (
                      <div key={ipo.id} className={styles.tableRow}>
                        <div className={styles.dateCell}>{formatDate(ipo.date)}</div>
                        <div className={styles.symbolCell}>{ipo.symbol}</div>
                        <div className={styles.companyCell}>{ipo.company}</div>
                        <div className={styles.exchangeCell}>{ipo.exchange}</div>
                        <div className={styles.priceCell}>{ipo.priceRange}</div>
                        <div className={styles.sharesCell}>{ipo.sharesOffered}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer removed as requested */}
      </CardContent>
    </Card>
  );
}
