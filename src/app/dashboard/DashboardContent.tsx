"use client";

import { useState, useEffect, useCallback } from "react";
import { TimeFrameSelector } from "@/components/TimeFrameSelector";
import { NPSTrendChart } from "@/components/NPSTrendChart";
import { EmployeeTrendChart } from "@/components/EmployeeTrendChart";
import { SummaryMetrics } from "@/components/SummaryMetrics";
import SurveyResponsesList from "@/components/SurveyResponsesList";
import GenerateLink from "@/components/GenerateLink";
import { useTimeFrame } from "@/context/TimeFrameContext";
import { Session } from "next-auth";
import { SurveyData } from "@/app/actions/surveyActions";
import { motion, AnimatePresence } from "framer-motion";
import { EmployeeMetrics } from "@/components/EmployeeMetrics";
import {
  getEmployeeRetentionData,
  getEmployeeTrendData,
  getAllYearsEmployeeRetentionData,
  EmployeeRetentionData,
} from "@/app/actions/employeeActions";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import EmployeeDataSync from "@/components/EmployeeDataSync";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserIcon,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface DashboardContentProps {
  session: Session;
  positiveMessage: string;
  getSurveyData: (timeFrame: string) => Promise<SurveyData>;
}

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function DashboardContent({
  session,
  positiveMessage,
  getSurveyData,
}: DashboardContentProps) {
  const { timeFrame } = useTimeFrame();
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState("feedback");
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isSyncing, setIsSyncing] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [useMock, setUseMock] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [allEmployeeData, setAllEmployeeData] = useState<
    Record<number, EmployeeRetentionData>
  >({});
  const [currentEmployeeData, setCurrentEmployeeData] =
    useState<EmployeeRetentionData | null>(null);
  const [employeeTrendData, setEmployeeTrendData] = useState<{
    trendData: Array<{
      date: string;
      active: number;
      joined: number;
      left: number;
      formattedDate: string;
    }>;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const data = await getSurveyData(timeFrame);
        setSurveyData(data);
      } catch (err) {
        console.error("Error fetching survey data:", err);
        setError(
          err instanceof Error ? err : new Error("An unknown error occurred")
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timeFrame, getSurveyData]);

  const fetchEmployeeData = useCallback(async () => {
    try {
      const { retentionDataByYear } = await getAllYearsEmployeeRetentionData();
      setAllEmployeeData(retentionDataByYear);
      setCurrentEmployeeData(retentionDataByYear[currentYear]);

      const trendData = await getEmployeeTrendData();
      setEmployeeTrendData(trendData);
    } catch (err) {
      console.error("Error fetching employee data:", err);
    }
  }, [currentYear]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/test-employees");
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "employees") {
      fetchEmployeeData();
      fetchEmployees();
    }
  }, [activeTab, fetchEmployeeData]);

  const handleTestSync = async () => {
    setIsSyncing(true);
    setSyncMessage("Synkroniserar anställda...");
    try {
      const response = await fetch("/api/sync-employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ forceFullSync: true, useMock }),
      });
      const data = await response.json();
      setSyncMessage(data.message);
      fetchEmployees();
      fetchEmployeeData();
    } catch (error) {
      console.error("Error syncing employees:", error);
      setSyncMessage("Fel vid synkronisering av anställda");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (loading && !surveyData) {
    return <></>;
  }

  if (error) {
    return (
      <section className="w-full flex items-center justify-center">
        <div className="w-full max-w-5xl px-4 md:px-8 py-6 md:py-12 gap-2 md:gap-4 flex flex-col">
          <p className="text-center py-8 text-red-500">
            Error: {error.message}
          </p>
        </div>
      </section>
    );
  }

  if (!surveyData) {
    return (
      <section className="w-full flex items-center justify-center">
        <div className="w-full max-w-5xl px-4 md:px-8 py-6 md:py-12 gap-2 md:gap-4 flex flex-col">
          <p className="text-center py-8">Inga data tillgängliga</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full flex items-center justify-center">
      <div className="w-full max-w-5xl px-4 md:px-8 py-6 md:py-12 gap-2 md:gap-4 flex flex-col">
        <motion.div
          className="flex flex-col md:flex-row md:justify-between items-center mb-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: {
              opacity: { ease: "easeInOut", duration: 0.3 },
              y: { type: "spring", stiffness: 300, damping: 24 },
            },
          }}
        >
          <div className="flex w-full justify-between flex-col md:flex-row gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl">
                <span>Hallå där</span>
                {session.user?.name && (
                  <span>, {session.user.name.split(" ")[0]} </span>
                )}
                <motion.span
                  className="inline-block cursor-grab"
                  initial={{ rotate: 0 }}
                  animate={{
                    rotate: [0, 15, -15, 15, 0],
                    transition: {
                      duration: 1.5,
                      ease: "easeInOut",
                      times: [0, 0.2, 0.5, 0.8, 1],
                      repeat: 0,
                      delay: 0.1,
                    },
                  }}
                  whileHover={{
                    scale: 1.2,
                    transition: {
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                    },
                  }}
                >
                  👋
                </motion.span>
              </h1>
              <p className="text-lg max-w-lg leading-snug mt-2">
                {positiveMessage}
              </p>
            </div>
          </div>
        </motion.div>

        <Tabs
          defaultValue="feedback"
          value={activeTab}
          onValueChange={handleTabChange}
          className="mt-4"
        >
          <div className="flex mb-2 md:mb-4 justify-between md:items-center gap-2 flex-col md:flex-row">
            <div className="w-auto">
              <TabsList className="mb-0">
                <TabsTrigger
                  value="feedback"
                  icon={<MessageSquare className="h-4 w-4" />}
                >
                  Feedback
                </TabsTrigger>
                <TabsTrigger
                  value="employees"
                  icon={<UserIcon className="h-4 w-4" />}
                >
                  Anställda
                </TabsTrigger>
              </TabsList>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              {activeTab === "feedback" && (
                <motion.div
                  key="timeFrameSelector"
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <TimeFrameSelector />
                </motion.div>
              )}
              {activeTab === "employees" && (
                <motion.div
                  key="employeeSelector"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex select-none items-center">
                    <div className="border border-border h-12 rounded-md flex items-center overflow-hidden">
                      <div
                        className={`px-3 cursor-pointer rounded-sm flex items-center justify-center h-full ${
                          currentYear <= 2004
                            ? "opacity-50"
                            : "hover:bg-primary-80/70 transition-colors"
                        }`}
                        onClick={() => {
                          if (currentYear <= 2004) return;
                          setCurrentYear((prev) => prev - 1);
                          setTimeout(() => {
                            if (allEmployeeData[currentYear - 1]) {
                              setCurrentEmployeeData(
                                allEmployeeData[currentYear - 1]
                              );
                            }
                          }, 50);
                        }}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </div>
                      <div
                        className="px-4 py-2 cursor-pointer hover:bg-primary-80/70 flex transition-colors h-full justify-center items-center rounded-sm"
                        onClick={() => {
                          const thisYear = new Date().getFullYear();
                          setCurrentYear(thisYear);
                          setTimeout(() => {
                            if (allEmployeeData[thisYear]) {
                              setCurrentEmployeeData(allEmployeeData[thisYear]);
                            }
                          }, 50);
                        }}
                      >
                        {currentYear}
                      </div>
                      <div
                        className={`px-3 cursor-pointer rounded-sm flex items-center justify-center h-full ${
                          currentYear >= new Date().getFullYear()
                            ? "opacity-50"
                            : "hover:bg-primary-80/70 transition-colors"
                        }`}
                        onClick={() => {
                          if (currentYear >= new Date().getFullYear()) return;
                          setCurrentYear((prev) => prev + 1);
                          setTimeout(() => {
                            if (allEmployeeData[currentYear + 1]) {
                              setCurrentEmployeeData(
                                allEmployeeData[currentYear + 1]
                              );
                            }
                          }, 50);
                        }}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <TabsContent value="feedback" className="space-y-2 md:space-y-4">
            <SummaryMetrics surveyData={surveyData} />

            <NPSTrendChart
              trendData={surveyData.trendData}
              timeFrame={timeFrame}
            />

            <div className="mt-8 flex flex-col md:flex-row md:justify-between">
              <h2 className="text-2xl md:text-3xl">Feedback svar</h2>
              <GenerateLink />
            </div>
            <SurveyResponsesList responses={surveyData.responses} />
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            <div className="flex gap-6 flex-col">
              {currentEmployeeData && (
                <EmployeeMetrics retentionData={currentEmployeeData} />
              )}
              {employeeTrendData && (
                <EmployeeTrendChart trendData={employeeTrendData.trendData} />
              )}
              <div>
                <h3 className="text-xl font-medium mb-2">Datasynkronisering</h3>
                <EmployeeDataSync onSyncComplete={fetchEmployeeData} />
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-medium mb-2">Testning</h3>
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Button
                    onClick={handleTestSync}
                    disabled={isSyncing}
                    size="lg"
                  >
                    {isSyncing ? "Laddar..." : "Full synkning"}
                  </Button>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useMock"
                      checked={useMock}
                      onChange={(e) => setUseMock(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="useMock">Använd testdata</label>
                  </div>

                  {syncMessage && <div>{syncMessage}</div>}
                </div>

                <div className="overflow-x-auto border rounded-2xl">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border-b">Namn</th>
                        <th className="py-2 px-4 border-b">Startdatum</th>
                        <th className="py-2 px-4 border-b">Slutdatum</th>
                        <th className="py-2 px-4 border-b">Aktiv</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((employee) => (
                        <tr key={employee.id}>
                          <td className="py-2 text-center px-4 border-b">
                            {employee.firstName} {employee.lastName}
                          </td>
                          <td className="py-2 text-center px-4 border-b">
                            {employee.startDate}
                          </td>
                          <td className="py-2 text-center px-4 border-b">
                            {employee.endDate || "N/A"}
                          </td>
                          <td className="py-2 text-center px-4 border-b">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                employee.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {employee.isActive ? "Ja" : "Nej"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
