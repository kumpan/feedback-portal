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
  const avgCommunication = surveyData.avgCommunication;
  const nps = surveyData.timeframeNps;
  const expectationsMetPercentage = surveyData.expectationsMetPercentage;

  return (
    <div className="grid gap-2 md:gap-4 grid-cols-1 md:grid-cols-3">
      <Card>
        <CardHeader className="border-b border-border/20 mb-4">
          <CardTitle>NPS</CardTitle>
          <p className="text-sm opacity-70">Net Promoter Score.</p>
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
          <CardTitle>Förväntningar</CardTitle>
          <p className="text-sm opacity-70">
            Andel som levererat över förväntan.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-5xl md:text-6xl proportional-nums font-medium">
            <AnimateNumber value={expectationsMetPercentage} decimals={1} />
            <span>%</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="border-b border-border/20 mb-4">
          <CardTitle>Kommunikation</CardTitle>
          <p className="text-sm opacity-70">Hur bra vi kommunicerar, 1-5.</p>
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
