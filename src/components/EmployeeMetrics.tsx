"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  syncEmployeeData,
  EmployeeRetentionData,
} from "@/app/actions/employeeActions";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";

interface EmployeeMetricsProps {
  retentionData: EmployeeRetentionData;
  onSync: () => Promise<void>;
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

  const retentionRateSpring = useSpring(retentionData.retentionRate, { 
    stiffness: 100, 
    damping: 30 
  });
  
  const originalRetentionRateSpring = useSpring(retentionData.originalEmployeeRetentionRate, { 
    stiffness: 100, 
    damping: 30 
  });
  
  const durationSpring = useSpring(retentionData.averageEmploymentDuration, { 
    stiffness: 100, 
    damping: 30 
  });
  
  const formattedRetentionRate = useTransform(retentionRateSpring, value => 
    `${value.toFixed(1)}%`
  );
  
  const formattedOriginalRetentionRate = useTransform(originalRetentionRateSpring, value => 
    `${value.toFixed(1)}%`
  );
  
  const formattedDuration = useTransform(durationSpring, value => {
    const wholeYears = Math.floor(value);
    const months = Math.round((value - wholeYears) * 12);

    if (wholeYears === 0) {
      return `${months} months`;
    } else if (months === 0) {
      return `${wholeYears} ${wholeYears === 1 ? "year" : "years"}`;
    } else {
      return `${wholeYears} ${wholeYears === 1 ? "year" : "years"}, ${months} ${
        months === 1 ? "month" : "months"
      }`;
    }
  });

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
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
    <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mt-4">
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="">Årsskiftesretention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-medium">
              <motion.span>{formattedRetentionRate}</motion.span>
            </div>
            <p className="text-xs text-muted-foreground">
              {retentionData.endOfYearCount} av {retentionData.startOfYearCount}{" "}
              anställda
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="">Stabilitetsretention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-medium">
              <motion.span>{formattedOriginalRetentionRate}</motion.span>
            </div>
            <p className="text-xs text-muted-foreground">
              {retentionData.originalEmployeesRetained} av{" "}
              {retentionData.startOfYearCount} anställda
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="">Anställningstid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-medium">
              <motion.span>{formattedDuration}</motion.span>
            </div>
            <p className="text-xs text-muted-foreground">Över alla anställda</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
