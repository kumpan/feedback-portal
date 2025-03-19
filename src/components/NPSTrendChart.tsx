"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type NPSTrendData = {
  date: string;
  nps: number;
  satisfaction: number;
  communication: number;
};

interface NPSTrendChartProps {
  trendData: NPSTrendData[];
  avgNps: number;
  latestNps: number; // Changed from currentNps
  totalResponses: number;
  timeFrame: string;
  industryData?: {
    industryAvg: number;
    industryMedian: number;
    topQuartile: number;
    bottomQuartile: number;
  };
}

const defaultIndustryData = {
  industryAvg: 43,
  industryMedian: 50,
  topQuartile: 73,
  bottomQuartile: 19,
};

const chartConfig = {
  nps: {
    label: "NPS Score",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function NPSTrendChart({
  trendData,
  avgNps,
  latestNps, // Changed from currentNps
  totalResponses,
  timeFrame,
  industryData = defaultIndustryData,
}: NPSTrendChartProps) {
  const formattedData = trendData.map((item) => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString("sv-SE", {
      day: "2-digit",
      month: "short",
    }),
  }));

  const dataLength = formattedData.length;
  const trendDirection =
    dataLength >= 2
      ? formattedData[dataLength - 1].nps - formattedData[0].nps
      : 0;

  const trendPercentage =
    dataLength >= 2 && formattedData[0].nps !== 0
      ? (
          ((formattedData[dataLength - 1].nps - formattedData[0].nps) /
            Math.abs(formattedData[0].nps)) *
          100
        ).toFixed(1)
      : "0.0";

  const getTimeFrameText = () => {
    switch (timeFrame) {
      case "last7days":
        return "Visar trender för de senaste 7 dagarna";
      case "last30days":
        return "Visar trender för de senaste 30 dagarna";
      case "all":
      default:
        return "Visar alla trender";
    }
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= industryData.topQuartile) return "Excellent (Top Quartile)";
    if (score >= industryData.industryMedian) return "Above Average";
    if (score >= industryData.industryAvg) return "Average";
    if (score >= industryData.bottomQuartile) return "Below Average";
    return "Poor (Bottom Quartile)";
  };

  const getPerformanceColor = (score: number) => {
    if (score >= industryData.topQuartile) return "text-green-600";
    if (score >= industryData.industryMedian) return "text-green-500";
    if (score >= industryData.industryAvg) return "text-yellow-500";
    if (score >= industryData.bottomQuartile) return "text-orange-500";
    return "text-red-500";
  };

  // Get title based on timeframe
  const getNpsBoxTitle = () => {
    switch (timeFrame) {
      case "last7days":
        return "Last 7 Days NPS Score";
      case "last30days":
        return "Last 30 Days NPS Score";
      case "all":
        return "All Time NPS Score";
      default:
        return "NPS Score";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>NPS Trend över tid</CardTitle>
          <div className="text-sm font-medium">
            Period:{" "}
            {formattedData.length > 0
              ? `${new Date(formattedData[0].date).toLocaleDateString(
                  "sv-SE"
                )} - ${new Date(
                  formattedData[formattedData.length - 1].date
                ).toLocaleDateString("sv-SE")}`
              : "Ingen data"}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Time Period NPS Score Box */}
        <div className="bg-card border rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-muted-foreground">
                {getNpsBoxTitle()}
              </h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-3xl font-bold ${getPerformanceColor(
                    avgNps
                  )}`}
                >
                  {avgNps >= 0 ? `+${avgNps}` : avgNps}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({getPerformanceLevel(avgNps)})
                </span>
              </div>
            </div>
            <div className="grid text-right">
              <span className="text-sm font-medium">Industry Benchmarks:</span>
              <span className="text-xs text-muted-foreground">
                Avg: +{industryData.industryAvg} | Median: +
                {industryData.industryMedian}
              </span>
              <span className="text-xs text-muted-foreground">
                Top: +{industryData.topQuartile} | Bottom: +
                {industryData.bottomQuartile}
              </span>
            </div>
          </div>
        </div>

        {/* Latest NPS value if it exists */}
        {trendData.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-semibold">
              Latest NPS Value:{" "}
              <span className={getPerformanceColor(latestNps)}>
                {latestNps >= 0 ? `+${latestNps}` : latestNps}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {totalResponses} responses
            </div>
          </div>
        )}

        {/* NPS Chart */}
        <ChartContainer config={chartConfig}>
          {formattedData.length > 0 ? (
            <LineChart
              accessibilityLayer
              data={formattedData}
              margin={{
                left: 12,
                right: 12,
                top: 20,
                bottom: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="formattedDate"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                domain={[-100, 100]}
                tickCount={11}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Line
                dataKey="nps"
                name="NPS Score"
                type="monotone"
                stroke="var(--color-nps)"
                strokeWidth={2}
                dot={true}
                activeDot={{ r: 6 }}
              />

              {/* Reference line for period average NPS */}
              <ReferenceLine
                y={avgNps}
                stroke="var(--color-current-nps)"
                strokeWidth={2}
                strokeDasharray="5 2"
                label={{
                  value: `Period Avg: ${avgNps >= 0 ? `+${avgNps}` : avgNps}`,
                  position: "right",
                  fill: "var(--color-current-nps)",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              />

              {/* Reference lines for industry benchmarks */}
              <ReferenceLine
                y={industryData.industryAvg}
                stroke="var(--color-industry-avg)"
                strokeDasharray="3 3"
                label={{
                  value: `Avg: +${industryData.industryAvg}`,
                  position: "left",
                  fill: "var(--color-industry-avg)",
                  fontSize: 11,
                }}
              />
              <ReferenceLine
                y={industryData.industryMedian}
                stroke="var(--color-industry-median)"
                strokeDasharray="3 3"
                label={{
                  value: `Median: +${industryData.industryMedian}`,
                  position: "left",
                  fill: "var(--color-industry-median)",
                  fontSize: 11,
                }}
              />
              <ReferenceLine
                y={industryData.topQuartile}
                stroke="var(--color-top-quartile)"
                strokeDasharray="3 3"
                label={{
                  value: `Top: +${industryData.topQuartile}`,
                  position: "insideTopLeft",
                  fill: "var(--color-top-quartile)",
                  fontSize: 11,
                }}
              />
              <ReferenceLine
                y={industryData.bottomQuartile}
                stroke="var(--color-bottom-quartile)"
                strokeDasharray="3 3"
                label={{
                  value: `Bottom: +${industryData.bottomQuartile}`,
                  position: "insideBottomLeft",
                  fill: "var(--color-bottom-quartile)",
                  fontSize: 11,
                }}
              />
            </LineChart>
          ) : (
            <div className="flex h-48 items-center justify-center">
              <p className="text-muted-foreground">Ingen data tillgänglig</p>
            </div>
          )}
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            {trendDirection !== 0 && (
              <div className="flex items-center gap-2 font-medium leading-none">
                {trendDirection > 0 ? (
                  <>
                    Trending upp med {trendPercentage}% under perioden{" "}
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </>
                ) : (
                  <>
                    Trending ner med {Math.abs(Number(trendPercentage))}% under
                    perioden <TrendingDown className="h-4 w-4 text-red-500" />
                  </>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              {getTimeFrameText()}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
