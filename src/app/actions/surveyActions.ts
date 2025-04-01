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
    uniqueCode?: string;
    createdBy?: {
      name: string | null;
      image: string | null;
      email: string | null;
    } | null;
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
      link: {
        include: {
          createdBy: {
            select: {
              name: true,
              image: true,
              email: true
            }
          }
        }
      },
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
    clientName: response.link?.clientName || "Anonymous",
    companyName: response.link?.companyName || "Unknown",
    uniqueCode: response.link?.uniqueCode,
    createdBy: response.link?.createdBy || null
  }));

  const processedData = processSurveyData(timeframeResponses);

  return {
    ...processedData,
    timeframeName: timeFrame,
    responses,
  };
}
