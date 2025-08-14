'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import styles from './EconomicCalendarAPI.module.css';

interface EconomicEvent {
  id: number;
  date: string;
  time: string;
  country: string;
  category: string;
  event: string;
  reference: number;
  source: string;
  actual: number;
  previous: number;
  forecast: number;
  currency: string;
  importance: number;
}

interface EarningsEvent {
  id: number;
  date: string;
  time: string;
  symbol: string;
  company: string;
  eps_estimate: string;
  eps_actual: string;
  revenue_estimate: string;
  revenue_actual: string;
  market_cap: string;
}

interface IPOEvent {
  id: number;
  date: string;
  company: string;
  symbol: string;
  price_range: string;
  shares_offered: string;
  total_value: string;
  exchange: string;
  underwriters: string;
}

interface CalendarData {
  economic: EconomicEvent[];
  earnings: EarningsEvent[];
  ipo: IPOEvent[];
}

export default function EconomicCalendarAPI() {
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'economic' | 'earnings' | 'ipo'>('economic');

  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        const response = await fetch('/api/economic-calendar?type=all&days=30');
        
        if (!response.ok) {
          throw new Error('Failed to fetch calendar data');
        }
        
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, []);

  const getCountryFlag = (country: string) => {
    const flagMap: { [key: string]: string } = {
      'US': '🇺🇸',
      'EU': '🇪🇺',
      'UK': '🇬🇧',
      'JP': '🇯🇵',
      'CN': '🇨🇳',
      'CA': '🇨🇦',
      'AU': '🇦🇺',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'IT': '🇮🇹',
      'ES': '🇪🇸',
      'RU': '🇷🇺',
      'BR': '🇧🇷',
      'IN': '🇮🇳',
      'KR': '🇰🇷',
      'MX': '🇲🇽',
      'SG': '🇸🇬',
      'HK': '🇭🇰',
      'CH': '🇨🇭',
      'SE': '🇸🇪'
    };
    return flagMap[country] || '🌍';
  };

  const formatTime = (time: string) => {
    return time;
  };

  const formatValue = (value: number | string) => {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return value;
  };

  if (loading) {
    return (
      <Card className={styles.economicCalendar}>
        <CardContent className={styles.cardContent}>
          <div className={styles.loadingContainer}>
            <p className={styles.loadingText}>Loading economic calendar...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={styles.economicCalendar}>
        <CardContent className={styles.cardContent}>
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={styles.economicCalendar}>
        <CardContent className={styles.cardContent}>
          <div className={styles.noDataContainer}>
            <p className={styles.noDataText}>No calendar data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={styles.economicCalendar}>
      <CardContent className={styles.cardContent}>
        <div className={styles.header}>
          <h2 className={styles.title}>Economic Calendar</h2>
          <p className={styles.subtitle}>
            Track earnings, IPOs, and economic events
          </p>
        </div>

        <div className={styles.tabContainer}>
          <button
            className={`${styles.tabButton} ${activeTab === 'economic' ? styles.active : ''}`}
            onClick={() => setActiveTab('economic')}
          >
            Economic Events ({data.economic.length})
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'earnings' ? styles.active : ''}`}
            onClick={() => setActiveTab('earnings')}
          >
            Earnings ({data.earnings.length})
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'ipo' ? styles.active : ''}`}
            onClick={() => setActiveTab('ipo')}
          >
            IPOs ({data.ipo.length})
          </button>
        </div>

        <div className={styles.contentContainer}>
          {activeTab === 'economic' && (
            <div className={styles.tableContainer}>
              <div className={styles.tableHeader}>
                <div className={styles.timeHeader}>Time</div>
                <div className={styles.countryHeader}>Country</div>
                <div className={styles.eventHeader}>Event</div>
                <div className={styles.actualHeader}>Actual</div>
                <div className={styles.forecastHeader}>Forecast</div>
                <div className={styles.priorHeader}>Prior</div>
              </div>
              <div className={styles.tableBody}>
                {data.economic.slice(0, 25).map((event) => (
                  <div key={event.id} className={styles.tableRow}>
                    <div className={styles.timeCell}>{formatTime(event.time)}</div>
                    <div className={styles.countryCell}>
                      <span className={styles.flag}>{getCountryFlag(event.country)}</span>
                    </div>
                    <div className={styles.eventCell}>
                      <span className={styles.eventName}>{event.event}</span>
                      <span className={styles.chartIcon}>📊</span>
                    </div>
                    <div className={styles.actualCell}>
                      {event.actual ? formatValue(event.actual) : '—'}
                    </div>
                    <div className={styles.forecastCell}>
                      {event.forecast ? formatValue(event.forecast) : '—'}
                    </div>
                    <div className={styles.priorCell}>
                      {event.previous ? formatValue(event.previous) : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className={styles.tableContainer}>
              <div className={styles.tableHeader}>
                <div className={styles.timeHeader}>Time</div>
                <div className={styles.symbolHeader}>Symbol</div>
                <div className={styles.companyHeader}>Company</div>
                <div className={styles.epsHeader}>EPS Est</div>
                <div className={styles.revenueHeader}>Revenue Est</div>
                <div className={styles.marketCapHeader}>Market Cap</div>
              </div>
              <div className={styles.tableBody}>
                {data.earnings.slice(0, 25).map((earnings) => (
                  <div key={earnings.id} className={styles.tableRow}>
                    <div className={styles.timeCell}>{formatTime(earnings.time)}</div>
                    <div className={styles.symbolCell}>{earnings.symbol}</div>
                    <div className={styles.companyCell}>{earnings.company}</div>
                    <div className={styles.epsCell}>{earnings.eps_estimate}</div>
                    <div className={styles.revenueCell}>{earnings.revenue_estimate}</div>
                    <div className={styles.marketCapCell}>{earnings.market_cap}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ipo' && (
            <div className={styles.tableContainer}>
              <div className={styles.tableHeader}>
                <div className={styles.dateHeader}>Date</div>
                <div className={styles.symbolHeader}>Symbol</div>
                <div className={styles.companyHeader}>Company</div>
                <div className={styles.priceHeader}>Price Range</div>
                <div className={styles.sharesHeader}>Shares</div>
                <div className={styles.valueHeader}>Value</div>
              </div>
              <div className={styles.tableBody}>
                {data.ipo.slice(0, 25).map((ipo) => (
                  <div key={ipo.id} className={styles.tableRow}>
                    <div className={styles.dateCell}>{ipo.date}</div>
                    <div className={styles.symbolCell}>{ipo.symbol}</div>
                    <div className={styles.companyCell}>{ipo.company}</div>
                    <div className={styles.priceCell}>{ipo.price_range}</div>
                    <div className={styles.sharesCell}>{ipo.shares_offered}</div>
                    <div className={styles.valueCell}>{ipo.total_value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <p className={styles.disclaimer}>
            Data provided by API. Economic events, earnings releases, and IPO information.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
