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

interface DashboardContentProps {
  session: Session;
  positiveMessage: string;
  getSurveyData: (timeFrame: string) => Promise<SurveyData>;
}

export function DashboardContent({ 
  session, 
  positiveMessage,
  getSurveyData
}: DashboardContentProps) {
  const { timeFrame } = useTimeFrame();
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const data = await getSurveyData(timeFrame);
        setSurveyData(data);
      } catch (err) {
        console.error("Error fetching survey data:", err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timeFrame, getSurveyData]);

  if (loading && !surveyData) {
    return (
      <section className="w-full flex items-center justify-center">
        <div className="w-full max-w-5xl px-4 md:px-8 py-6 md:py-12 gap-2 md:gap-4 flex flex-col">
          <div className="flex flex-col md:flex-row md:justify-between items-center mb-0 md:mb-4">
            <div className="flex w-full justify-between flex-col md:flex-row gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl">
                  <span>Hallå där</span>
                  {session.user?.name && (
                    <span>, {session.user.name.split(" ")[0]} </span>
                  )}
                  <span>👋</span>
                </h1>
                <p className="text-lg max-w-lg leading-snug mt-2">
                  {positiveMessage}
                </p>
              </div>
              <TimeFrameSelector />
            </div>
          </div>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full flex items-center justify-center">
        <div className="w-full max-w-5xl px-4 md:px-8 py-6 md:py-12 gap-2 md:gap-4 flex flex-col">
          <div className="flex flex-col md:flex-row md:justify-between items-center mb-0 md:mb-4">
            <div className="flex w-full justify-between flex-col md:flex-row gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl">
                  <span>Hallå där</span>
                  {session.user?.name && (
                    <span>, {session.user.name.split(" ")[0]} </span>
                  )}
                  <span>👋</span>
                </h1>
                <p className="text-lg max-w-lg leading-snug mt-2">
                  {positiveMessage}
                </p>
              </div>
              <TimeFrameSelector />
            </div>
          </div>
          <p className="text-center py-8 text-red-500">Error: {error.message}</p>
        </div>
      </section>
    );
  }

  if (!surveyData) {
    return (
      <section className="w-full flex items-center justify-center">
        <div className="w-full max-w-5xl px-4 md:px-8 py-6 md:py-12 gap-2 md:gap-4 flex flex-col">
          <div className="flex flex-col md:flex-row md:justify-between items-center mb-0 md:mb-4">
            <div className="flex w-full justify-between flex-col md:flex-row gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl">
                  <span>Hallå där</span>
                  {session.user?.name && (
                    <span>, {session.user.name.split(" ")[0]} </span>
                  )}
                  <span>👋</span>
                </h1>
                <p className="text-lg max-w-lg leading-snug mt-2">
                  {positiveMessage}
                </p>
              </div>
              <TimeFrameSelector />
            </div>
          </div>
          <p className="text-center py-8">No data available</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full flex items-center justify-center">
      <div className="w-full max-w-5xl px-4 md:px-8 py-6 md:py-12 gap-2 md:gap-4 flex flex-col">
        <div className="flex flex-col md:flex-row md:justify-between items-center mb-0 md:mb-4">
          <div className="flex w-full justify-between flex-col md:flex-row gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl">
                <span>Hallå där</span>
                {session.user?.name && (
                  <span>, {session.user.name.split(" ")[0]} </span>
                )}
                <span>👋</span>
              </h1>
              <p className="text-lg max-w-lg leading-snug mt-2">
                {positiveMessage}
              </p>
            </div>
            <TimeFrameSelector />
          </div>
        </div>

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
      </div>
    </section>
  );
}
