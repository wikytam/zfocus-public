import { Card } from '@/lib/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/lib/components/ui/chart';
import { Clock, Ban } from 'lucide-react';
import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { ChartConfig } from '@/lib/components/ui/chart';
import type { HistoricalStats } from '@extension/storage';

interface StatsChartProps {
  historicalStats: HistoricalStats;
  currentStats: {
    blockedAttempts: number;
    timePausedSeconds: number;
  };
  currentDate: string;
}

type ViewMode = 'week' | 'month';

const chartConfig = {
  blockedAttempts: {
    label: 'Blocks',
    color: 'hsl(var(--chart-1))',
  },
  timePausedMinutes: {
    label: 'Pause (min)',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export const StatsChart = ({ historicalStats, currentStats, currentDate }: StatsChartProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  const chartData = useMemo(() => {
    const allStats = { ...historicalStats };
    allStats[currentDate] = {
      blockedAttempts: currentStats.blockedAttempts,
      timePausedSeconds: currentStats.timePausedSeconds,
      sitesAccessed: {},
    };

    const dates = Object.keys(allStats).sort();
    const daysToShow = viewMode === 'week' ? 7 : 30;
    const recentDates = dates.slice(-daysToShow);

    return recentDates.map(date => {
      const stats = allStats[date];
      const dateObj = new Date(date);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return {
        date: viewMode === 'week' ? dayName : monthDay,
        fullDate: date,
        blockedAttempts: stats?.blockedAttempts || 0,
        timePausedMinutes: Math.round((stats?.timePausedSeconds || 0) / 60),
      };
    });
  }, [historicalStats, currentStats, currentDate, viewMode]);

  const maxBlocked = Math.max(...chartData.map(d => d.blockedAttempts), 1);
  const maxPaused = Math.max(...chartData.map(d => d.timePausedMinutes), 1);

  return (
    <Card variant="glass" className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-lg p-2">
            <Clock className="text-primary h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Statistics Overview</h3>
            <p className="text-muted-foreground text-xs">{viewMode === 'week' ? 'Last 7 days' : 'Last 30 days'}</p>
          </div>
        </div>

        <div className="bg-background/50 flex gap-1 rounded-lg p-1">
          <button
            onClick={() => setViewMode('week')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              viewMode === 'week'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-background/80 hover:text-foreground'
            }`}>
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              viewMode === 'month'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-background/80 hover:text-foreground'
            }`}>
            Month
          </button>
        </div>
      </div>

      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
          <YAxis
            yAxisId="left"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11 }}
            domain={[0, maxBlocked + 2]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11 }}
            domain={[0, maxPaused + 2]}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="blockedAttempts"
            stroke="var(--color-blockedAttempts)"
            strokeWidth={2}
            dot={{ fill: 'var(--color-blockedAttempts)', r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="timePausedMinutes"
            stroke="var(--color-timePausedMinutes)"
            strokeWidth={2}
            dot={{ fill: 'var(--color-timePausedMinutes)', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ChartContainer>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3">
        <div className="flex items-center gap-2">
          <div className="bg-chart-1/10 rounded-lg p-1.5">
            <Ban className="text-chart-1 h-4 w-4" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Total Blocks</p>
            <p className="text-sm font-semibold">{chartData.reduce((sum, d) => sum + d.blockedAttempts, 0)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-chart-2/10 rounded-lg p-1.5">
            <Clock className="text-chart-2 h-4 w-4" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Total Pause</p>
            <p className="text-sm font-semibold">
              {Math.round(chartData.reduce((sum, d) => sum + d.timePausedMinutes, 0))}m
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
