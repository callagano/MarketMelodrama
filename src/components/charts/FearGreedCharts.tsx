'use client';

import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subMonths, parseISO } from 'date-fns';

interface ChartData {
  date: string;
  momentum: number;
  strength: number;
  safe_haven: number;
  Fear_Greed_Index: number;
}

interface ChartProps {
  data: ChartData[];
  title: string;
  dataKey: keyof ChartData;
  color: string;
}

const ChartCard = ({ data, title, dataKey, color }: ChartProps) => (
  <Card className="p-6 bg-card mb-6">
    <h2 className="text-xl font-semibold mb-6 text-card-foreground">{title}</h2>
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            tickFormatter={(date) => format(parseISO(date), 'MMM d')}
          />
          <YAxis 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              color: '#9CA3AF'
            }}
            labelFormatter={(date) => format(parseISO(date as string), 'MMM d, yyyy')}
          />
          <Line 
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </Card>
);

export function FearGreedCharts({ data }: { data: ChartData[] }) {
  // Filter last 6 months of data
  const sixMonthsAgo = subMonths(new Date(), 6);
  const filteredData = data.filter(item => parseISO(item.date) >= sixMonthsAgo);

  return (
    <div className="max-w-[500px] mx-auto p-4">
      <ChartCard 
        data={filteredData}
        title="Fear & Greed Index"
        dataKey="Fear_Greed_Index"
        color="#6366F1"
      />
      <ChartCard 
        data={filteredData}
        title="Market Momentum"
        dataKey="momentum"
        color="#22C55E"
      />
      <ChartCard 
        data={filteredData}
        title="Stock Price Strength"
        dataKey="strength"
        color="#EAB308"
      />
      <ChartCard 
        data={filteredData}
        title="Safe Haven Demand"
        dataKey="safe_haven"
        color="#EC4899"
      />
    </div>
  );
} 