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
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession();

  if (!session || !session.user) {
    redirect("/auth/signin");
  }

  const highResImage =
    session?.user?.image?.replace(/=s\d+-c$/, "=s400-c") || "";

  const resolvedParams = await searchParams;
  const timeFrame = (resolvedParams.timeframe as string) || "last30days";
  const surveyData = await getSurveyData(timeFrame);

  return (
    <main className="w-full bg-primary-90">
      <div className="flex items-center justify-center border-b">
        <div className="w-full max-w-5xl px-4 md:px-8 flex justify-between gap-4 py-4">
          <div className="h-16 w-16 bg-primary-20 rounded-xl flex items-center justify-center" />
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <p className="font-medium text-lg">{session.user.name}</p>
              <p className="text-sm opacity-70">
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
          <div className="flex flex-col md:flex-row md:justify-between items-center mb-4">
            <div className="flex w-full justify-between flex-col md:flex-row gap-3">
              <h1 className="text-4xl md:text-5xl">
                <span>Hallå där</span>
                {session.user.name && (
                  <span>, {session.user.name.split(" ")[0]} </span>
                )}
                <span>👋</span>
              </h1>
              <div className="flex gap-2">
                <TimeFrameSelector />
                <GenerateLink />
              </div>
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

          <SurveyResponsesList responses={surveyData.responses} />
        </div>
      </section>
    </main>
  );
}
