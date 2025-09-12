'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import styles from './HybridCalendar.module.css';

interface EarningsEvent {
  id: number;
  symbol: string;
  name: string;
  reportDate: string;
  fiscalDateEnding: string;
  estimate: string;
  currency: string;
}

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
  const [activeTab, setActiveTab] = useState<'economic' | 'earnings' | 'ipo'>('economic');
  const [earningsData, setEarningsData] = useState<EarningsEvent[]>([]);
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

  // Fetch earnings data from Alpha Vantage
  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/earnings-calendar?horizon=1month');
      
      if (!response.ok) {
        throw new Error('Failed to fetch earnings data');
      }
      
      const result = await response.json();
      if (result.success) {
        setEarningsData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch earnings data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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
    if (activeTab === 'earnings') {
      fetchEarningsData();
    } else if (activeTab === 'ipo') {
      fetchIPOData();
    }
  }, [activeTab]);

  // Fetch all data when component first loads to show counts immediately
  useEffect(() => {
    fetchEarningsData();
    fetchIPOData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
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
          <h2 className="title">Market Calendar</h2>
          <p className="subtitle">Economic, earnings and IPO most important events</p>
        </div>
        <div className={styles.tabContainer}>
          <button
            className={`${styles.tabButton} ${activeTab === 'economic' ? styles.active : ''}`}
            onClick={() => setActiveTab('economic')}
          >
            Economic Events
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'earnings' ? styles.active : ''}`}
            onClick={() => setActiveTab('earnings')}
          >
            Earnings ({earningsData.length})
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'ipo' ? styles.active : ''}`}
            onClick={() => setActiveTab('ipo')}
          >
            IPOs ({ipoData.length})
          </button>
        </div>

        <div className={styles.contentContainer}>
          {activeTab === 'economic' && (
            <div ref={containerRef} className={styles.tradingViewContainer}>
              {/* TradingView widget will be inserted here */}
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className={styles.tableContainer}>
              {loading ? (
                <div className={styles.loadingContainer}>
                  <p className={styles.loadingText}>Loading earnings data...</p>
                </div>
              ) : error ? (
                <div className={styles.errorContainer}>
                  <p className={styles.errorText}>Error: {error}</p>
                </div>
              ) : (
                <>
                  <div className={styles.tableHeader}>
                    <div className={styles.dateHeader}>Date</div>
                    <div className={styles.symbolHeader}>Symbol</div>
                    <div className={styles.companyHeader}>Company</div>
                    <div className={styles.estimateHeader}>EPS Estimate</div>
                    <div className={styles.fiscalHeader}>Fiscal Period</div>
                  </div>
                  <div className={styles.tableBody}>
                    {earningsData.map((earnings) => (
                      <div key={earnings.id} className={styles.tableRow}>
                        <div className={styles.dateCell}>
                          {earnings.reportDate ? formatDate(earnings.reportDate) : '—'}
                        </div>
                        <div className={styles.symbolCell}>{earnings.symbol}</div>
                        <div className={styles.companyCell}>{earnings.name}</div>
                        <div className={styles.estimateCell}>
                          {earnings.estimate ? `$${earnings.estimate}` : '—'}
                        </div>
                        <div className={styles.fiscalCell}>
                          {earnings.fiscalDateEnding ? formatDate(earnings.fiscalDateEnding) : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'ipo' && (
            <div className={styles.tableContainer}>
              {loading ? (
                <div className={styles.loadingContainer}>
                  <p className={styles.loadingText}>Loading IPO data...</p>
                </div>
              ) : error ? (
                <div className={styles.errorContainer}>
                  <p className={styles.errorText}>Error: {error}</p>
                </div>
              ) : (
                <>
                  <div className={styles.tableHeader}>
                    <div className={styles.dateHeader}>Date</div>
                    <div className={styles.symbolHeader}>Symbol</div>
                    <div className={styles.companyHeader}>Company</div>
                    <div className={styles.exchangeHeader}>Exchange</div>
                    <div className={styles.priceHeader}>Price Range</div>
                    <div className={styles.sharesHeader}>Shares</div>
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
