"use client";

import { useState, useEffect } from "react";
import { TimeFrameSelector } from "@/components/TimeFrameSelector";
import { NPSTrendChart } from "@/components/NPSTrendChart";
import { SummaryMetrics } from "@/components/SummaryMetrics";
import SurveyResponsesList from "@/components/SurveyResponsesList";
import GenerateLink from "@/components/GenerateLink";
import { useTimeFrame } from "@/context/TimeFrameContext";
import { Session } from "next-auth";
import { SurveyData } from "@/app/actions/surveyActions";
import { motion } from "framer-motion";
import { EmployeeMetrics } from "@/components/EmployeeMetrics";
import { getEmployeeRetentionData, EmployeeRetentionData } from "@/app/actions/employeeActions";

interface DashboardContentProps {
  session: Session;
  positiveMessage: string;
  getSurveyData: (timeFrame: string) => Promise<SurveyData>;
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
  const [employeeData, setEmployeeData] = useState<EmployeeRetentionData | null>(null);
  const [employeeDataLoading, setEmployeeDataLoading] = useState(true);

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

  useEffect(() => {
    async function fetchEmployeeData() {
      setEmployeeDataLoading(true);
      try {
        const currentYear = new Date().getFullYear();
        const data = await getEmployeeRetentionData(currentYear);
        setEmployeeData(data);
      } catch (err) {
        console.error("Error fetching employee data:", err);
      } finally {
        setEmployeeDataLoading(false);
      }
    }

    fetchEmployeeData();
  }, []);

  const handleEmployeeDataSync = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const data = await getEmployeeRetentionData(currentYear);
      setEmployeeData(data);
    } catch (err) {
      console.error("Error refreshing employee data:", err);
    }
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
          <p className="text-center py-8">No data available</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full flex items-center justify-center">
      <div className="w-full max-w-5xl px-4 md:px-8 py-6 md:py-12 gap-2 md:gap-4 flex flex-col">
        <motion.div
          className="flex flex-col md:flex-row md:justify-between items-center mb-0 md:mb-4"
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
            <TimeFrameSelector />
          </div>
        </motion.div>

        <SummaryMetrics
          avgSatisfaction={surveyData.avgSatisfaction}
          avgCommunication={surveyData.avgCommunication}
          timeframeNps={surveyData.timeframeNps}
        />

        <NPSTrendChart trendData={surveyData.trendData} timeFrame={timeFrame} />

        {/* Employee Retention Section */}
        <motion.div 
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: {
              delay: 0.3,
              duration: 0.5
            }
          }}
        >
          <h2 className="text-2xl md:text-3xl mb-4">Employee Retention</h2>
          {employeeData && !employeeDataLoading ? (
            <EmployeeMetrics 
              retentionData={employeeData} 
              onSync={handleEmployeeDataSync} 
            />
          ) : (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
        </motion.div>

        <div className="mt-8 flex flex-col md:flex-row md:justify-between">
          <h2 className="text-2xl md:text-3xl">Feedback svar</h2>
          <GenerateLink />
        </div>
        <SurveyResponsesList responses={surveyData.responses} />
      </div>
    </section>
  );
}
