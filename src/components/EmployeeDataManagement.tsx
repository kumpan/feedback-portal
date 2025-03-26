"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import EmployeeDataSync from "@/components/EmployeeDataSync";
import {
  syncEmployeeData,
  getEmployeeRetentionData,
  EmployeeRetentionData,
} from "@/app/actions/employeeActions";
import { motion } from "framer-motion";
import {
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Users,
  Calendar,
  Clock,
} from "lucide-react";

export default function EmployeeDataManagement() {
  const [employeeData, setEmployeeData] =
    useState<EmployeeRetentionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const fetchEmployeeData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEmployeeRetentionData(currentYear);
      setEmployeeData(data);
    } catch (err) {
      console.error("Error fetching employee data:", err);
      setError("Failed to load employee data");
    } finally {
      setLoading(false);
    }
  }, [currentYear]);

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);

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
        await fetchEmployeeData();
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatYears = (years: number) => {
    const wholeYears = Math.floor(years);
    const months = Math.round((years - wholeYears) * 12);

    if (wholeYears === 0) {
      return `${months} months`;
    } else if (months === 0) {
      return `${wholeYears} ${wholeYears === 1 ? "year" : "years"}`;
    } else {
      return `${wholeYears} ${wholeYears === 1 ? "year" : "years"}, ${months} ${
        months === 1 ? "month" : "months"
      }`;
    }
  };

  const getApiKeyStatusColor = () => {
    if (!employeeData) return "text-yellow-500";

    switch (employeeData.apiKeyStatus) {
      case "valid":
        return "text-green-500";
      case "expired":
        return "text-red-500";
      default:
        return "text-yellow-500";
    }
  };

  const getApiKeyStatusText = () => {
    if (!employeeData) return "API Key Status Unknown";

    switch (employeeData.apiKeyStatus) {
      case "valid":
        return "API Key Valid";
      case "expired":
        return "API Key Expired";
      default:
        return "API Key Status Unknown";
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="metrics">Retention Metrics</TabsTrigger>
          <TabsTrigger value="sync">Data Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <Card className="bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-800">
                      Error Loading Data
                    </h3>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : employeeData ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {currentYear} Employee Retention
                  </h2>
                  <p className="text-muted-foreground">
                    {employeeData.lastSyncDate ? (
                      <>
                        Last synced:{" "}
                        {new Date(
                          employeeData.lastSyncDate
                        ).toLocaleDateString()}
                      </>
                    ) : (
                      <>Never synced</>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentYear((prev) => prev - 1)}
                  >
                    Previous Year
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentYear(new Date().getFullYear())}
                  >
                    Current Year
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentYear((prev) => prev + 1)}
                    disabled={currentYear >= new Date().getFullYear()}
                  >
                    Next Year
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center text-lg">
                        <Users className="h-5 w-5 mr-2" />
                        End/Start Retention
                      </CardTitle>
                      <CardDescription>
                        Compares employees at the beginning and end of the year
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {formatPercentage(employeeData.retentionRate)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {employeeData.endOfYearCount} of{" "}
                        {employeeData.startOfYearCount} employees
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center text-lg">
                        <Calendar className="h-5 w-5 mr-2" />
                        Original Employee Retention
                      </CardTitle>
                      <CardDescription>
                        Measures how many original employees stayed throughout
                        the year
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {formatPercentage(
                          employeeData.originalEmployeeRetentionRate
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {employeeData.originalEmployeesRetained} of{" "}
                        {employeeData.startOfYearCount} original employees
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center text-lg">
                        <Clock className="h-5 w-5 mr-2" />
                        Average Employment Duration
                      </CardTitle>
                      <CardDescription>
                        Average time employees have been with the company
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {formatYears(employeeData.averageEmploymentDuration)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Across all employees
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>API Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={getApiKeyStatusColor()}>
                        {getApiKeyStatusText()}
                      </span>
                    </div>
                    <Button onClick={handleSync} disabled={isSyncing}>
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
                  </div>

                  {syncResult && (
                    <div
                      className={`mt-4 p-3 rounded-md ${
                        syncResult.success ? "bg-green-50" : "bg-red-50"
                      }`}
                    >
                      <div className="flex items-start">
                        {syncResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                        )}
                        <div>
                          <h3
                            className={`font-medium ${
                              syncResult.success
                                ? "text-green-800"
                                : "text-red-800"
                            }`}
                          >
                            {syncResult.success
                              ? "Sync Successful"
                              : "Sync Failed"}
                          </h3>
                          <p
                            className={`text-sm ${
                              syncResult.success
                                ? "text-green-700"
                                : "text-red-700"
                            }`}
                          >
                            {syncResult.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center py-4">
                  No employee data available. Please sync data first.
                </p>
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
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sync">
          <EmployeeDataSync />

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>About Employee Data Sync</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                This system syncs employee data from the Hailey HR API and
                stores it in our database for retention analysis. The data is
                used to calculate:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  End/Start Retention Rate: Compares employees at the beginning
                  and end of the year
                </li>
                <li>
                  Original Employee Retention: Measures how many original
                  employees stayed throughout the year
                </li>
                <li>
                  Average Employment Duration: Shows the average time employees
                  have been with the company
                </li>
              </ul>
              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="font-medium text-blue-800 mb-1">
                  API Key Expiration Handling
                </h3>
                <p className="text-sm text-blue-700">
                  If the Hailey HR API key expires, the system will continue to
                  serve historical data from the database. After renewing the
                  API key, you can sync again to fetch new data while preserving
                  historical records.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
