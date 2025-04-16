export interface SurveyResponse {
  id: number;
  nps: number | null;
  communication: number | null;
  expectationMet: boolean | null;
  potentialReferral: string | null;
  feedback: string | null;
  createdAt: Date;
  completed?: boolean;
  link?: {
    id: number;
    uniqueCode: string;
    clientName: string;
    companyName: string;
    createdAt: Date;
  };
  linkId?: number;
}

export const industryBenchmarks = {
  industryAvg: 43,
  industryMedian: 50,
  topQuartile: 73,
  bottomQuartile: 19,
};

export function calculateNPS(scores: number[]): number {
  if (scores.length === 0) return 0;

  const promoters = scores.filter((score) => score >= 9).length;
  const detractors = scores.filter((score) => score <= 6).length;

  const promoterPercentage = (promoters / scores.length) * 100;
  const detractorPercentage = (detractors / scores.length) * 100;

  return Math.round(promoterPercentage - detractorPercentage);
}

export function getTimeFrameStartDate(timeFrame: string): Date {
  const now = new Date();
  switch (timeFrame) {
    case "last7days":
      return new Date(now.setDate(now.getDate() - 7));
    case "last30days":
      return new Date(now.setDate(now.getDate() - 30));
    case "last6months":
      return new Date(now.setMonth(now.getMonth() - 6));
    case "last1year":
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case "all":
    default:
      return new Date(0);
  }
}

export function processSurveyData(responses: SurveyResponse[]) {
  const totalResponses = responses.length;

  const npsScores = responses
    .filter((r) => r.nps !== null)
    .map((r) => r.nps as number);

  const timeframeNps = calculateNPS(npsScores);

  const latestResponse =
    responses.length > 0 ? responses[responses.length - 1] : null;
  const latestNps =
    latestResponse && latestResponse.nps ? latestResponse.nps : 0;

  const validCommunicationResponses = responses.filter(
    (r) => r.communication !== null
  );
  const avgCommunication =
    validCommunicationResponses.length > 0
      ? parseFloat(
          (
            validCommunicationResponses.reduce(
              (sum, r) => sum + (r.communication as number),
              0
            ) / validCommunicationResponses.length
          ).toFixed(2)
        )
      : 0;

  const responsesWithExpectations = responses.filter(
    (r) => r.expectationMet !== null
  );
  const expectationsMetCount = responsesWithExpectations.filter(
    (r) => r.expectationMet === true
  ).length;
  const expectationsMetPercentage =
    responsesWithExpectations.length > 0
      ? parseFloat(
          (
            (expectationsMetCount / responsesWithExpectations.length) *
            100
          ).toFixed(1)
        )
      : 0;

  const dailyData = new Map<
    string,
    {
      npsScores: number[];
      communication: number;
      count: number;
    }
  >();

  responses.forEach((r: SurveyResponse) => {
    const date = r.createdAt.toISOString().split("T")[0];
    const entry = dailyData.get(date) || {
      npsScores: [],
      communication: 0,
      count: 0,
    };

    if (r.nps !== null) {
      entry.npsScores.push(r.nps);
    }

    if (r.communication !== null) {
      entry.communication += r.communication;
    }

    entry.count += 1;
    dailyData.set(date, entry);
  });

  const trendData = Array.from(dailyData.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, data]) => ({
      date,
      nps: calculateNPS(data.npsScores),
      communication:
        data.count > 0
          ? Math.round((data.communication / data.count) * 10) / 10
          : 0,
    }));

  return {
    timeframeNps,
    latestNps,
    avgCommunication,
    expectationsMetPercentage,
    trendData,
    totalResponses,
  };
}
