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
    // Fetch data on component mount
    fetchTLDRData();
    
    // Set up periodic refresh every 5 minutes to check for new data
    const refreshInterval = setInterval(() => {
      console.log('Checking for new TLDR data...');
      fetchTLDRData();
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, []);


  const fetchTLDRData = async () => {
    try {
      setLoading(true);
      console.log('Fetching TLDR data...');
      
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
      console.log('API response received:', data);
      console.log('Data structure check:', {
        hasBody: !!data.body,
        hasToday: !!data.body?.today,
        todayType: typeof data.body?.today,
        totalUpdates: data.body?.total || 0
      });
      
      // Handle different response formats
      if (data.body) {
        // Check if we have the new ActivePieces JSON format
        if (data.body.today && typeof data.body.today.text === 'string') {
          try {
            const parsedData = JSON.parse(data.body.today.text);
            if (parsedData.title && parsedData.sentiment && parsedData.highlights && parsedData.big_picture) {
              console.log('Successfully parsed ActivePieces data:', parsedData);
              
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
            console.log('Not ActivePieces JSON format, using old format');
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
    
    // Extract all unique words from highlights array (with safety check)
    const allWords = item.highlights && Array.isArray(item.highlights) 
      ? [...new Set(item.highlights.map(h => h.word))] 
      : [];
    
    // Create a map of words to their direction for quick lookup
    const wordDirectionMap = new Map();
    item.highlights.forEach(highlight => {
      wordDirectionMap.set(highlight.word.toLowerCase(), highlight.direction);
    });
    
    // Highlight all words that appear in the highlights array
    allWords.forEach(word => {
      const direction = wordDirectionMap.get(word.toLowerCase()) || 'neutral';
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // First try to match the word with common symbols (▲, ▼, etc.)
      const symbolPatterns = [
        `[▲▼↑↓]\\s*${escapedWord}`,  // Word with symbols before it
        `${escapedWord}\\s*[▲▼↑↓]`,  // Word with symbols after it
        `\\b${escapedWord}\\b`       // Word with word boundaries
      ];
      
      let found = false;
      symbolPatterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'gi');
        if (regex.test(text)) {
          const replacement = `<span class="${styles.highlight} ${styles[direction]}">${word}</span>`;
          text = text.replace(regex, replacement);
          found = true;
        }
      });
      
      // If no symbol pattern matched, try simple word matching
      if (!found) {
        const regex = new RegExp(escapedWord, 'gi');
        const replacement = `<span class="${styles.highlight} ${styles[direction]}">${word}</span>`;
        text = text.replace(regex, replacement);
      }
    });
    
    // For Big Picture section, split into paragraphs after each period
    if (isBigPicture) {
      // Split text into sentences and wrap each in a paragraph
      const sentences = text.split(/\.\s+/).filter(sentence => sentence.trim());
      const paragraphs = sentences.map((sentence, index) => {
        const trimmedSentence = sentence.trim();
        // Add period back if it's not the last sentence and doesn't end with punctuation
        const finalSentence = index < sentences.length - 1 && !trimmedSentence.match(/[.!?]$/) 
          ? trimmedSentence + '.' 
          : trimmedSentence;
        return `<p class="${styles.bigPictureParagraph}">${finalSentence}</p>`;
      });
      return <div dangerouslySetInnerHTML={{ __html: paragraphs.join('') }} />;
    } else {
      // For highlights section, add extra spacing after periods
      text = text.replace(/\.\s+/g, '.&nbsp;&nbsp;');
      return <span dangerouslySetInnerHTML={{ __html: text }} />;
    }
  };

  const parseTLDRText = (text: string) => {
    // Check if it's HTML content
    if (text.includes('<div') || text.includes('<h2') || text.includes('<p>')) {
      return parseHTMLContent(text);
    }
    
    // Original markdown parsing for backward compatibility
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

  const parseHTMLContent = (htmlText: string) => {
    const sections: Array<{type: string, content: string, key: string}> = [];
    let index = 0;
    
    // Split by HTML tags and process each section
    const htmlSections = htmlText.split(/(<h2[^>]*>.*?<\/h2>|<p[^>]*>.*?<\/p>|<ul[^>]*>.*?<\/ul>|<li[^>]*>.*?<\/li>)/g);
    
    htmlSections.forEach((section) => {
      if (!section.trim()) return;
      
      const trimmedSection = section.trim();
      
      // Handle h2 titles
      if (trimmedSection.match(/<h2[^>]*class="section-title"[^>]*>(.*?)<\/h2>/)) {
        const titleMatch = trimmedSection.match(/<h2[^>]*class="section-title"[^>]*>(.*?)<\/h2>/);
        if (titleMatch) {
          sections.push({
            type: 'title',
            content: titleMatch[1].trim(),
            key: `title-${index++}`
          });
        }
      }
      // Handle paragraphs
      else if (trimmedSection.match(/<p[^>]*>(.*?)<\/p>/)) {
        const paragraphMatch = trimmedSection.match(/<p[^>]*>(.*?)<\/p>/);
        if (paragraphMatch) {
          sections.push({
            type: 'paragraph',
            content: paragraphMatch[1].trim(),
            key: `paragraph-${index++}`
          });
        }
      }
      // Handle unordered lists
      else if (trimmedSection.match(/<ul[^>]*>(.*?)<\/ul>/)) {
        const listMatch = trimmedSection.match(/<ul[^>]*>(.*?)<\/ul>/);
        if (listMatch) {
          sections.push({
            type: 'list',
            content: listMatch[1].trim(),
            key: `list-${index++}`
          });
        }
      }
      // Handle list items
      else if (trimmedSection.match(/<li[^>]*>(.*?)<\/li>/)) {
        const itemMatch = trimmedSection.match(/<li[^>]*>(.*?)<\/li>/);
        if (itemMatch) {
          sections.push({
            type: 'listItem',
            content: itemMatch[1].trim(),
            key: `listItem-${index++}`
          });
        }
      }
    });
    
    return sections;
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
                  {renderInlineHTML(section.content)}
                </p>
              );
            case 'list':
              return (
                <ul key={section.key} className={styles.sectionList}>
                  {section.content.split(/<li[^>]*>(.*?)<\/li>/g).filter(item => item.trim()).map((item, index) => (
                    <li key={index} className={styles.sectionListItem}>
                      {renderInlineHTML(item.trim())}
                    </li>
                  ))}
                </ul>
              );
            case 'listItem':
              return (
                <li key={section.key} className={styles.sectionListItem}>
                  {renderInlineHTML(section.content)}
                </li>
              );
            default:
              return null;
          }
        })}
      </div>
    );
  };

  const renderInlineHTML = (content: string) => {
    // Handle <strong> tags
    const parts = content.split(/(<strong>.*?<\/strong>)/g);
    
    return parts.map((part, index) => {
      if (part.match(/<strong>(.*?)<\/strong>/)) {
        const match = part.match(/<strong>(.*?)<\/strong>/);
        return match ? <strong key={index}>{match[1]}</strong> : part;
      }
      return part;
    });
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
            <button onClick={fetchTLDRData} className={styles.retryButton}>
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
          {/* Main Content Section */}
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

          {/* Highlights Section */}
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

          {/* Big Picture Section */}
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
  console.log('Rendering old format or no data. tldrData:', tldrData);
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
