'use server';

import { prisma } from "@/lib/prisma";
import { getTimeFrameStartDate, processSurveyData } from "@/app/utils/surveyUtils";

export interface SurveyData {
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

export async function getSurveyData(timeFrame: string): Promise<SurveyData> {
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
