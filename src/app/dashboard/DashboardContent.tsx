"use client";

import { useState, useEffect, useCallback } from "react";
import { TimeFrameSelector } from "@/components/TimeFrameSelector";
import { NPSTrendChart } from "@/components/NPSTrendChart";
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
  EmployeeRetentionData,
} from "@/app/actions/employeeActions";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import EmployeeDataSync from "@/components/EmployeeDataSync";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserIcon, MessageSquare } from "lucide-react";

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
  const [employeeData, setEmployeeData] =
    useState<EmployeeRetentionData | null>(null);
  const [employeeDataLoading, setEmployeeDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("feedback");
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isSyncing, setIsSyncing] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [useMock, setUseMock] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

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
    setEmployeeDataLoading(true);
    setError(null);
    try {
      const data = await getEmployeeRetentionData(currentYear);
      setEmployeeData(data);
    } catch (err) {
      console.error("Error fetching employee data:", err);
    } finally {
      setEmployeeDataLoading(false);
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
          <div className="flex mb-2 justify-between flex-col md:flex-row">
            <div className="w-auto">
              <TabsList className="mb-2">
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
            {activeTab === "feedback" && <TimeFrameSelector />}
          </div>
          <TabsContent value="feedback" className="space-y-2 md:space-y-4">
            <SummaryMetrics
              avgSatisfaction={surveyData.avgSatisfaction}
              avgCommunication={surveyData.avgCommunication}
              timeframeNps={surveyData.timeframeNps}
            />

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-3xl md:text-4xl">Personaldata</h2>
                <p className="text-muted-foreground min-h-[1.5rem]">
                  {employeeDataLoading ? (
                    "Laddar..."
                  ) : employeeData?.lastSyncDate ? (
                    <>
                      Senaste synk:{" "}
                      {new Date(employeeData.lastSyncDate).toLocaleDateString()}
                    </>
                  ) : (
                    <>Aldrig synkroniserad</>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  className="px-4"
                  size="lg"
                  onClick={() => {
                    setCurrentYear((prev) => prev - 1);
                    setTimeout(() => fetchEmployeeData(), 50);
                  }}
                  disabled={employeeDataLoading}
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setCurrentYear(new Date().getFullYear());
                    setTimeout(() => fetchEmployeeData(), 50);
                  }}
                  disabled={employeeDataLoading}
                >
                  Nuvarande år
                </Button>
                <Button
                  variant="outline"
                  className="px-4"
                  size="lg"
                  onClick={() => {
                    setCurrentYear((prev) => prev + 1);
                    setTimeout(() => fetchEmployeeData(), 50);
                  }}
                  disabled={
                    employeeDataLoading ||
                    currentYear >= new Date().getFullYear()
                  }
                >
                  →
                </Button>
              </div>
            </div>

            {employeeDataLoading ? (
              <div className="min-h-[300px] flex items-center justify-center">
                <p>Laddar personaldata...</p>
              </div>
            ) : !employeeData ? (
              <Card className="p-6">
                <p>
                  Inga personaldata tillgängliga. Vänligen synkronisera data
                  först.
                </p>
              </Card>
            ) : (
              <div className="flex gap-6 flex-col">
                <div>
                  <EmployeeMetrics retentionData={employeeData} />
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">
                    Datasynkronisering
                  </h3>
                  <EmployeeDataSync onSyncComplete={fetchEmployeeData} />
                </div>
              </div>
            )}
            <div className="mt-8">
              <h3 className="text-xl font-medium mb-2">Testning</h3>
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Button onClick={handleTestSync} disabled={isSyncing}>
                    {isSyncing ? "Laddar..." : "Force full synkning"}
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
