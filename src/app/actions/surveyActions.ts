"use server";

import { prisma } from "@/lib/prisma";
import {
  getTimeFrameStartDate,
  processSurveyData,
} from "@/app/utils/surveyUtils";

export interface SurveyData {
  timeframeNps: number;
  latestNps: number;
  avgCommunication: number;
  expectationsMetPercentage: number;
  trendData: Array<{
    date: string;
    nps: number;
    communication: number;
  }>;
  totalResponses: number;
  timeframeName: string;
  responses: Array<{
    id: number;
    nps: number | null;
    communication: number | null;
    expectationMet: boolean | null;
    potentialReferral: string | null;
    feedback: string | null;
    completed: boolean;
    createdAt: Date;
    clientName: string;
    companyName: string;
    clientEmail?: string | null;
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
      link: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const linkIds = timeframeResponses.map((response) => response.link.id);
  const surveyLinks = await prisma.surveyLink.findMany({
    where: {
      id: {
        in: linkIds,
      },
    },
    include: {
      createdBy: {
        select: {
          name: true,
          image: true,
          email: true,
        },
      },
    },
  });

  const linkMap = new Map();
  surveyLinks.forEach((link) => {
    linkMap.set(link.id, link);
  });

  const responses = timeframeResponses.map((response) => {
    const linkId = response.link.id;
    const link = linkMap.get(linkId);

    return {
      id: response.id,
      nps: response.nps,
      communication: response.communication,
      expectationMet: response.expectationMet,
      potentialReferral: response.potentialReferral,
      feedback: response.feedback,
      completed: response.completed,
      createdAt: response.createdAt,
      clientName: link?.clientName || "Anonymous",
      companyName: link?.companyName || "Unknown",
      clientEmail: link?.clientEmail || null,
      uniqueCode: link?.uniqueCode,
      createdBy: link?.createdBy || null,
    };
  });

  const processedData = processSurveyData(timeframeResponses);

  return {
    ...processedData,
    timeframeName: timeFrame,
    responses,
  };
}

/**
 * Cheap change-detection signal for the dashboard's live polling.
 *
 * One aggregate query instead of refetching the whole dataset every tick — the
 * dashboard only pulls the full `getSurveyData` payload when this value moves.
 * `count` catches creates and deletes, `latestUpdate` catches a client
 * completing a survey (SurveyResponse.updatedAt is @updatedAt), and every
 * survey link creates a SurveyResponse row, so both paths are covered.
 */
export async function getSurveyDataVersion(): Promise<{
  count: number;
  latestUpdate: string | null;
}> {
  const aggregate = await prisma.surveyResponse.aggregate({
    _count: { _all: true },
    _max: { updatedAt: true },
  });

  return {
    count: aggregate._count._all,
    latestUpdate: aggregate._max.updatedAt?.toISOString() ?? null,
  };
}

export async function deleteSurveyLink(
  uniqueCode: string
): Promise<{ success: boolean; message: string }> {
  try {
    const surveyLink = await prisma.surveyLink.findUnique({
      where: { uniqueCode },
      include: {
        response: true,
      },
    });

    if (!surveyLink) {
      return { success: false, message: "Survey link not found" };
    }

    if (surveyLink.response && surveyLink.response.completed) {
      return {
        success: false,
        message: "Cannot delete survey link with completed responses",
      };
    }

    if (surveyLink.response) {
      await prisma.surveyResponse.delete({
        where: { id: surveyLink.response.id },
      });
    }

    await prisma.surveyLink.delete({
      where: { uniqueCode },
    });

    return { success: true, message: "Survey link deleted successfully" };
  } catch (error) {
    console.error("Error deleting survey link:", error);
    return { success: false, message: "Failed to delete survey link" };
  }
}
