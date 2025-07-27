'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { format as formatDate, subDays, subMonths, subYears } from "date-fns";
import { useTimeframe } from '@/context/TimeframeContext';
import styles from './IndexWidget.module.css';

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

export default function IndexWidget({ data }: Props) {
  const { timeframe, setTimeframe } = useTimeframe();
  
  // Get the latest data point
  const latestData = data[data.length - 1];
  const currentValue = latestData.Fear_Greed_Index;
  
  // Get historical values
  const oneWeekAgo = subDays(new Date(), 7);
  const oneMonthAgo = subMonths(new Date(), 1);
  const sixMonthsAgo = subMonths(new Date(), 6);
  const oneYearAgo = subYears(new Date(), 1);
  
  // Find closest data points to these dates
  const findClosestDataPoint = (targetDate: Date) => {
    return data.reduce((closest, current) => {
      const currentDate = new Date(current.date);
      const closestDate = new Date(closest.date);
      
      const currentDiff = Math.abs(currentDate.getTime() - targetDate.getTime());
      const closestDiff = Math.abs(closestDate.getTime() - targetDate.getTime());
      
      return currentDiff < closestDiff ? current : closest;
    });
  };
  
  const weekAgoData = findClosestDataPoint(oneWeekAgo);
  const monthAgoData = findClosestDataPoint(oneMonthAgo);
  const sixMonthsAgoData = findClosestDataPoint(sixMonthsAgo);
  const yearAgoData = findClosestDataPoint(oneYearAgo);
  
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
  
  // Filter data based on selected timeframe
  const getFilteredData = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case '1M':
        startDate = subMonths(now, 1);
        break;
      case '6M':
        startDate = subMonths(now, 6);
        break;
      case '3Y':
        startDate = subYears(now, 3);
        break;
      default:
        startDate = subMonths(now, 6);
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
          value: item.Fear_Greed_Index
        };
      });
  };
  
  const filteredData = getFilteredData();
  const sentimentColor = getSentimentColor(currentValue);
  const sentimentLabel = getSentimentLabel(currentValue);
  
  // Calculate percentage change
  const calculateChange = (current: number, previous: number) => {
    return ((current - previous) / previous) * 100;
  };
  
  const weekChange = calculateChange(currentValue, weekAgoData.Fear_Greed_Index);
  const monthChange = calculateChange(currentValue, monthAgoData.Fear_Greed_Index);
  const sixMonthChange = calculateChange(currentValue, sixMonthsAgoData.Fear_Greed_Index);
  const yearChange = calculateChange(currentValue, yearAgoData.Fear_Greed_Index);
  
  return (
    <div className={styles.indexWidget}>
      <div className={styles.indexHeader}>
        <h2 className={styles.indexTitle}>Fear & Greed Index</h2>
        <div className={styles.timeframeSelector}>
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
      </div>
      
      <div className={styles.indexValueContainer} style={{ borderColor: sentimentColor }}>
        <div className={styles.valueDisplay}>
          <span className={styles.indexValue} style={{ color: sentimentColor }}>
            {currentValue.toFixed(2)}
          </span>
          <span className={styles.sentimentLabel} style={{ color: sentimentColor }}>
            {sentimentLabel}
          </span>
        </div>
      </div>
      
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={filteredData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={sentimentColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={sentimentColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value, index) => {
                // For 3Y: show labels for actual years in the data
                if (timeframe === '3Y') {
                  const dataPoint = filteredData[index];
                  if (!dataPoint || !dataPoint.originalDate) return '';
                  
                  const date = new Date(dataPoint.originalDate);
                  const year = date.getFullYear();
                  const month = date.getMonth();
                  
                  // Show label for January of each year, or first occurrence of each year
                  if (month === 0) return value;
                  
                  // If no January data, show first occurrence of each year
                  const currentYear = year;
                  const isFirstOccurrenceOfYear = index === 0 || 
                    (index > 0 && new Date(filteredData[index - 1].originalDate).getFullYear() !== currentYear);
                  
                  return isFirstOccurrenceOfYear ? value : '';
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
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={30}
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
            <Area
              type="monotone"
              dataKey="value"
              stroke={sentimentColor}
              fillOpacity={1}
              fill="url(#colorValue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className={styles.historicalValues}>
        <div className={styles.historicalItem}>
          <span className={styles.historicalLabel}>1 Week Ago</span>
          <span className={styles.historicalValue}>{weekAgoData.Fear_Greed_Index.toFixed(2)}</span>
          <span className={`${styles.historicalChange} ${weekChange >= 0 ? styles.positive : styles.negative}`}>
            {weekChange >= 0 ? '+' : ''}{weekChange.toFixed(2)}%
          </span>
        </div>
        <div className={styles.historicalItem}>
          <span className={styles.historicalLabel}>1 Month Ago</span>
          <span className={styles.historicalValue}>{monthAgoData.Fear_Greed_Index.toFixed(2)}</span>
          <span className={`${styles.historicalChange} ${monthChange >= 0 ? styles.positive : styles.negative}`}>
            {monthChange >= 0 ? '+' : ''}{monthChange.toFixed(2)}%
          </span>
        </div>
        <div className={styles.historicalItem}>
          <span className={styles.historicalLabel}>6 Months Ago</span>
          <span className={styles.historicalValue}>{sixMonthsAgoData.Fear_Greed_Index.toFixed(2)}</span>
          <span className={`${styles.historicalChange} ${sixMonthChange >= 0 ? styles.positive : styles.negative}`}>
            {sixMonthChange >= 0 ? '+' : ''}{sixMonthChange.toFixed(2)}%
          </span>
        </div>
        <div className={styles.historicalItem}>
          <span className={styles.historicalLabel}>1 Year Ago</span>
          <span className={styles.historicalValue}>{yearAgoData.Fear_Greed_Index.toFixed(2)}</span>
          <span className={`${styles.historicalChange} ${yearChange >= 0 ? styles.positive : styles.negative}`}>
            {yearChange >= 0 ? '+' : ''}{yearChange.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
} 