'use client';

import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ThemeProvider } from "next-themes";

// Mock data for the last 3 months
const mockData = [
  { date: '2024-01-01', value: 65 },
  { date: '2024-01-08', value: 72 },
  { date: '2024-01-15', value: 58 },
  { date: '2024-01-22', value: 45 },
  { date: '2024-01-29', value: 62 },
  { date: '2024-02-05', value: 75 },
  { date: '2024-02-12', value: 68 },
  { date: '2024-02-19', value: 55 },
  { date: '2024-02-26', value: 48 },
  { date: '2024-03-04', value: 70 },
  { date: '2024-03-11', value: 82 },
  { date: '2024-03-18', value: 75 },
];

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-foreground">Fear & Greed Index</h1>
          
          <Card className="p-6 bg-card">
            <h2 className="text-2xl font-semibold mb-6 text-card-foreground">Last 3 Months Trend</h2>
            
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF' }}
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
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#6366F1" 
                    strokeWidth={2}
                    dot={{ fill: '#6366F1' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </ThemeProvider>
  );
}
