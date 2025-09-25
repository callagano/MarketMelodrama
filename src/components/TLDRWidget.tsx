'use client';

import { useState, useEffect } from 'react';
import LastUpdated from './ui/LastUpdated';
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
  const [isBigPictureExpanded, setIsBigPictureExpanded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

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
                    // Process highlights array - each item should have text and highlights/highlightedword
                    const processedHighlights = Array.isArray(parsedData.highlights) 
                      ? parsedData.highlights.map((item: any) => {
                          if (typeof item === 'string') {
                            return { text: item, highlights: [] };
                          }
                          // Support both 'highlights' and 'highlightedword' fields
                          const highlightsField = item.highlights || item.highlightedword;
                          return {
                            text: item.text || '',
                            highlights: Array.isArray(highlightsField) ? highlightsField : []
                          };
                        })
                      : [];
                    
                    // Process big_picture array - each item should have text and highlights/highlightedword
                    const processedBigPicture = Array.isArray(parsedData.big_picture)
                      ? parsedData.big_picture.map((item: any) => {
                          if (typeof item === 'string') {
                            return { text: item, highlights: [] };
                          }
                          // Support both 'highlights' and 'highlightedword' fields
                          const highlightsField = item.highlights || item.highlightedword;
                          return {
                            text: item.text || '',
                            highlights: Array.isArray(highlightsField) ? highlightsField : []
                          };
                        })
                      : [];
                    
                    const processedData: ActivePiecesData = {
                      title: parsedData.title,
                      sentiment: parsedData.sentiment,
                      highlights: processedHighlights,
                      big_picture: processedBigPicture
                    };
                    
                    setActivePiecesData(processedData);
                    setTldrData(null);
                    setError(null);
                    setLastUpdated(data.timestamp || new Date().toISOString());
                    setLoading(false);
                    return;
                  }
                } catch (parseError) {
                  console.error('Error parsing ActivePieces data:', parseError);
                  // If parsing fails, fall back to old format
                }
              }
              // ActivePieces format (old)
              setTldrData(data.body);
              setActivePiecesData(null);
              setError(null);
              setLastUpdated(data.timestamp || new Date().toISOString());
            } else {
              // Standard API format
              setTldrData(data);
              setActivePiecesData(null);
              setError(null);
              setLastUpdated(data.timestamp || new Date().toISOString());
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
    const highlights = item.highlights && Array.isArray(item.highlights) ? item.highlights : [];
    
    if (highlights.length > 0) {
      // Sort highlights by word length (longest first) to avoid partial replacements
      const sortedHighlights = highlights.sort((a, b) => b.word.length - a.word.length);
      
      sortedHighlights.forEach(highlight => {
        const word = highlight.word;
        const direction = highlight.direction || 'neutral';
        
        // Add appropriate arrow based on direction
        let arrow = '';
        if (direction === 'up') {
          arrow = '▲';
        } else if (direction === 'down') {
          arrow = '▼';
        }
        
        // Special handling for "Volatility" and "Oil" - invert colors
        let colorClass = direction;
        if (word.toLowerCase() === 'volatility' || word.toLowerCase() === 'oil') {
          // For Volatility and Oil: down = green, up = red (inverted logic)
          colorClass = direction === 'down' ? 'up' : 'down';
        }
        
        // Create pattern to match the word in the text
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b(${escapedWord})\\b`, 'gi');
        
        // Replace with highlighted word that includes the appropriate arrow
        text = text.replace(regex, `<span class="${styles.highlight} ${styles[colorClass]}">${arrow}${arrow ? ' ' : ''}$1</span>`);
      });
    }
    
    // For Big Picture, add line breaks after periods and improve readability
    if (isBigPicture) {
      // Split text into sentences and add line breaks
      text = text
        .replace(/\.\s+/g, '.<br><br>') // Add double line break after periods
        .replace(/\n\n+/g, '<br><br>') // Handle existing double line breaks
        .replace(/<br><br><br>/g, '<br><br>'); // Remove triple line breaks
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
        <div className={styles.content}>
          <div className={styles.section}>
            <h2 className="title">Breakfast brief</h2>
            <p className="subtitle">What affected <span className="people-highlight">people</span> most in the last 24 hours?</p>
          </div>
          
          {/* Skeleton for main content box */}
          <div className={styles.section}>
            <div className={styles.mainContentBox}>
              <div className={styles.pulseIcon}>
                <div className={styles.skeletonPulseIcon}></div>
              </div>
              <div className={styles.titleContainer}>
                <div className={styles.skeletonTitleText}></div>
                <div className={styles.skeletonSentimentScore}></div>
              </div>
            </div>
          </div>

          {/* Skeleton for highlights section */}
          <div className={styles.section}>
            <div className={`${styles.sectionContent} ${styles.masonry}`}>
              <div className={styles.sectionItem}>
                <div className={styles.skeletonHighlightItem}></div>
              </div>
              <div className={styles.sectionItem}>
                <div className={styles.skeletonHighlightItem}></div>
              </div>
              <div className={styles.sectionItem}>
                <div className={styles.skeletonHighlightItem}></div>
              </div>
              <div className={styles.sectionItem}>
                <div className={styles.skeletonHighlightItem}></div>
              </div>
            </div>
          </div>

          {/* Skeleton for big picture section */}
          <div className={styles.section}>
            <div className={styles.sectionContent}>
              <h3 className={styles.bigPictureTitle}>Big Picture</h3>
              <div className={`${styles.sectionItem} ${styles.bigPictureItem}`}>
                <div className={styles.skeletonBigPictureText}></div>
                <div className={styles.skeletonBigPictureText}></div>
                <div className={styles.skeletonBigPictureText}></div>
                <div className={styles.skeletonBigPictureText}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.widget}>
        <div className={styles.section}>
          <h2 className="title">Breakfast brief</h2>
        </div>
        <div className={styles.content}>
          <div className={styles.error} data-i18n data-i18n-key="Error">
            Error: {error}
            <button onClick={() => window.location.reload()} className={styles.retryButton} data-i18n data-i18n-key="Retry">
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
            <div className={styles.titleRow}>
              <h2 className="title">Breakfast brief</h2>
              <LastUpdated timestamp={lastUpdated || undefined} className={styles.lastUpdated} weekdaysOnly useCronTime />
            </div>
            <p className="subtitle" data-i18n data-i18n-key="What affected people most in the last 24 hours?">What affected <span className="people-highlight">people</span> most in the last 24 hours?</p>
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
                <div className={styles.sentimentScore} data-i18n data-i18n-key="Sentiment score">
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
                : <div className={styles.sectionItem} data-i18n data-i18n-key="Next data update at 6:00 AM GMT+2">Next data update at 6:00 AM GMT+2</div>
              }
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionContent}>
              <h3 className={styles.bigPictureTitle}>Big Picture</h3>
              <div className={styles.bigPictureContainer}>
                <div className={`${styles.bigPictureContent} ${!isBigPictureExpanded ? styles.collapsed : ''}`}>
                  {activePiecesData.big_picture && Array.isArray(activePiecesData.big_picture)
                    ? activePiecesData.big_picture.map((item, index) => (
                        <div key={index} className={`${styles.sectionItem} ${styles.bigPictureItem}`}>
                          {renderHighlightedText(item, true)}
                        </div>
                      ))
                    : <div className={styles.sectionItem} data-i18n data-i18n-key="No big picture data available">No big picture data available</div>
                  }
                </div>
                <button 
                  className={styles.readMoreButton}
                  onClick={() => setIsBigPictureExpanded(!isBigPictureExpanded)}
                  data-i18n
                  data-i18n-key={isBigPictureExpanded ? 'Read Less' : 'Read More'}
                >
                  {isBigPictureExpanded ? 'Read Less' : 'Read More'}
                </button>
              </div>
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
          <h2 className="title">Breakfast brief</h2>
          <p className="subtitle" data-i18n data-i18n-key="What happened in the last 24 hours and how people reacted.">What happened in the last 24 hours and how <span className="people-highlight">people</span> reacted.</p>
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
                 isWeekend ? "Next market update on Monday at 6:00 AM GMT+2" : "Waiting for data..."}
              </div>
            </div>
          </div>
        </div>

        

        
      </div>
    </div>
  );
}