"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";

type EmployeeTrendData = {
  date: string;
  active: number;
  joined: number;
  left: number;
  formattedDate: string;
};

interface EmployeeTrendChartProps {
  trendData: EmployeeTrendData[];
}

const chartConfig = {
  active: {
    label: "Anställda",
    color: "var(--chart-1)",
  },
  joined: {
    label: "Nyanställda",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: EmployeeTrendData;
    dataKey: string;
    name: string;
    value: number;
  }>;
  label?: string;
}

const CustomChartTooltipContent = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="bg-white p-3 border rounded-md shadow-md">
        <p className="font-medium">{data.formattedDate}</p>
        <p className="text-lg">
          <span>Anställda:</span> {data.active}
        </p>
        <p className="text-lg">
          <span>Nyanställda:</span> {data.joined}
        </p>
      </div>
    );
  }
  return null;
};

export function EmployeeTrendChart({ trendData }: EmployeeTrendChartProps) {
  return (
    <Card className="w-full">
      <CardHeader className="border-b border-border/20 mb-4">
        <CardTitle>
          Personalutveckling 2004 till {new Date().getFullYear()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                accessibilityLayer
                data={trendData}
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
                  dataKey="active"
                  name="Anställda"
                  type="monotone"
                  stroke="var(--color-nps)"
                  strokeWidth={2}
                  dot={true}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
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
