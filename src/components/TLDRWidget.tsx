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

interface Highlight {
  word: string;
  direction: 'up' | 'down';
}

interface TLDRItem {
  text: string;
  highlights: Highlight[];
}

interface ActivePiecesData {
  title: string;
  sentiment: number;
  highlights: TLDRItem[];
  big_picture: TLDRItem[];
}

export default function TLDRWidget() {
  const [tldrData, setTldrData] = useState<TLDRData | null>(null);
  const [activePiecesData, setActivePiecesData] = useState<ActivePiecesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if it's weekend (Saturday = 6, Sunday = 0)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Use a simple approach that works
    const fetchData = () => {
      // Try ActivePieces endpoint first (only on weekdays)
      if (!isWeekend) {
        fetch('/api/activepieces/tldr')
          .then(response => {
            if (!response.ok) {
              // Fallback to main API if ActivePieces endpoint fails
              return fetch('/api/tldr-update');
            }
            return response;
          })
          .then(response => {
            if (!response.ok) {
              throw new Error('Failed to fetch TLDR data');
            }
            return response.json();
          })
          .then(data => {
            // Handle different response formats
            if (data.body) {
              // Check if we have the new ActivePieces JSON format
              if (data.body.today && typeof data.body.today.text === 'string') {
                try {
                  const parsedData = JSON.parse(data.body.today.text);
                  if (parsedData.title && parsedData.sentiment && parsedData.highlights && parsedData.big_picture) {
                    // Convert string arrays to TLDRItem format
                    const processedData: ActivePiecesData = {
                      title: parsedData.title,
                      sentiment: parsedData.sentiment,
                      highlights: Array.isArray(parsedData.highlights) 
                        ? parsedData.highlights.map((item: any) => 
                            typeof item === 'string' 
                              ? { text: item, highlights: [] }
                              : item
                          )
                        : [],
                      big_picture: Array.isArray(parsedData.big_picture)
                        ? parsedData.big_picture.map((item: any) => 
                            typeof item === 'string'
                              ? { text: item, highlights: [] }
                              : item
                          )
                        : []
                    };
                    
                    setActivePiecesData(processedData);
                    setTldrData(null);
                    setError(null);
                    setLoading(false);
                    return;
                  }
                } catch (parseError) {
                  // If parsing fails, fall back to old format
                }
              }
              // ActivePieces format (old)
              setTldrData(data.body);
              setActivePiecesData(null);
              setError(null);
            } else {
              // Standard API format
              setTldrData(data);
              setActivePiecesData(null);
              setError(null);
            }
            setLoading(false);
          })
          .catch(err => {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setLoading(false);
          });
      } else {
        // Weekend - no data fetching
        setTldrData(null);
        setActivePiecesData(null);
        setError(null);
        setLoading(false);
      }
    };

    // Execute immediately
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderHighlightedText = (item: TLDRItem, isBigPicture = false) => {
    if (!item || !item.text) {
      return <span>No content available</span>;
    }
    
    let text = item.text;
    const allWords = item.highlights && Array.isArray(item.highlights)
      ? [...new Set(item.highlights.map(h => h.word))]
      : [];
    
    if (allWords.length > 0) {
      allWords.forEach(word => {
        const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        text = text.replace(regex, `<span class="${styles.highlight}">${word}</span>`);
      });
    }
    
    return (
      <div 
        className={isBigPicture ? styles.bigPictureText : styles.highlightText}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  };

  const renderTLDRContent = (text: string) => {
    return (
      <div className={styles.tldrContent}>
        <p>{text}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.widget}>
        <div className={styles.section}>
          <h2 className="title">The brief</h2>
        </div>
        <div className={styles.content}>
          <div className={styles.loading}>Loading data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.widget}>
        <div className={styles.section}>
          <h2 className="title">The brief</h2>
        </div>
        <div className={styles.content}>
          <div className={styles.error}>
            Error: {error}
            <button onClick={() => window.location.reload()} className={styles.retryButton}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render ActivePieces data format
  if (activePiecesData) {
    return (
      <div className={styles.widget}>
        <div className={styles.content}>
          <div className={styles.section}>
            <h2 className="title">The brief</h2>
            <p className="subtitle">A daily snapshot of the markets.</p>
            <div className={`${styles.mainContentBox} ${
              activePiecesData.sentiment >= 70 ? styles.positive :
              activePiecesData.sentiment <= 30 ? styles.negative : styles.neutral
            }`}>
              <div className={styles.pulseIcon}>
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className={styles.pulseSvg}
                >
                  <circle 
                    cx="12" 
                    cy="12" 
                    r="4" 
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className={styles.titleContainer}>
                <div className={styles.titleText}>
                  {activePiecesData.title}
                </div>
                <div className={styles.sentimentScore}>
                  Sentiment score: {activePiecesData.sentiment}/100
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={`${styles.sectionContent} ${styles.masonry}`}>
              {activePiecesData.highlights && Array.isArray(activePiecesData.highlights)
                ? activePiecesData.highlights.map((item, index) => (
                    <div key={index} className={styles.sectionItem}>
                      {renderHighlightedText(item)}
                    </div>
                  ))
                : <div className={styles.sectionItem}>Next data update at 8:00 AM GMT+1</div>
              }
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionContent}>
              <h3 className={styles.bigPictureTitle}>Big Picture</h3>
              {activePiecesData.big_picture && Array.isArray(activePiecesData.big_picture)
                ? activePiecesData.big_picture.map((item, index) => (
                    <div key={index} className={`${styles.sectionItem} ${styles.bigPictureItem}`}>
                      {renderHighlightedText(item, true)}
                    </div>
                  ))
                : <div className={styles.sectionItem}>No big picture data available</div>
              }
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if it's weekend for messaging
  const today = new Date();
  const dayOfWeek = today.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dayName = isWeekend ? (dayOfWeek === 0 ? 'Sunday' : 'Saturday') : '';

  // Render with modern style even when no data
  return (
    <div className={styles.widget}>
      <div className={styles.content}>
        <div className={styles.section}>
          <h2 className="title">The brief</h2>
          <p className="subtitle">A daily snapshot of the markets.</p>
          <div className={`${styles.mainContentBox} ${styles.neutral}`}>
            <div className={styles.pulseIcon}>
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className={styles.pulseSvg}
              >
                <circle 
                  cx="12" 
                  cy="12" 
                  r="4" 
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className={styles.titleContainer}>
              <div className={styles.titleText}>
                {tldrData?.today ? tldrData.today.text : 
                 isWeekend ? `Markets are closed on ${dayName}` : "No data available yet"}
              </div>
              <div className={styles.sentimentScore}>
                {tldrData?.today ? `Updated: ${formatDate(tldrData.today.date)}` : 
                 isWeekend ? "Next market update on Monday at 8:00 AM GMT+1" : "Waiting for data..."}
              </div>
            </div>
          </div>
        </div>

        

        
      </div>
    </div>
  );
}