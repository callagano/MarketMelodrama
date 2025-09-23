'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format as formatDate } from "date-fns";
import { useTimeframe } from '@/context/TimeframeContext';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './FearGreedCharts.module.css';

interface ChartData {
  date: string;
  Fear_Greed_Index: number;
}

interface Props {
  data: ChartData[];
}

// Mini Line Chart Component
function MiniLineChart({ data, color }: { data: ChartData[], color: string }) {
  if (!data || data.length === 0) return null;

  const width = 120;
  const height = 40;
  const padding = 0; // Remove all internal padding
  
  // Calculate min and max values for scaling
  const values = data.map(d => d["Fear_Greed_Index"]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // Avoid division by zero
  
  // Generate SVG path with no padding - ensure proper path generation
  const linePoints = data.map((d, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = ((max - d["Fear_Greed_Index"]) / range) * height;
    return `${x},${y}`;
  });
  
  const pathData = `M ${linePoints.join(' L')}`;
  
  // Generate area path for fill - use exact same line points
  const areaPoints = [
    `0,${height + 1}`, // Extend slightly beyond bottom to eliminate gap
    ...linePoints,
    `${width},${height + 1}` // Extend slightly beyond bottom to eliminate gap
  ];
  
  const areaData = `M ${areaPoints.join(' L')} Z`;

  // Add padding to viewBox to accommodate stroke width (only vertical)
  const strokePadding = 1; // Half of stroke width (1.5/2 = 0.75, rounded up to 1)
  const viewBoxWidth = width; // No horizontal padding
  const viewBoxHeight = height + (strokePadding * 2); // Only vertical padding

  return (
    <svg width="100%" height="100%" viewBox={`0 -${strokePadding} ${viewBoxWidth} ${viewBoxHeight}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {/* Area fill */}
      <path
        d={areaData}
        fill={`${color}20`}
        stroke="none"
      />
      {/* Line */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FearGreedCharts({ data }: Props) {
  const { timeframe, setTimeframe } = useTimeframe();
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const scrollPositionRef = useRef(0);

  // Block body scroll when modal is open
  useEffect(() => {
    if (isInfoOpen) {
      // Store the current scroll position
      scrollPositionRef.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.width = '100%';
      document.body.style.left = '0';
      document.body.style.right = '0';
    } else {
      // Restore body styles
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.left = '';
      document.body.style.right = '';
      // Restore scroll position after a small delay to ensure styles are applied
      setTimeout(() => {
        window.scrollTo(0, scrollPositionRef.current);
      }, 0);
    }

    // Cleanup on unmount
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.left = '';
      document.body.style.right = '';
    };
  }, [isInfoOpen]);

  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  // Filter data based on selected timeframe
  const getFilteredData = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case '1M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '6M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '3Y':
        startDate = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    }
    
    return data
      .filter(item => new Date(item.date) >= startDate)
      .map(item => {
        let dateFormat;
        switch (timeframe) {
          case '1M':
            dateFormat = "EEE d"; // "Mon 15"
            break;
          case '6M':
            dateFormat = "MMM yy"; // "Jan 24"
            break;
          case '3Y':
            dateFormat = "yyyy"; // "2024"
            break;
          default:
            dateFormat = "MMM yy"; // "Jan 24"
        }
        
                          return {
                    date: formatDate(new Date(item.date), dateFormat),
                    originalDate: item.date, // Keep original date for tickFormatter
                    "Fear_Greed_Index": item.Fear_Greed_Index,
                  };
      });
  };

  // Get the latest data point (most recent from all_fng_csv.csv)
  const filteredData = getFilteredData();
  const latestData = data[data.length - 1];
  
  // Get the most recent non-zero value (in case latest is 0 for weekends)
  const getLatestValidData = () => {
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].Fear_Greed_Index > 0) {
        return data[i];
      }
    }
    return latestData; // fallback to latest even if 0
  };
  
  const latestValidData = getLatestValidData();
  
  // Get data for mini chart - last 6 months with sampling every ~12 days
  const getLast6MonthsData = () => {
    // Get 6 months of data from the raw data
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    
    const sixMonthsData = data
      .filter(item => new Date(item.date) >= sixMonthsAgo)
      .map(item => ({
        date: formatDate(new Date(item.date), "MMM d"),
        Fear_Greed_Index: item.Fear_Greed_Index,
      }));
    
    // Sample every ~12 days (approximately 15 points over 6 months)
    const sampleInterval = Math.max(1, Math.floor(sixMonthsData.length / 15));
    return sixMonthsData.filter((_, index) => index % sampleInterval === 0);
  };

  // Helper to get the closest data point to a given date
  function getClosestIndex(targetDate: Date) {
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < data.length; i++) {
      const diff = Math.abs(new Date(data[i].date).getTime() - targetDate.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    return closestIdx;
  }

  // Get historical values
  const now = new Date(latestValidData.date);
  const weekAgoIdx = getClosestIndex(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7));
  const monthAgoIdx = getClosestIndex(new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()));
  const sixMonthsAgoIdx = getClosestIndex(new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()));
  const yearAgoIdx = getClosestIndex(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()));

  const historicals = [
    {
      label: '1 Month Ago',
      value: data[monthAgoIdx]?.Fear_Greed_Index,
      change: ((latestValidData.Fear_Greed_Index - data[monthAgoIdx]?.Fear_Greed_Index) / data[monthAgoIdx]?.Fear_Greed_Index) * 100,
    },
    {
      label: '6 Months Ago',
      value: data[sixMonthsAgoIdx]?.Fear_Greed_Index,
      change: ((latestValidData.Fear_Greed_Index - data[sixMonthsAgoIdx]?.Fear_Greed_Index) / data[sixMonthsAgoIdx]?.Fear_Greed_Index) * 100,
    },
    {
      label: '1 Year Ago',
      value: data[yearAgoIdx]?.Fear_Greed_Index,
      change: ((latestValidData.Fear_Greed_Index - data[yearAgoIdx]?.Fear_Greed_Index) / data[yearAgoIdx]?.Fear_Greed_Index) * 100,
    },
  ];

  // Function to get the sentiment label based on value
  const getSentimentLabel = (value: number): string => {
    if (value >= 80) return "Extreme Greed";
    if (value >= 60) return "Greed";
    if (value >= 40) return "Neutral";
    if (value >= 20) return "Fear";
    return "Extreme Fear";
  };

  // Function to get the sentiment color based on value
  const getSentimentColor = (value: number): string => {
    if (value >= 80) return "#10b981"; // emerald
    if (value >= 60) return "#34d399"; // emerald-400
    if (value >= 40) return "#f59e0b"; // amber
    if (value >= 20) return "#f87171"; // red-400
    return "#ef4444"; // red
  };

  // Function to handle mini chart click
  const handleMiniChartClick = () => {
    // Open the Timeline accordion if it's closed
    if (!isChartExpanded) {
      setIsChartExpanded(true);
    }
    
    // Scroll to the Timeline accordion after a short delay to ensure it's rendered
    setTimeout(() => {
      const accordionElement = document.querySelector(`.${styles.chartAccordion}`);
      if (accordionElement) {
        accordionElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };




  // Timeframe selector component to be reused
  const TimeframeSelector = () => (
    <div className={styles.timeframeSelectorInline}>
      <button 
        className={`${styles.timeframeButton} ${timeframe === '1M' ? styles.active : ''}`}
        onClick={() => setTimeframe('1M')}
      >
        1M
      </button>
      <button 
        className={`${styles.timeframeButton} ${timeframe === '6M' ? styles.active : ''}`}
        onClick={() => setTimeframe('6M')}
      >
        6M
      </button>
      <button 
        className={`${styles.timeframeButton} ${timeframe === '3Y' ? styles.active : ''}`}
        onClick={() => setTimeframe('3Y')}
      >
        3Y
      </button>
    </div>
  );

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div className={styles.titleRow}>
            <h2 className="title">Investor's mood</h2>
            <button
              type="button"
              className={styles.infoButton}
              onClick={() => setIsInfoOpen(true)}
              aria-label="Learn more about Fear & Greed Index"
            >
              <span className="material-symbols-outlined">info</span>
            </button>
          </div>
          <p className="subtitle">
            What emotion is driving <span className="people-highlight">people</span> right now?
          </p>
          {/* Horizontal Slider Chart - moved here */}
          <div className={styles.sliderChartWrapper}>
            <div className={styles.sliderTrack}>
              {/* Colored track without labels */}
            </div>
            {/* Labels below the track */}
            <div className={styles.sliderLabels}>
              <span className={styles.sliderLabel}>Extreme Fear</span>
              <span className={styles.sliderLabel}>Neutral</span>
              <span className={styles.sliderLabel}>Extreme Greed</span>
            </div>
            {/* Current Value Indicator */}
            <div 
              className={styles.valueIndicator}
              style={{ 
                left: `${latestValidData.Fear_Greed_Index}%`
              }}
            >
            </div>
          </div>
          <div className={styles.currentValueContainer} style={{ borderColor: getSentimentColor(latestValidData.Fear_Greed_Index) }}>
            <div className={styles.valueDisplay}>
              <span className={styles.currentValue} style={{ color: getSentimentColor(latestValidData.Fear_Greed_Index) }}>
                {Math.round(latestValidData.Fear_Greed_Index)}
              </span>
              <span className={styles.sentimentLabel} style={{ color: getSentimentColor(latestValidData.Fear_Greed_Index) }}>
                {getSentimentLabel(latestValidData.Fear_Greed_Index)}
              </span>
            </div>
          </div>
        </div>
        {/* Historical Comparison Cards */}
        <div className={styles.historicalCards}>
          {/* Mini Chart Widget */}
          <div className={styles.miniChartWidget} onClick={handleMiniChartClick}>
            <div className={styles.miniChartHeader}>
              <span className={styles.miniChartTitle}>6M Trend</span>
            </div>
            <div className={styles.miniChartContainer}>
              <MiniLineChart data={getLast6MonthsData()} color={getSentimentColor(latestValidData.Fear_Greed_Index)} />
            </div>
          </div>
          {historicals.map((h) => (
            <div className={styles.historicalCard} key={h.label}>
              <span className={styles.historicalTitle}>{h.label}</span>
              <span className={styles.historicalValue}>{h.value ? Math.round(h.value) : '--'}</span>
              <span className={styles.historicalChange} style={{color: h.change >= 0 ? '#10b981' : '#ef4444'}}>
                {h.change >= 0 ? '+' : ''}{h.value ? Math.round(h.change) : '--'}%
              </span>
            </div>
          ))}
        </div>
        {/* Timeline Accordion */}
        <div className={styles.chartAccordion}>
          <button 
            className={styles.chartAccordionButton}
            onClick={() => setIsChartExpanded(!isChartExpanded)}
          >
            <span>Timeline</span>
            <span className={`${styles.chartAccordionIcon} ${isChartExpanded ? styles.expanded : ''}`}>
              ▼
            </span>
          </button>
          <div className={`${styles.chartAccordionContent} ${isChartExpanded ? styles.expanded : ''}`}>
            {/* Timeframe Selector */}
            <div className={styles.timeframeSelectorWrapper}>
              <TimeframeSelector />
            </div>
            {/* Line Chart for Fear & Greed Index */}
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredData} margin={{ top: 20, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                                    <XAxis 
                        dataKey="date" 
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value, index) => {
                          // For 3Y: show only one label per year with proper spacing
                          if (timeframe === '3Y') {
                            const dataPoint = filteredData[index];
                            if (!dataPoint || !dataPoint.originalDate) return '';
                            
                            const date = new Date(dataPoint.originalDate);
                            const year = date.getFullYear();
                            
                            // Get all unique years in the data
                            const uniqueYears = [...new Set(filteredData.map(item => 
                              new Date(item.originalDate).getFullYear()
                            ))].sort();
                            
                            // Find the middle data point for each year
                            const yearDataPoints = filteredData.filter(item => 
                              new Date(item.originalDate).getFullYear() === year
                            );
                            
                            const middleIndex = Math.floor(yearDataPoints.length / 2);
                            const isMiddlePoint = yearDataPoints[middleIndex] === dataPoint;
                            
                            return isMiddlePoint ? value : '';
                          }
                          
                          // For 1M and 6M: uniform distribution
                          const totalPoints = filteredData.length;
                          const maxLabels = timeframe === '1M' ? 6 : 4; // Max labels to show
                          const interval = Math.max(1, Math.floor(totalPoints / maxLabels));
                          
                          // Show labels at regular intervals
                          return index % interval === 0 ? value : '';
                        }}
                      />
                  <YAxis 
                    stroke="#9ca3af"
                    tick={false}
                    tickLine={false}
                    axisLine={false}
                    width={0}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e1e22',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '0.5rem',
                      color: '#fff',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ color: '#9ca3af', fontSize: '10px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <ReferenceLine 
                    y={100} 
                    stroke="rgba(255, 255, 255, 0.3)" 
                    strokeDasharray="2 2"
                    strokeWidth={1}
                    label={{ value: "Max (100)", position: "topRight", style: { fill: '#9ca3af', fontSize: '10px' } }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Fear_Greed_Index"
                    stroke={getSentimentColor(latestValidData.Fear_Greed_Index)}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Info Modal rendered via portal to detach from widget */}
        {hasMounted && isInfoOpen && createPortal(
          <div className={styles.modalBackdrop} onClick={() => setIsInfoOpen(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <div className={styles.modalHeader}>
                <h3>About the Fear & Greed Index</h3>
                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={() => setIsInfoOpen(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <h4>What is Fear & Greed Index?</h4>
                <p>
                  The Fear & Greed Index is a way to gauge stock market movements and whether stocks are fairly priced.
                </p>
                <h4>How is Fear & Greed Calculated?</h4>
                <p>
                  The Fear & Greed Index is a compilation of seven different indicators that measure some aspect of stock
                  market behavior. They are market momentum, stock price strength, stock price breadth, put and call
                  options, junk bond demand, market volatility, and safe haven demand. The index tracks how much these
                  individual indicators deviate from their averages compared to how much they normally diverge. The index
                  gives each indicator equal weighting in calculating a score from 0 to 100, with 100 representing maximum
                  greediness and 0 signaling maximum fear.
                </p>
                <h4>How often is the Fear & Greed Index calculated?</h4>
                <p>Every day at 4am UTC</p>
              </div>
            </div>
          </div>, document.body)
        }
      </div>
    </div>
  );
} 