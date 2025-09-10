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

export default function TLDRWidget() {
  const [tldrData, setTldrData] = useState<TLDRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTLDRData();
  }, []);

  const fetchTLDRData = async () => {
    try {
      setLoading(true);
      // Try ActivePieces endpoint first, then fallback to main API
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
        // ActivePieces format
        setTldrData(data.body);
      } else {
        // Standard API format
        setTldrData(data);
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const parseTLDRText = (text: string) => {
    // Split by double line breaks to get sections
    const sections = text.split('\n\n').filter(section => section.trim());
    
    return sections.map((section, index) => {
      const trimmedSection = section.trim();
      
      // Check if it's a title (starts with ###)
      if (trimmedSection.startsWith('###')) {
        const title = trimmedSection.replace(/^###\s*\*\*(.*?)\*\*/, '$1');
        return {
          type: 'title',
          content: title,
          key: `title-${index}`
        };
      }
      
      // Check if it's a separator (---)
      if (trimmedSection === '---') {
        return {
          type: 'separator',
          content: '',
          key: `separator-${index}`
        };
      }
      
      // Regular paragraph
      return {
        type: 'paragraph',
        content: trimmedSection,
        key: `paragraph-${index}`
      };
    });
  };

  const renderTLDRContent = (text: string) => {
    const parsedSections = parseTLDRText(text);
    
    return (
      <div className={styles.parsedContent}>
        {parsedSections.map((section) => {
          switch (section.type) {
            case 'title':
              return (
                <h4 key={section.key} className={styles.sectionTitle}>
                  {section.content}
                </h4>
              );
            case 'separator':
              return (
                <hr key={section.key} className={styles.sectionSeparator} />
              );
            case 'paragraph':
              return (
                <p key={section.key} className={styles.sectionParagraph}>
                  {section.content.split('**').map((part, index) => 
                    index % 2 === 1 ? (
                      <strong key={index}>{part}</strong>
                    ) : (
                      part
                    )
                  )}
                </p>
              );
            default:
              return null;
          }
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.widget}>
        <div className={styles.header}>
          <h3>Today's Market TLDR</h3>
        </div>
        <div className={styles.content}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.widget}>
        <div className={styles.header}>
          <h3>Today's Market TLDR</h3>
        </div>
        <div className={styles.content}>
          <div className={styles.error}>
            Error: {error}
            <button onClick={fetchTLDRData} className={styles.retryButton}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h3>Today's Market TLDR</h3>
        <span className={styles.source}>via Activepieces</span>
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
            <p>No TLDR update available for today yet.</p>
            <p className={styles.hint}>
              Your Activepieces workflow will send updates here automatically.
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
                <span className={styles.recentDate}>
                  {formatDate(update.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
