'use client';

import { ThemeProvider } from "next-themes";
import { FearGreedCharts } from "@/components/charts/FearGreedCharts";
import { useEffect, useState } from "react";

interface ChartData {
  date: string;
  momentum: number;
  strength: number;
  safe_haven: number;
  Fear_Greed_Index: number;
}

export default function Home() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fear-greed-data')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setLoading(false);
      });
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold p-8 text-center text-foreground">
            Fear & Greed Index - Live Dashboard
          </h1>
          {loading ? (
            <div className="text-center text-foreground">Loading data...</div>
          ) : (
            <FearGreedCharts data={data} />
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}
