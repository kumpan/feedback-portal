"use client";

import { useEffect, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  EmployeeRetentionData,
  getAllYearsEmployeeRetentionData,
} from "../actions/employeeActions";
import { SurveyData } from "../actions/surveyActions";
import { EmployeeTrendChart } from "@/components/EmployeeTrendChart";
import { EmployeeMetrics } from "@/components/EmployeeMetrics";
import SurveyResponsesList from "@/components/SurveyResponsesList";
import EmployeeDataSync from "@/components/EmployeeDataSync";
import GenerateLink from "@/components/GenerateLink";
import { NPSTrendChart } from "@/components/NPSTrendChart";
import { SummaryMetrics } from "@/components/SummaryMetrics";

interface DashboardContentProps {
  positiveMessage: string;
  getSurveyData: (timeFrame: string) => Promise<SurveyData>;
}

export function DashboardContent({
  positiveMessage,
  getSurveyData,
}: DashboardContentProps) {
  const [surveyData, setSurveyData] = useState<SurveyData>({
    timeframeNps: 0,
    latestNps: 0,
    avgSatisfaction: 0,
    avgCommunication: 0,
    trendData: [],
    totalResponses: 0,
    timeframeName: "",
    responses: [],
  });

  const [allYearsEmployeeData, setAllYearsEmployeeData] = useState<
    Record<number, EmployeeRetentionData>
  >({});
  const [employeeTrendData, setEmployeeTrendData] = useState<{
    trendData: Array<{
      date: string;
      active: number;
      joined: number;
      left: number;
      formattedDate: string;
    }>;
  } | null>(null);
  const [currentYear, setCurrentYear] = useState<number>(
    new Date().getFullYear()
  );
  const [currentEmployeeData, setCurrentEmployeeData] =
    useState<EmployeeRetentionData | null>(null);

  const [timeFrame, setTimeFrame] = useState<"month" | "quarter" | "year">(
    "year"
  );

  const fetchSurveyDataCallback = useCallback(async () => {
    try {
      const data = await getSurveyData(timeFrame);
      setSurveyData(data);
    } catch (error) {
      console.error("Error fetching survey data:", error);
    }
  }, [timeFrame, getSurveyData]);

  const fetchEmployeeData = useCallback(async () => {
    try {
      const { retentionDataByYear } = await getAllYearsEmployeeRetentionData();
      setAllYearsEmployeeData(retentionDataByYear);

      if (retentionDataByYear[currentYear]) {
        setCurrentEmployeeData(retentionDataByYear[currentYear]);
      } else {
        const years = Object.keys(retentionDataByYear).map(Number);
        if (years.length > 0) {
          const latestYear = Math.max(...years);
          setCurrentYear(latestYear);
          setCurrentEmployeeData(retentionDataByYear[latestYear]);
        }
      }

      const simplifiedTrendData = Object.values(retentionDataByYear).map(
        (yearData) => ({
          date: `${yearData.year}-01-01`,
          active: Math.round(yearData.endOfYearCount),
          joined: Math.round(
            yearData.endOfYearCount -
              yearData.startOfYearCount +
              (yearData.turnoverRate * yearData.startOfYearCount) / 100
          ),
          left: Math.round(
            (yearData.turnoverRate * yearData.startOfYearCount) / 100
          ),
          formattedDate: yearData.year.toString(),
        })
      );

      setEmployeeTrendData({ trendData: simplifiedTrendData });
    } catch (error) {
      console.error("Error fetching employee data:", error);
    }
  }, [currentYear]);

  useEffect(() => {
    fetchSurveyDataCallback();
    fetchEmployeeData();
  }, [fetchSurveyDataCallback, fetchEmployeeData]);

  useEffect(() => {
    fetchSurveyDataCallback();
  }, [fetchSurveyDataCallback]);

  const handleYearChange = (direction: "prev" | "next") => {
    const newYear = direction === "prev" ? currentYear - 1 : currentYear + 1;

    if (allYearsEmployeeData[newYear]) {
      setCurrentYear(newYear);
      setCurrentEmployeeData(allYearsEmployeeData[newYear]);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="mb-6">
        <p className="text-lg text-gray-600">{positiveMessage}</p>
      </div>
      <Tabs defaultValue="survey" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="survey">Enkäter</TabsTrigger>
          <TabsTrigger value="employees">Anställda</TabsTrigger>
        </TabsList>

        <TabsContent value="survey" className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl">Enkätresultat</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTimeFrame("month")}
                className={`px-3 py-1.5 rounded-lg ${
                  timeFrame === "month"
                    ? "bg-primary text-white"
                    : "bg-primary-95 text-primary-20"
                }`}
              >
                Månad
              </button>
              <button
                onClick={() => setTimeFrame("quarter")}
                className={`px-3 py-1.5 rounded-lg ${
                  timeFrame === "quarter"
                    ? "bg-primary text-white"
                    : "bg-primary-95 text-primary-20"
                }`}
              >
                Kvartal
              </button>
              <button
                onClick={() => setTimeFrame("year")}
                className={`px-3 py-1.5 rounded-lg ${
                  timeFrame === "year"
                    ? "bg-primary text-white"
                    : "bg-primary-95 text-primary-20"
                }`}
              >
                År
              </button>
            </div>
          </div>

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
            <div className="flex justify-between items-center">
              <h2 className="text-2xl md:text-3xl">Anställda</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleYearChange("prev")}
                  className="p-2 rounded-lg bg-primary-95 text-primary-20 hover:bg-primary-90"
                  disabled={!allYearsEmployeeData[currentYear - 1]}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-1 px-3 py-1.5 bg-primary-95 rounded-lg">
                  <Calendar className="h-4 w-4 opacity-70" />
                  <span>{currentYear}</span>
                </div>
                <button
                  onClick={() => handleYearChange("next")}
                  className="p-2 rounded-lg bg-primary-95 text-primary-20 hover:bg-primary-90"
                  disabled={!allYearsEmployeeData[currentYear + 1]}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {currentEmployeeData && (
              <EmployeeMetrics retentionData={currentEmployeeData} />
            )}
            {employeeTrendData && (
              <EmployeeTrendChart trendData={employeeTrendData.trendData} />
            )}

            <div className="flex justify-end">
              <EmployeeDataSync onSyncComplete={fetchEmployeeData} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DashboardContent;
