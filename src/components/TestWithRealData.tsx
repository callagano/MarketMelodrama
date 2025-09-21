'use client';

import { useState, useEffect } from 'react';
import styles from './TLDRWidget.module.css';

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

export default function TestWithRealData() {
  const [activePiecesData, setActivePiecesData] = useState<ActivePiecesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with real ActivePieces data format
    setTimeout(() => {
      const mockData: ActivePiecesData = {
        title: "Mixed Market Close Amid Earnings Reports",
        sentiment: 60,
        highlights: [
          { 
            text: "▲ Tech stocks surged as companies beat earnings expectations.", 
            highlights: [{ word: "▲ Tech", direction: "up" }] 
          },
          { 
            text: "▼ Energy sector struggled due to falling oil prices.", 
            highlights: [{ word: "▼ Energy", direction: "down" }] 
          },
          { 
            text: "Investors showed caution ahead of next week's Fed meeting.", 
            highlights: [] 
          },
          { 
            text: "▲ Consumer confidence rose, boosting retail stocks today.", 
            highlights: [{ word: "▲ Consumer", direction: "up" }] 
          }
        ],
        big_picture: [
          { 
            text: "Today's mixed results reflect ongoing uncertainty in the market. While tech companies are performing well, the energy sector is facing headwinds from lower oil prices. This divergence highlights sector-specific challenges and opportunities. Investors remain cautious, especially with the Federal Reserve meeting on the horizon, which may affect interest rates and market liquidity.\n\nThe rise in consumer confidence is a positive sign, indicating that spending might increase, benefiting retail and related sectors. As these dynamics unfold, it's important for investors to stay informed and be prepared for potential volatility ahead. Diversifying your portfolio may help mitigate risks associated with sector fluctuations.", 
            highlights: [
              { word: "uncertainty", direction: "down" }, 
              { word: "opportunities", direction: "up" }, 
              { word: "volatility", direction: "down" } 
            ] 
          }
        ]
      };
      
      setActivePiecesData(mockData);
      setLoading(false);
    }, 2000);
  }, []);

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

  if (loading) {
    return (
      <div className={styles.widget}>
        <div className={styles.section}>
          <h2 className="title">The brief (TEST WITH REAL DATA)</h2>
        </div>
        <div className={styles.content}>
          <div className={styles.loading}>Loading test data...</div>
        </div>
      </div>
    );
  }

  if (!activePiecesData) {
    return (
      <div className={styles.widget}>
        <div className={styles.section}>
          <h2 className="title">The brief (TEST WITH REAL DATA)</h2>
        </div>
        <div className={styles.content}>
          <div className={styles.error}>No test data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.widget}>
      <div className={styles.content}>
        <div className={styles.section}>
          <h2 className="title">The brief (TEST WITH REAL DATA)</h2>
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
