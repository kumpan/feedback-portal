"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { syncEmployeeData, EmployeeRetentionData } from "@/app/actions/employeeActions";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

interface EmployeeMetricsProps {
  retentionData: EmployeeRetentionData;
  onSync: () => Promise<void>;
}

export function EmployeeMetrics({ retentionData, onSync }: EmployeeMetricsProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      const result = await syncEmployeeData();
      setSyncResult({
        success: result.success,
        message: result.message
      });
      
      if (result.success) {
        await onSync();
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatYears = (years: number) => {
    const wholeYears = Math.floor(years);
    const months = Math.round((years - wholeYears) * 12);
    
    if (wholeYears === 0) {
      return `${months} months`;
    } else if (months === 0) {
      return `${wholeYears} ${wholeYears === 1 ? 'year' : 'years'}`;
    } else {
      return `${wholeYears} ${wholeYears === 1 ? 'year' : 'years'}, ${months} ${months === 1 ? 'month' : 'months'}`;
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  const getApiKeyStatusColor = () => {
    switch (retentionData.apiKeyStatus) {
      case 'valid': return 'text-green-500';
      case 'expired': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getApiKeyStatusText = () => {
    switch (retentionData.apiKeyStatus) {
      case 'valid': return 'API Key Valid';
      case 'expired': return 'API Key Expired';
      default: return 'API Key Status Unknown';
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
      <motion.div 
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(retentionData.retentionRate)}</div>
            <p className="text-xs text-muted-foreground">
              {retentionData.endOfYearCount} of {retentionData.startOfYearCount} employees
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
            <CardTitle className="text-sm font-medium">Original Employee Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(retentionData.originalEmployeeRetentionRate)}</div>
            <p className="text-xs text-muted-foreground">
              {retentionData.originalEmployeesRetained} of {retentionData.startOfYearCount} original employees
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
            <CardTitle className="text-sm font-medium">Average Employment Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatYears(retentionData.averageEmploymentDuration)}</div>
            <p className="text-xs text-muted-foreground">
              Across all employees
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div 
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Sync</CardTitle>
            <span className={getApiKeyStatusColor()}>
              {getApiKeyStatusText()}
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="text-sm">
                {retentionData.lastSyncDate ? (
                  <span>Last sync: {new Date(retentionData.lastSyncDate).toLocaleDateString()}</span>
                ) : (
                  <span>Never synced</span>
                )}
              </div>
              <Button 
                onClick={handleSync} 
                disabled={isSyncing}
                className="w-full"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Now
                  </>
                )}
              </Button>
              {syncResult && (
                <div className={`text-xs mt-1 ${syncResult.success ? 'text-green-500' : 'text-red-500'}`}>
                  {syncResult.success ? (
                    <CheckCircle className="inline mr-1 h-3 w-3" />
                  ) : (
                    <AlertCircle className="inline mr-1 h-3 w-3" />
                  )}
                  {syncResult.message}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
