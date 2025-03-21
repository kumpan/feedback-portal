"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

interface SummaryMetricsProps {
  avgSatisfaction: number;
  avgCommunication: number;
  timeframeNps: number;
}

function Counter({
  value,
  decimals = 0,
}: {
  value: number;
  decimals?: number;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => latest.toFixed(decimals));

  useEffect(() => {
    const animation = animate(count, value, {
      duration: 0.5,
      ease: "easeOut",
    });

    return animation.stop;
  }, [count, value]);

  return <motion.span>{rounded}</motion.span>;
}

export function SummaryMetrics({
  timeframeNps,
  avgCommunication,
  avgSatisfaction,
}: SummaryMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
      <Card className="gap-0">
        <CardHeader>
          <CardTitle>NPS</CardTitle>
        </CardHeader>
        <CardContent>
          <motion.p className="text-6xl md:text-7xl font-medium">
            {timeframeNps >= 0 ? "+" : ""}
            <Counter value={timeframeNps} />
          </motion.p>
        </CardContent>
      </Card>
      <Card className="gap-0">
        <CardHeader>
          <CardTitle>Nöjdhet</CardTitle>
        </CardHeader>
        <CardContent>
          <motion.p className="text-6xl md:text-7xl font-medium">
            <Counter value={avgSatisfaction} decimals={1} />
          </motion.p>
        </CardContent>
      </Card>
      <Card className="gap-0">
        <CardHeader>
          <CardTitle>Kommunikation</CardTitle>
        </CardHeader>
        <CardContent>
          <motion.p className="text-6xl md:text-7xl font-medium">
            <Counter value={avgCommunication} decimals={1} />
          </motion.p>
        </CardContent>
      </Card>
    </div>
  );
}
