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

export default function SimpleTLDRWidget() {
  const [tldrData, setTldrData] = useState<TLDRData | null>(null);
  const [activePiecesData, setActivePiecesData] = useState<ActivePiecesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Try ActivePieces endpoint first
        let response = await fetch('/api/activepieces/tldr');
        
        if (!response.ok) {
          // Fallback to main API if ActivePieces endpoint fails
          response = await fetch('/api/tldr-update');
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch TLDR data');
        }
        
        const data = await response.json();
        
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

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
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
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
    // Simple text rendering without complex parsing
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
                : <div className={styles.sectionItem}>No highlights available</div>
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

  // Render old format or no data
  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h3>The Brief</h3>
      </div>
      
      <div className={styles.content}>
        {tldrData?.today ? (
          <div className={styles.todayUpdate}>
            {renderTLDRContent(tldrData.today.text)}
            <div className={styles.meta}>
              <span className={styles.date}>
                {formatDate(tldrData.today.date)}
              </span>
              {tldrData.today.updatedAt && (
                <span className={styles.updated}>
                  Updated: {new Date(tldrData.today.updatedAt).toLocaleTimeString()}
                </span>
              )}
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

      {tldrData?.recent && tldrData.recent.length > 1 && (
        <div className={styles.recentUpdates}>
          <h4>Recent Updates</h4>
          <div className={styles.recentList}>
            {tldrData.recent.slice(1).map((update, index) => (
              <div key={index} className={styles.recentItem}>
                <p className={styles.recentText}>{update.text}</p>
                <span className={styles.recentDate}>{formatDate(update.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
