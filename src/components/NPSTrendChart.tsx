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
import { getTimeFrameStartDate } from "@/app/utils/surveyUtils";

type NPSTrendData = {
  date: string;
  nps: number;
  satisfaction: number;
  communication: number;
};

interface NPSTrendChartProps {
  trendData: NPSTrendData[];
  timeFrame?: string;
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

// Custom tooltip component
const CustomChartTooltipContent = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const industryData = defaultIndustryData;

    return (
      <div className="bg-white p-3 border rounded-md shadow-md">
        <p className="font-medium">{data.formattedDate}</p>
        <p className="text-sm">
          <span className="font-medium">NPS:</span> {data.nps}
        </p>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600">Branschriktmärken:</p>
          <p className="text-xs">
            <span className="font-medium">Top:</span> +
            {industryData.topQuartile}
          </p>
          <p className="text-xs">
            <span className="font-medium">Average:</span> +
            {industryData.industryAvg}
          </p>
          <p className="text-xs">
            <span className="font-medium">Bottom:</span> +
            {industryData.bottomQuartile}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function NPSTrendChart({
  trendData,
  timeFrame = "last30days",
  industryData = defaultIndustryData,
}: NPSTrendChartProps) {
  // Filter data based on the selected time frame
  const startDate = getTimeFrameStartDate(timeFrame);

  const filteredData = trendData.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate >= startDate;
  });

  const formattedData = filteredData.map((item) => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString("sv-SE", {
      day: "2-digit",
      month: "short",
    }),
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>NPS trend</CardTitle>
      </CardHeader>
      <CardContent>
        {/* NPS Chart */}
        <ChartContainer config={chartConfig}>
          {formattedData.length > 0 ? (
            <LineChart
              accessibilityLayer
              data={formattedData}
              margin={{
                left: 8,
                right: 8,
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
                hide={true}
              />
              <YAxis
                domain={[0, 100]}
                tickCount={5}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                hide={true}
              />
              <ChartTooltip
                cursor={true}
                content={<CustomChartTooltipContent />}
              />

              <Line
                dataKey="nps"
                name="NPS Score"
                type="monotone"
                stroke="var(--color-nps)"
                strokeWidth={2}
                dot={true}
                activeDot={{ r: 6 }}
              />

              {/* Reference lines for industry benchmarks */}
              <ReferenceLine
                y={industryData.industryAvg}
                stroke="var(--color-industry-avg)"
                strokeDasharray="8 8"
                label={undefined}
              />
              <ReferenceLine
                y={industryData.topQuartile}
                stroke="var(--color-top-quartile)"
                strokeDasharray="8 8"
                label={undefined}
              />
              <ReferenceLine
                y={industryData.bottomQuartile}
                stroke="var(--color-bottom-quartile)"
                strokeDasharray="8 8"
                label={undefined}
              />
            </LineChart>
          ) : (
            <div className="flex h-48 items-center justify-center">
              <p className="text-muted-foreground">Ingen data tillgänglig</p>
            </div>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
