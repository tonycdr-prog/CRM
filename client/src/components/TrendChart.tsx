import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { DamperHistory, formatVelocityChange } from "@/lib/trendAnalysis";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendChartProps {
  damperHistory: DamperHistory;
  minVelocityThreshold: number;
  testId?: string;
}

export default function TrendChart({ damperHistory, minVelocityThreshold, testId }: TrendChartProps) {
  const { damper, yearlyData } = damperHistory;
  
  // Prepare chart data
  const chartData = yearlyData.map(yearGroup => ({
    year: yearGroup.year.toString(),
    averageVelocity: parseFloat(yearGroup.averageVelocity.toFixed(2)),
    passRate: parseFloat(((yearGroup.passCount / yearGroup.tests.length) * 100).toFixed(1)),
    testCount: yearGroup.tests.length,
  }));
  
  // Calculate year-over-year change for the most recent year
  let trendInfo = null;
  if (yearlyData.length >= 2) {
    const latest = yearlyData[yearlyData.length - 1];
    const previous = yearlyData[yearlyData.length - 2];
    const delta = latest.averageVelocity - previous.averageVelocity;
    const percent = previous.averageVelocity !== 0 
      ? (delta / previous.averageVelocity) * 100 
      : 0;
    trendInfo = formatVelocityChange(delta, percent);
  }
  
  return (
    <Card data-testid={testId ? `card-trend-${testId}` : "card-trend"}>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-lg" data-testid="text-trend-title">
              Historical Trend Analysis
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1" data-testid="text-damper-info">
              {damper.building} - {damper.location}, Floor {damper.floorNumber} (Shaft {damper.shaftId})
            </p>
          </div>
          
          {trendInfo && (
            <div className="flex items-center gap-2" data-testid="container-trend-info">
              {trendInfo.isPositive && (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <TrendingUp className="w-4 h-4" data-testid="icon-trending-up" />
                  <span className="text-sm font-medium" data-testid="text-trend-change">
                    {trendInfo.text}
                  </span>
                </div>
              )}
              {trendInfo.isNegative && (
                <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <TrendingDown className="w-4 h-4" data-testid="icon-trending-down" />
                  <span className="text-sm font-medium" data-testid="text-trend-change">
                    {trendInfo.text}
                  </span>
                </div>
              )}
              {trendInfo.isNeutral && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Minus className="w-4 h-4" data-testid="icon-trending-neutral" />
                  <span className="text-sm font-medium" data-testid="text-trend-change">
                    {trendInfo.text}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Velocity Trend Chart */}
          <div>
            <h4 className="text-sm font-medium mb-3" data-testid="text-velocity-chart-title">
              Average Velocity Over Time
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart 
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="year" 
                  label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                  className="text-xs"
                />
                <YAxis 
                  label={{ value: 'Velocity (m/s)', angle: -90, position: 'insideLeft' }}
                  className="text-xs"
                  domain={[0, 'auto']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: any, name: string) => {
                    if (name === 'averageVelocity') {
                      return [`${value} m/s`, 'Avg Velocity'];
                    }
                    if (name === 'passRate') {
                      return [`${value}%`, 'Pass Rate'];
                    }
                    return [value, name];
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <ReferenceLine 
                  y={minVelocityThreshold} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="5 5"
                  label={{ 
                    value: `Min Threshold (${minVelocityThreshold} m/s)`, 
                    position: 'right',
                    fill: 'hsl(var(--destructive))',
                    fontSize: 12
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="averageVelocity" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Avg Velocity"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Pass Rate Chart */}
          <div>
            <h4 className="text-sm font-medium mb-3" data-testid="text-passrate-chart-title">
              Pass Rate Over Time
            </h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart 
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="year" 
                  label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                  className="text-xs"
                />
                <YAxis 
                  label={{ value: 'Pass Rate (%)', angle: -90, position: 'insideLeft' }}
                  className="text-xs"
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: any, name: string) => {
                    if (name === 'passRate') {
                      return [`${value}%`, 'Pass Rate'];
                    }
                    if (name === 'testCount') {
                      return [`${value} tests`, 'Total Tests'];
                    }
                    return [value, name];
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <ReferenceLine 
                  y={100} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
                <Line 
                  type="monotone" 
                  dataKey="passRate" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-2))', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Pass Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div data-testid="stat-total-years">
              <p className="text-xs text-muted-foreground">Years Tracked</p>
              <p className="text-2xl font-bold" data-testid="value-total-years">
                {yearlyData.length}
              </p>
            </div>
            <div data-testid="stat-total-tests">
              <p className="text-xs text-muted-foreground">Total Tests</p>
              <p className="text-2xl font-bold" data-testid="value-total-tests">
                {damperHistory.totalTests}
              </p>
            </div>
            <div data-testid="stat-latest-avg">
              <p className="text-xs text-muted-foreground">Latest Avg</p>
              <p className="text-2xl font-bold" data-testid="value-latest-avg">
                {yearlyData[yearlyData.length - 1].averageVelocity.toFixed(2)}
                <span className="text-sm font-normal ml-1">m/s</span>
              </p>
            </div>
            <div data-testid="stat-latest-passrate">
              <p className="text-xs text-muted-foreground">Latest Pass Rate</p>
              <p className="text-2xl font-bold" data-testid="value-latest-passrate">
                {((yearlyData[yearlyData.length - 1].passCount / yearlyData[yearlyData.length - 1].tests.length) * 100).toFixed(0)}
                <span className="text-sm font-normal ml-1">%</span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
