"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  syncEmployeeData,
  EmployeeRetentionData,
} from "@/app/actions/employeeActions";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";

interface EmployeeMetricsProps {
  retentionData: EmployeeRetentionData;
  onSync: () => Promise<void>;
}

function Counter({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => 
    `${prefix}${latest.toFixed(decimals)}${suffix}`
  );

  useEffect(() => {
    const animation = animate(count, value, {
      duration: 0.5,
      ease: "easeOut",
    });

    return animation.stop;
  }, [count, value, prefix, suffix]);

  return <motion.span>{rounded}</motion.span>;
}

export function EmployeeMetrics({
  retentionData,
  onSync,
}: EmployeeMetricsProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const result = await syncEmployeeData();
      setSyncResult({
        success: result.success,
        message: result.message,
      });

      if (result.success) {
        await onSync();
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsSyncing(false);
    }
  };

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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const getApiKeyStatusColor = () => {
    switch (retentionData.apiKeyStatus) {
      case "valid":
        return "text-green-500";
      case "expired":
        return "text-red-500";
      default:
        return "text-yellow-500";
    }
  };

  const getApiKeyStatusText = () => {
    switch (retentionData.apiKeyStatus) {
      case "valid":
        return "API Key Valid";
      case "expired":
        return "API Key Expired";
      default:
        return "API Key Status Unknown";
    }
  };

  return (
    <div className="grid gap-2 md:gap-4 grid-cols-1 md:grid-cols-2">
      <Card>
        <CardHeader className="border-b border-border/20 mb-4">
          <CardTitle>Anställda vid årets början</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-5xl md:text-6xl font-medium">
            <Counter value={retentionData.startOfYearCount} decimals={0} />
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
          <div className="text-5xl md:text-6xl font-medium">
            <Counter value={retentionData.endOfYearCount} decimals={0} />
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
          <div className="text-5xl md:text-6xl font-medium">
            <Counter value={retentionData.retentionRate} decimals={1} suffix="%" />
          </div>
          <p className="opacity-70">Andel kvarvarande anställda</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="border-b border-border/20 mb-4">
          <CardTitle>Stabilitetsretention</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-5xl md:text-6xl font-medium">
            <Counter value={retentionData.originalEmployeeRetentionRate} decimals={1} suffix="%" />
          </div>
          <p className="opacity-70">
            <Counter value={retentionData.originalEmployeesRetained} decimals={0} /> av{" "}
            {retentionData.startOfYearCount} anställda
          </p>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2">
        <CardHeader className="border-b border-border/20 mb-4">
          <CardTitle>Genomsnittlig anställningstid</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-5xl md:text-6xl font-medium">
            {formatYears(retentionData.averageEmploymentDuration)}
          </div>
          <p className="opacity-70">Beräknat över alla anställda</p>
        </CardContent>
      </Card>
    </div>
  );
}
