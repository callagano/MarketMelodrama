'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
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
  // Only show last 180 days of data
  const recentData = data.slice(-180).map((item) => ({
    date: format(new Date(item.date), "MMM d, yyyy"),
    "Fear & Greed Index": item.Fear_Greed_Index,
    "Market Momentum": item.momentum,
    "Stock Price Strength": item.strength,
    "Safe Haven Demand": item.safe_haven,
  }));

  const chartConfigs = [
    {
      title: "Fear & Greed Index",
      dataKey: "Fear & Greed Index",
      color: "#6366f1", // indigo
    },
    {
      title: "Market Momentum",
      dataKey: "Market Momentum",
      color: "#10b981", // emerald
    },
    {
      title: "Stock Price Strength",
      dataKey: "Stock Price Strength",
      color: "#f59e0b", // amber
    },
    {
      title: "Safe Haven Demand",
      dataKey: "Safe Haven Demand",
      color: "#ec4899", // pink
    },
  ];

  return (
    <div className={styles.chartContainer}>
      {chartConfigs.map((config) => (
        <div key={config.title} className={styles.chartCard}>
          <h2 className={styles.chartTitle}>{config.title}</h2>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recentData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    // Only show month and day for cleaner display
                    return value.split(',')[0];
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
                <Legend 
                  verticalAlign="top" 
                  height={20}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '10px', color: '#9ca3af' }}
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
  );
} 