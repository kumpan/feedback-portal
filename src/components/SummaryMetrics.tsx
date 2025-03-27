"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SurveyData } from "@/app/actions/surveyActions";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

interface SummaryMetricsProps {
  surveyData: SurveyData;
}

function AnimateNumber({
  value,
  duration = 0.8,
  decimals = 0,
  suffix = "",
  prefix = "",
}: {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
}) {
  const prevValueRef = useRef(value);
  const count = useMotionValue(prevValueRef.current);

  const formattedValue = useTransform(count, (latest) => {
    return `${prefix}${latest.toFixed(decimals)}${suffix}`;
  });

  useEffect(() => {
    if (prevValueRef.current !== value) {
      const animation = animate(count, value, {
        duration: duration,
        ease: "easeOut",
      });

      prevValueRef.current = value;

      return animation.stop;
    }
  }, [count, value, duration]);

  return <motion.span>{formattedValue}</motion.span>;
}

export function SummaryMetrics({ surveyData }: SummaryMetricsProps) {
  const avgSatisfaction = surveyData.avgSatisfaction;
  const avgCommunication = surveyData.avgCommunication;
  const nps = surveyData.timeframeNps;

  return (
    <div className="grid gap-2 md:gap-4 grid-cols-1 md:grid-cols-3">
      <Card>
        <CardHeader className="border-b border-border/20 mb-4">
          <CardTitle>NPS</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-5xl md:text-6xl proportional-nums font-medium">
            {nps >= 0 ? "+" : ""}
            <AnimateNumber value={nps} decimals={1} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="border-b border-border/20 mb-4">
          <CardTitle>Nöjdhet</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-5xl md:text-6xl proportional-nums font-medium">
            <AnimateNumber value={avgSatisfaction} decimals={1} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="border-b border-border/20 mb-4">
          <CardTitle>Kommunikation</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-5xl md:text-6xl proportional-nums font-medium">
            <AnimateNumber value={avgCommunication} decimals={1} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
