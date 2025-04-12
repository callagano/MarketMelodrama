'use client';

import { ThemeProvider } from "next-themes";
import { FearGreedCharts } from "@/components/charts/FearGreedCharts";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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

  const currentData = data.length > 0 ? data[data.length - 1] : null;
  const sentimentType = currentData && currentData.Fear_Greed_Index > 50 ? 'GREED' : 'FEAR';
  const sentimentColor = currentData && currentData.Fear_Greed_Index > 50 ? 'text-green-500' : 'text-red-500';

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-[700px] p-4">
          <div className="flex flex-col space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fear & Greed Index</CardTitle>
                <CardDescription>Live market sentiment analysis and tracking</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
                    <div className="flex flex-col items-center space-y-2 text-center">
                      <div className="text-sm text-muted-foreground">Loading market data...</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Main Sentiment Card */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">CURRENT SENTIMENT</p>
                        <div className="flex items-center space-x-2">
                          <h2 className="text-3xl font-bold">
                            {currentData?.Fear_Greed_Index.toFixed(2)}
                          </h2>
                          <span className={`text-sm font-medium ${sentimentColor}`}>
                            {sentimentType}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Last Updated</p>
                        <p className="text-sm font-medium">
                          {currentData && new Date(currentData.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Charts */}
                    <div className="space-y-4">
                      <FearGreedCharts data={data} />
                    </div>

                    {/* Indicators Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="p-4">
                          <CardTitle className="text-sm font-medium">Market Momentum</CardTitle>
                          <div className="text-2xl font-bold">{currentData?.momentum.toFixed(2)}</div>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader className="p-4">
                          <CardTitle className="text-sm font-medium">Stock Strength</CardTitle>
                          <div className="text-2xl font-bold">{currentData?.strength.toFixed(2)}</div>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader className="p-4">
                          <CardTitle className="text-sm font-medium">Safe Haven Demand</CardTitle>
                          <div className="text-2xl font-bold">{currentData?.safe_haven.toFixed(2)}</div>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader className="p-4">
                          <CardTitle className="text-sm font-medium">Overall Trend</CardTitle>
                          <div className={`text-2xl font-bold ${sentimentColor}`}>{sentimentType}</div>
                        </CardHeader>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
