"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeRetentionData } from "@/app/actions/employeeActions";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface EmployeeMetricsProps {
  retentionData: EmployeeRetentionData;
  onSync?: () => Promise<void>;
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

export function EmployeeMetrics({ retentionData }: EmployeeMetricsProps) {
  const formatYears = (years: number) => {
    const wholeYears = Math.floor(years);
    const months = Math.round((years - wholeYears) * 12);

    if (wholeYears === 0) {
      return `${months} ${months === 1 ? "månad" : "månader"}`;
    } else if (months === 0) {
      return `${wholeYears} ${wholeYears === 1 ? "år" : "år"}`;
    } else {
      return `${wholeYears} ${wholeYears === 1 ? "år" : "år"}, ${months} ${
        months === 1 ? "månad" : "månader"
      }`;
    }
  };

  return (
    <div className="grid gap-2 md:gap-4 grid-cols-1 md:grid-cols-2">
      <Card>
        <CardHeader className="border-b border-border/20 mb-4">
          <CardTitle>Anställda vid årets början</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-5xl md:text-6xl proportional-nums font-medium">
            <AnimateNumber
              value={retentionData.startOfYearCount}
              decimals={0}
            />
          </div>
          <p className="opacity-70">
            Antal anställda {retentionData.year}-01-01
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/20 mb-4">
          <CardTitle>Anställda vid årets slut</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-5xl md:text-6xl proportional-nums font-medium">
            <AnimateNumber value={retentionData.endOfYearCount} decimals={0} />
          </div>
          <p className="opacity-70">
            Antal anställda {retentionData.year}-12-31
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/20 mb-4">
          <CardTitle>Årsskiftesretention</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-5xl md:text-6xl proportional-nums font-medium">
            <AnimateNumber
              value={retentionData.retentionRate}
              decimals={1}
              suffix="%"
            />
          </div>
          <p className="opacity-70">Andel kvarvarande anställda</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/20 mb-4">
          <CardTitle>Stabilitetsretention</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-5xl md:text-6xl proportional-nums font-medium">
            <AnimateNumber
              value={retentionData.originalEmployeeRetentionRate}
              decimals={1}
              suffix="%"
            />
          </div>
          <p className="opacity-70">
            <AnimateNumber
              value={retentionData.originalEmployeesRetained}
              decimals={0}
            />{" "}
            av {retentionData.startOfYearCount} anställda
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="border-b border-border/20 mb-4">
          <CardTitle>Genomsnittlig anställningstid</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-5xl md:text-6xl proportional-nums font-medium">
            {formatYears(retentionData.averageEmploymentDuration)}
          </div>
          <p className="opacity-70">Beräknat över alla anställda</p>
        </CardContent>
      </Card>
    </div>
  );
}
