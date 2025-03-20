import { prisma } from "@/lib/prisma";
import { TimeFrameSelector } from "@/components/TimeFrameSelector";
import { NPSTrendChart } from "@/components/NPSTrendChart";
import { SummaryMetrics } from "@/components/SummaryMetrics";
import SurveyResponsesList from "@/components/SurveyResponsesList";
import {
  getTimeFrameStartDate,
  processSurveyData,
} from "@/app/utils/surveyUtils";
import GenerateLink from "@/components/GenerateLink";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import Image from "next/image";

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

const positiveTraits = [
  "Awesome human",
  "Kind soul",
  "Brilliant mind",
  "Inspiring person",
  "Wonderful friend",
  "Creative genius",
  "Amazing leader",
  "Joyful spirit",
  "Caring heart",
  "Fantastic teammate",
  "Radiant personality",
  "Fearless innovator",
  "Dedicated doer",
  "Bright star",
  "Great friend",
  "Talented creator",
  "Strong supporter",
  "Charming soul",
  "Loving presence",
  "Bold visionary",
  "Sweet encourager",
  "Determined achiever",
  "Happy helper",
  "Cheerful companion",
  "Inventive spirit",
  "Generous heart",
];

export default async function Dashboard({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await getServerSession();

  if (!session || !session.user) {
    redirect("/auth/signin");
  }

  const highResImage =
    session?.user?.image?.replace(/=s\d+-c$/, "=s400-c") || "";

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
      <div className="flex items-center justify-center">
        <div className="w-full max-w-5xl px-4 md:px-8 flex justify-between gap-4 py-4">
          <div className="h-16 w-16 bg-indigo-500 flex items-center justify-center">
            logo
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <p className="font-medium text-lg">{session.user.name}</p>
              <p className="text-sm text-gray-500">
                {
                  positiveTraits[
                    Math.floor(Math.random() * positiveTraits.length)
                  ]
                }
              </p>
            </div>
            {session.user.image && (
              <div className="h-12 w-12 overflow-hidden rounded-full border">
                <Image
                  src={highResImage}
                  alt={session?.user?.name ?? "User profile picture"}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <section className="w-full flex items-center justify-center">
        <div className="w-full max-w-5xl px-4 md:px-8 py-6 md:py-12 gap-2 md:gap-4 flex flex-col">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-2 md:gap-4">
              <h1 className="text-2xl md:text-4xl font-bold">Dashboard</h1>
              <div className="flex gap-2 md:gap-4">
                <GenerateLink />
                <TimeFrameSelector />
              </div>
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
