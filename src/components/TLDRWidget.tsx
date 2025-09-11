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

// Mock ActivePieces data for styling development - using real format
const mockActivePiecesData: ActivePiecesData = {
  title: "Stocks Rally Amid Positive Economic Data",
  sentiment: 80,
  highlights: [
    { 
      text: "▲ S&P 500 rose 1.5% on strong earnings reports.", 
      highlights: [ 
        { word: "▲ S&P 500", direction: "up" } 
      ] 
    },
    { 
      text: "▲ Tech shares gained momentum with major players like ▲ Apple leading the way.", 
      highlights: [ 
        { word: "▲ Tech", direction: "up" }, 
        { word: "▲ Apple", direction: "up" } 
      ] 
    },
    { 
      text: "▼ Energy stocks fell as ▼ oil prices dropped 3%.", 
      highlights: [ 
        { word: "▼ Energy", direction: "down" }, 
        { word: "▼ oil", direction: "down" } 
      ] 
    },
    { 
      text: "Markets remained optimistic despite ▼ inflation concerns lingering.", 
      highlights: [ 
        { word: "▼ inflation", direction: "down" } 
      ] 
    }
  ],
  big_picture: [
    { 
      text: "Today's rally in the markets was mainly fueled by strong earnings reports from key companies, especially in the tech sector. Investors are showing renewed confidence as they react positively to these results, lifting major indices like the S&P 500. On the other hand, concerns about the energy sector remain, with oil prices declining significantly, which has negatively impacted energy stocks. \n\nLooking ahead, this mixed environment poses a unique challenge for investors. The positive earnings may indicate a robust economy, but sustained inflation could temper enthusiasm in the long run. Balancing these factors will be crucial for maintaining market momentum in the coming weeks.", 
      highlights: [ 
        { word: "strong earnings", direction: "up" },
        { word: "oil prices", direction: "down" },
        { word: "inflation", direction: "down" }
      ] 
    }
  ]
};

export default function TLDRWidget() {
  const [tldrData, setTldrData] = useState<TLDRData | null>(null);
  const [activePiecesData, setActivePiecesData] = useState<ActivePiecesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(true); // Toggle for mock data
  const [mockDataIndex, setMockDataIndex] = useState(0); // Index for different mock scenarios

  // Additional mock data scenarios for testing
  const mockDataScenarios: ActivePiecesData[] = [
    mockActivePiecesData, // Current real format
    {
      title: "Market Crash: Dow Plunges 800 Points",
      sentiment: 15,
      highlights: [
        { text: "▼ Dow Jones dropped 800 points in worst day", highlights: [{ word: "▼ Dow Jones", direction: "down" }] },
        { text: "▼ Tech sector led decline with 5% losses", highlights: [{ word: "▼ Tech", direction: "down" }] },
        { text: "▼ Oil prices crashed 8% on demand fears", highlights: [{ word: "▼ Oil", direction: "down" }] },
        { text: "Fear index spiked to extreme levels today", highlights: [{ word: "Fear index", direction: "up" }] }
      ],
      big_picture: [
        { 
          text: "Today's market crash represents a seismic shift in investor sentiment, with the Dow's 800-point drop marking the worst single-day performance since the 2020 pandemic selloff. The tech sector's 5% decline led the broader market lower, as investors fled growth stocks amid rising inflation concerns and tightening monetary policy expectations. The energy sector's 8% collapse reflects growing fears about global demand destruction, while the VIX fear index spiking to extreme levels indicates panic selling across all asset classes. This dramatic reversal suggests that the market's complacency has been shattered, and investors are now pricing in a much more challenging economic environment ahead.", 
          highlights: [
            { word: "▼ Dow Jones", direction: "down" },
            { word: "▼ Tech", direction: "down" },
            { word: "▼ Oil", direction: "down" },
            { word: "Fear index", direction: "up" }
          ] 
        }
      ]
    },
    {
      title: "Bull Market Continues: All-Time Highs",
      sentiment: 95,
      highlights: [
        { text: "▲ S&P 500 hits new all-time high today", highlights: [{ word: "▲ S&P 500", direction: "up" }] },
        { text: "▲ Tech stocks surge on AI optimism wave", highlights: [{ word: "▲ Tech", direction: "up" }] },
        { text: "▲ Bitcoin reaches $100,000 milestone", highlights: [{ word: "▲ Bitcoin", direction: "up" }] },
        { text: "Institutional buying drives record market volume", highlights: [{ word: "Institutional", direction: "up" }] }
      ],
      big_picture: [
        { 
          text: "The bull market shows no signs of slowing as the S&P 500 reached another all-time high, driven by unprecedented institutional buying and continued optimism around artificial intelligence technologies. Tech stocks led the charge with double-digit gains, as investors bet heavily on companies positioned to benefit from the AI revolution. Bitcoin's surge to $100,000 reflects growing mainstream adoption of digital assets, while record trading volumes indicate strong conviction among both retail and institutional investors. This sustained rally suggests that the market has fully embraced the new technological paradigm, with traditional valuation metrics taking a backseat to growth potential and innovation capabilities.", 
          highlights: [
            { word: "▲ S&P 500", direction: "up" },
            { word: "▲ Tech", direction: "up" },
            { word: "▲ Bitcoin", direction: "up" },
            { word: "Institutional", direction: "up" }
          ] 
        }
      ]
    }
  ];

  useEffect(() => {
    if (useMockData) {
      // Use mock data for styling development
      setActivePiecesData(mockDataScenarios[mockDataIndex]);
      setTldrData(null);
      setLoading(false);
      setError(null);
    } else {
      fetchTLDRData();
    }
  }, [useMockData, mockDataIndex]);

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
        // Check if we have the new ActivePieces JSON format
        if (data.body.today && typeof data.body.today.text === 'string') {
          try {
            const parsedData = JSON.parse(data.body.today.text);
            if (parsedData.title && parsedData.tldr && parsedData.insights && parsedData.big_picture) {
              setActivePiecesData(parsedData);
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
      } else {
        // Standard API format
        setTldrData(data);
      }
      setActivePiecesData(null);
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

  const renderHighlightedText = (item: TLDRItem) => {
    let text = item.text;
    
    // Extract all unique words from highlights array
    const allWords = [...new Set(item.highlights.map(h => h.word))];
    
    // Create a map of words to their direction for quick lookup
    const wordDirectionMap = new Map();
    item.highlights.forEach(highlight => {
      wordDirectionMap.set(highlight.word.toLowerCase(), highlight.direction);
    });
    
    // Highlight all words that appear in the highlights array
    allWords.forEach(word => {
      const direction = wordDirectionMap.get(word.toLowerCase()) || 'neutral';
      // Use a more flexible regex that doesn't require word boundaries for symbols
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedWord, 'gi');
      const replacement = `<span class="${styles.highlight} ${styles[direction]}">${word}</span>`;
      text = text.replace(regex, replacement);
    });
    
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
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
        <div className={styles.header}>
          <h3>Today's</h3>
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
          <h3>Today's</h3>
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
        <div className={styles.header}>
          <h3>Today's happening</h3>
          <div className={styles.devControls}>
            <button 
              onClick={() => setUseMockData(!useMockData)}
              className={styles.toggleButton}
            >
              {useMockData ? 'Use Real Data' : 'Use Mock Data'}
            </button>
            {useMockData && (
              <div className={styles.mockControls}>
                <button 
                  onClick={() => setMockDataIndex((prev) => (prev + 1) % mockDataScenarios.length)}
                  className={styles.scenarioButton}
                >
                  Next Scenario ({mockDataIndex + 1}/{mockDataScenarios.length})
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.content}>
          {/* Main Content Box */}
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

          {/* Highlights Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Highlights</h3>
            <div className={`${styles.sectionContent} ${styles.masonry}`}>
              {activePiecesData.highlights.map((item, index) => (
                <div key={index} className={styles.sectionItem}>
                  {renderHighlightedText(item)}
                </div>
              ))}
            </div>
          </div>

          {/* Big Picture Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Big Picture</h3>
            <div className={styles.sectionContent}>
              {activePiecesData.big_picture.map((item, index) => (
                <div key={index} className={styles.sectionItem}>
                  {renderHighlightedText(item)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render old format
  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h3>Today's happening</h3>
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
