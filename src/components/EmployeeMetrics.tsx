"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeRetentionData } from "@/app/actions/employeeActions";
import { motion } from "framer-motion";

interface EmployeeMetricsProps {
  retentionData: EmployeeRetentionData;
}

export function EmployeeMetrics({
  retentionData,
}: EmployeeMetricsProps) {
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatYears = (years: number) => {
    if (years < 1) {
      const months = Math.round(years * 12);
      return `${months} ${months === 1 ? 'månad' : 'månader'}`;
    }
    return `${years.toFixed(1)} ${years === 1 ? 'år' : 'år'}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid gap-2 md:gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-border/20 mb-4">
            <CardTitle>Anställda vid årets början</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-5xl md:text-6xl font-medium">
              {retentionData.startOfYearCount}
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
              {retentionData.endOfYearCount}
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
              {formatPercentage(retentionData.retentionRate)}
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
              {formatPercentage(retentionData.originalEmployeeRetentionRate)}
            </div>
            <p className="opacity-70">
              {retentionData.originalEmployeesRetained} av{" "}
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
    </motion.div>
  );
}
