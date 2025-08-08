'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format as formatDate } from "date-fns";
import { useTimeframe } from '@/context/TimeframeContext';
import { useState } from 'react';
import styles from './FearGreedCharts.module.css';

interface ChartData {
  date: string;
  momentum: number;
  strength: number;
  safe_haven: number;
  Fear_Greed_Index: number;
}

interface Props {
  data: ChartData[];
}

export default function FearGreedCharts({ data }: Props) {
  const { timeframe, setTimeframe } = useTimeframe();
  const [isExpanded, setIsExpanded] = useState(false);
  
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
                    "Market Momentum": item.momentum,
                    "Stock Price Strength": item.strength,
                    "Safe Haven Demand": item.safe_haven,
                    "Fear & Greed Index": item.Fear_Greed_Index,
                  };
      });
  };

  // Get the latest data point
  const filteredData = getFilteredData();
  const latestData = data[data.length - 1];

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
  const now = new Date(latestData.date);
  const weekAgoIdx = getClosestIndex(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7));
  const monthAgoIdx = getClosestIndex(new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()));
  const sixMonthsAgoIdx = getClosestIndex(new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()));
  const yearAgoIdx = getClosestIndex(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()));

  const historicals = [
    {
      label: '1 Week Ago',
      value: data[weekAgoIdx]?.Fear_Greed_Index,
      change: ((latestData.Fear_Greed_Index - data[weekAgoIdx]?.Fear_Greed_Index) / data[weekAgoIdx]?.Fear_Greed_Index) * 100,
    },
    {
      label: '1 Month Ago',
      value: data[monthAgoIdx]?.Fear_Greed_Index,
      change: ((latestData.Fear_Greed_Index - data[monthAgoIdx]?.Fear_Greed_Index) / data[monthAgoIdx]?.Fear_Greed_Index) * 100,
    },
    {
      label: '6 Months Ago',
      value: data[sixMonthsAgoIdx]?.Fear_Greed_Index,
      change: ((latestData.Fear_Greed_Index - data[sixMonthsAgoIdx]?.Fear_Greed_Index) / data[sixMonthsAgoIdx]?.Fear_Greed_Index) * 100,
    },
    {
      label: '1 Year Ago',
      value: data[yearAgoIdx]?.Fear_Greed_Index,
      change: ((latestData.Fear_Greed_Index - data[yearAgoIdx]?.Fear_Greed_Index) / data[yearAgoIdx]?.Fear_Greed_Index) * 100,
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



  const chartConfigs = [
    {
      title: "Market Momentum",
      dataKey: "Market Momentum",
      color: "#10b981", // emerald
      description: "Measures the rate of change in market prices. High values indicate strong upward momentum, suggesting investors are confident and actively buying. This can signal potential market bubbles.",
      currentValue: latestData.momentum,
      sentimentLabel: getSentimentLabel(latestData.momentum),
      sentimentColor: getSentimentColor(latestData.momentum)
    },
    {
      title: "Stock Price Strength",
      dataKey: "Stock Price Strength",
      color: "#f59e0b", // amber
      description: "Tracks the number of stocks hitting 52-week highs vs. lows. High values show broad market strength with many stocks reaching new highs, indicating strong bullish sentiment.",
      currentValue: latestData.strength,
      sentimentLabel: getSentimentLabel(latestData.strength),
      sentimentColor: getSentimentColor(latestData.strength)
    },
    {
      title: "Safe Haven Demand",
      dataKey: "Safe Haven Demand",
      color: "#ec4899", // pink
      description: "Measures the performance of safe-haven assets like gold and bonds. High values indicate investors are seeking safety, often during market uncertainty or fear periods.",
      currentValue: latestData.safe_haven,
      sentimentLabel: getSentimentLabel(latestData.safe_haven),
      sentimentColor: getSentimentColor(latestData.safe_haven)
    },
  ];

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
          <h2 className={styles.chartTitle}>People's mood</h2>
          <p className={styles.chartDescription}>
            A Fear and Greed indicator that measures market sentiment by analyzing various factors including volatility, momentum, and safe-haven demand.
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
                left: `${latestData.Fear_Greed_Index}%`
              }}
            >
            </div>
          </div>
          <div className={styles.currentValueContainer} style={{ borderColor: getSentimentColor(latestData.Fear_Greed_Index) }}>
            <div className={styles.valueDisplay}>
              <span className={styles.currentValue} style={{ color: getSentimentColor(latestData.Fear_Greed_Index) }}>
                {latestData.Fear_Greed_Index.toFixed(2)}
              </span>
              <span className={styles.sentimentLabel} style={{ color: getSentimentColor(latestData.Fear_Greed_Index) }}>
                {getSentimentLabel(latestData.Fear_Greed_Index)}
              </span>
            </div>
          </div>
        </div>
        {/* Historical Comparison Cards */}
        <div className={styles.historicalCards}>
          {historicals.map((h) => (
            <div className={styles.historicalCard} key={h.label}>
              <span className={styles.historicalTitle}>{h.label}</span>
              <span className={styles.historicalValue}>{h.value?.toFixed(2) ?? '--'}</span>
              <span className={styles.historicalChange} style={{color: h.change >= 0 ? '#10b981' : '#ef4444'}}>
                {h.change >= 0 ? '+' : ''}{h.value ? h.change.toFixed(2) : '--'}%
              </span>
            </div>
          ))}
        </div>
        {/* Timeframe Selector (moved here) */}
        <div className={styles.timeframeSelectorWrapper}>
          <TimeframeSelector />
        </div>
        {/* Line Chart for Fear & Greed Index */}
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={filteredData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
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
              <Line
                type="monotone"
                dataKey="Fear & Greed Index"
                stroke={getSentimentColor(latestData.Fear_Greed_Index)}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Expansion Panel for Metric Cards */}
        <div className={styles.expansionPanel}>
          <button 
            className={styles.expansionButton}
            onClick={() => setIsExpanded(!isExpanded)}
          >
                            <span>Index Components</span>
            <span className={`${styles.expansionIcon} ${isExpanded ? styles.expanded : ''}`}>
              ▼
            </span>
          </button>
          <div className={`${styles.expansionContent} ${isExpanded ? styles.expanded : ''}`}>
            {chartConfigs.map((config) => (
              <div key={config.title} className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <h2 className={styles.chartTitle}>{config.title}</h2>
                  <p className={styles.chartDescription}>{config.description}</p>
                  <div className={styles.currentValueContainer} style={{ borderColor: config.sentimentColor }}>
                    <div className={styles.valueDisplay}>
                      <span className={styles.currentValue} style={{ color: config.sentimentColor }}>
                        {config.currentValue.toFixed(2)}
                      </span>
                      <span className={styles.sentimentLabel} style={{ color: config.sentimentColor }}>
                        {config.sentimentLabel}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={filteredData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
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
                      <Line
                        type="monotone"
                        dataKey={config.dataKey}
                        stroke={config.color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 