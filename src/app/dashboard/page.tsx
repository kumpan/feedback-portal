import { prisma } from "@/lib/prisma";
import { TimeFrameSelector } from "@/components/TimeFrameSelector";
import { NPSTrendChart } from "@/components/NPSTrendChart";
import { SummaryMetrics } from "@/components/SummaryMetrics";
import SurveyResponsesList from "@/components/SurveyResponsesList";
import {
  SurveyResponse,
  industryBenchmarks,
  getTimeFrameStartDate,
  processSurveyData,
} from "@/app/utils/surveyUtils";
import GenerateLink from "@/components/GenerateLink";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";

interface SurveyData {
  timeframeNps: number;
  latestNps: number;
  avgSatisfaction: number;
  avgCommunication: number;
  trendData: Array<{
    date: string;
    nps: number;
    satisfaction: number;
    communication: number;
  }>;
  totalResponses: number;
  timeframeName: string;
  responses: Array<{
    id: number;
    nps: number | null;
    satisfaction: number | null;
    communication: number | null;
    whatWeDidWell: string | null;
    whatWeCanImprove: string | null;
    completed: boolean;
    createdAt: Date;
    clientName: string;
    companyName: string;
  }>;
}

async function getSurveyData(timeFrame: string): Promise<SurveyData> {
  const startDate = getTimeFrameStartDate(timeFrame);

  const timeframeResponses = await prisma.surveyResponse.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    include: {
      link: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const responses = timeframeResponses.map((response) => ({
    id: response.id,
    nps: response.nps,
    satisfaction: response.satisfaction,
    communication: response.communication,
    whatWeDidWell: response.whatWeDidWell,
    whatWeCanImprove: response.whatWeCanImprove,
    completed: response.completed,
    createdAt: response.createdAt,
    clientName: response.link.clientName,
    companyName: response.link.companyName,
  }));

  const processedData = processSurveyData(timeframeResponses);

  return {
    ...processedData,
    timeframeName: timeFrame,
    responses,
  };
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await getServerSession();

  if (!session || !session.user) {
    redirect("/auth/signin");
  }

  const timeFrame = (searchParams.timeframe as string) || "last30days";
  const surveyData = await getSurveyData(timeFrame);

  const timeFrameDisplay =
    {
      last7days: "Last 7 Days",
      last30days: "Last 30 Days",
      all: "All Time",
    }[timeFrame] || "Last 30 Days";

  return (
    <main className="w-full">
      <section className="w-full flex min-h-svh items-center justify-center">
        <div className="w-full max-w-5xl px-4 md:px-8 gap-4 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="flex gap-4 items-center">
              <p className="text-sm mr-2">Signed in as: {session.user.email}</p>
              <SignOutButton />
              <TimeFrameSelector />
              <GenerateLink />
            </div>
          </div>

          <SummaryMetrics
            avgSatisfaction={surveyData.avgSatisfaction}
            avgCommunication={surveyData.avgCommunication}
            totalResponses={surveyData.totalResponses}
            timeframeNps={surveyData.timeframeNps}
            timeFrameDisplay={timeFrameDisplay}
          />

          <NPSTrendChart
            trendData={surveyData.trendData}
            avgNps={surveyData.timeframeNps}
            latestNps={surveyData.latestNps}
            totalResponses={surveyData.totalResponses}
            timeFrame={timeFrame}
          />

          <SurveyResponsesList responses={surveyData.responses} />
        </div>
      </section>
    </main>
  );
}
