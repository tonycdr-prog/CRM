import { Damper } from "@shared/schema";
import { DamperHistory } from "@/lib/trendAnalysis";
import { TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle } from "lucide-react";

interface PDFTrendPageProps {
  damperHistories: DamperHistory[];
  minVelocityThreshold: number;
}

export default function PDFTrendPage({ damperHistories, minVelocityThreshold }: PDFTrendPageProps) {
  if (damperHistories.length === 0) {
    return null;
  }

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white p-[20mm] flex flex-col">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-foreground mb-2">Year-Over-Year Trends</h2>
        <div className="h-1 w-24 bg-primary" />
        <p className="text-sm text-muted-foreground mt-3">
          Historical performance analysis for dampers with repeat annual inspections
        </p>
      </div>

      <div className="flex-1 space-y-8">
        {damperHistories.map((history) => {
          const { damper, yearlyData } = history;
          
          // Calculate overall trend
          const firstYear = yearlyData[0];
          const lastYear = yearlyData[yearlyData.length - 1];
          const velocityChange = lastYear.averageVelocity - firstYear.averageVelocity;
          const velocityChangePercent = firstYear.averageVelocity !== 0
            ? (velocityChange / firstYear.averageVelocity) * 100
            : 0;
          
          const isImproving = velocityChange > 0;
          const isDeclining = velocityChange < 0;
          
          return (
            <div key={damper.id} className="border border-muted rounded-md overflow-hidden">
              <div className="bg-muted/30 p-4 border-b border-muted">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">
                      {damper.building} - {damper.location}
                    </h3>
                    <p className="text-sm text-muted-foreground font-mono">
                      Damper ID: {damper.shaftId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isImproving && (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-sm font-semibold">Improving</span>
                      </div>
                    )}
                    {isDeclining && (
                      <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <TrendingDown className="w-5 h-5" />
                        <span className="text-sm font-semibold">Declining</span>
                      </div>
                    )}
                    {!isImproving && !isDeclining && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Minus className="w-5 h-5" />
                        <span className="text-sm font-semibold">Stable</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-semibold">Year</th>
                      <th className="text-center p-2 font-semibold">Tests</th>
                      <th className="text-right p-2 font-semibold">Avg Velocity (m/s)</th>
                      <th className="text-center p-2 font-semibold">Pass</th>
                      <th className="text-center p-2 font-semibold">Fail</th>
                      <th className="text-right p-2 font-semibold">Pass Rate</th>
                      <th className="text-right p-2 font-semibold">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyData.map((yearGroup, index) => {
                      const passRate = yearGroup.tests.length > 0
                        ? (yearGroup.passCount / yearGroup.tests.length) * 100
                        : 0;
                      
                      let changeText = "-";
                      let changeColor = "text-muted-foreground";
                      
                      if (index > 0) {
                        const prevYear = yearlyData[index - 1];
                        const delta = yearGroup.averageVelocity - prevYear.averageVelocity;
                        const deltaPercent = prevYear.averageVelocity !== 0
                          ? (delta / prevYear.averageVelocity) * 100
                          : 0;
                        
                        const sign = delta > 0 ? "+" : "";
                        changeText = `${sign}${delta.toFixed(2)} (${sign}${deltaPercent.toFixed(1)}%)`;
                        changeColor = delta > 0 
                          ? "text-green-600 dark:text-green-400" 
                          : delta < 0 
                            ? "text-red-600 dark:text-red-400" 
                            : "text-muted-foreground";
                      }
                      
                      return (
                        <tr 
                          key={yearGroup.year}
                          className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                        >
                          <td className="p-2 font-semibold">{yearGroup.year}</td>
                          <td className="p-2 text-center">{yearGroup.tests.length}</td>
                          <td className="p-2 text-right font-mono font-semibold">
                            {yearGroup.averageVelocity.toFixed(2)}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="font-semibold">{yearGroup.passCount}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400">
                              <XCircle className="w-4 h-4" />
                              <span className="font-semibold">{yearGroup.failCount}</span>
                            </div>
                          </td>
                          <td className="p-2 text-right font-semibold">
                            {passRate.toFixed(1)}%
                          </td>
                          <td className={`p-2 text-right text-xs font-mono ${changeColor}`}>
                            {changeText}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-4 pb-4">
                <div className="bg-muted/20 p-3 rounded-md text-xs">
                  <p className="font-semibold mb-1 text-foreground">Overall Trend Summary</p>
                  <p className="text-muted-foreground">
                    From {firstYear.year} to {lastYear.year}: 
                    {isImproving && (
                      <span className="text-green-600 dark:text-green-400 font-semibold ml-1">
                        Velocity increased by {velocityChange.toFixed(2)} m/s (+{velocityChangePercent.toFixed(1)}%)
                      </span>
                    )}
                    {isDeclining && (
                      <span className="text-red-600 dark:text-red-400 font-semibold ml-1">
                        Velocity decreased by {Math.abs(velocityChange).toFixed(2)} m/s ({velocityChangePercent.toFixed(1)}%)
                      </span>
                    )}
                    {!isImproving && !isDeclining && (
                      <span className="text-muted-foreground font-semibold ml-1">
                        No significant change in velocity
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center text-xs text-muted-foreground border-t pt-3 mt-6">
      </div>
    </div>
  );
}
