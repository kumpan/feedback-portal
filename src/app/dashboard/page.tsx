import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { TimeFrameSelector } from "@/components/TimeFrameSelector";
import { Button } from "@/components/ui/button";
import { NPSTrendChart } from "@/components/NPSTrendChart";

interface SurveyResponse {
  id: number;
  nps: number;
  satisfaction: number;
  communication: number;
  whatWeDidWell: string | null;
  whatWeCanImprove: string | null;
  createdAt: Date;
}

const industryBenchmarks = {
  industryAvg: 43,
  industryMedian: 50,
  topQuartile: 73,
  bottomQuartile: 19,
};

function calculateNPS(scores: number[]): number {
  if (scores.length === 0) return 0;

  const promoters = scores.filter((score) => score >= 9).length;
  const detractors = scores.filter((score) => score <= 6).length;

  const promoterPercentage = (promoters / scores.length) * 100;
  const detractorPercentage = (detractors / scores.length) * 100;

  return Math.round(promoterPercentage - detractorPercentage);
}

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
}

async function getSurveyData(timeFrame: string): Promise<SurveyData> {
  const now = new Date();
  let startDate: Date;

  switch (timeFrame) {
    case "last7days":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "last30days":
      startDate = new Date(now.setDate(now.getDate() - 30));
      break;
    case "all":
    default:
      startDate = new Date(0);
      break;
  }

  const timeframeResponses: SurveyResponse[] =
    await prisma.surveyResponse.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

  const totalResponses = timeframeResponses.length;

  const npsScores = timeframeResponses.map((r) => r.nps);
  const timeframeNps = calculateNPS(npsScores);

  const latestResponse =
    timeframeResponses.length > 0
      ? timeframeResponses[timeframeResponses.length - 1]
      : null;
  const latestNps = latestResponse ? latestResponse.nps : 0;

  const avgSatisfaction =
    totalResponses > 0
      ? parseFloat(
          (
            timeframeResponses.reduce((sum, r) => sum + r.satisfaction, 0) /
            totalResponses
          ).toFixed(2)
        )
      : 0;

  const avgCommunication =
    totalResponses > 0
      ? parseFloat(
          (
            timeframeResponses.reduce((sum, r) => sum + r.communication, 0) /
            totalResponses
          ).toFixed(2)
        )
      : 0;

  const dailyData = new Map<
    string,
    {
      npsScores: number[];
      satisfaction: number;
      communication: number;
      count: number;
    }
  >();

  timeframeResponses.forEach((r: SurveyResponse) => {
    const date = r.createdAt.toISOString().split("T")[0];
    const entry = dailyData.get(date) || {
      npsScores: [],
      satisfaction: 0,
      communication: 0,
      count: 0,
    };
    entry.npsScores.push(r.nps);
    entry.satisfaction += r.satisfaction;
    entry.communication += r.communication;
    entry.count += 1;
    dailyData.set(date, entry);
  });

  const trendData = Array.from(dailyData.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, data]) => ({
      date,

      nps: calculateNPS(data.npsScores),
      satisfaction:
        data.count > 0
          ? Math.round((data.satisfaction / data.count) * 10) / 10
          : 0,
      communication:
        data.count > 0
          ? Math.round((data.communication / data.count) * 10) / 10
          : 0,
    }));

  return {
    timeframeNps,
    latestNps,
    avgSatisfaction,
    avgCommunication,
    trendData,
    totalResponses,
    timeframeName: timeFrame,
  };
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: { time?: string };
}) {
  const timeFrame = searchParams.time || "last30days";
  const {
    timeframeNps,
    latestNps,
    avgSatisfaction,
    avgCommunication,
    trendData,
    totalResponses,
  } = await getSurveyData(timeFrame);

  const timeFrameDisplay =
    {
      last7days: "Last 7 Days",
      last30days: "Last 30 Days",
      all: "All Time",
    }[timeFrame] || "Last 30 Days";

  return (
    <main className="min-h-screen flex items-center justify-center">
      <section className="flex flex-col items-center justify-between">
        <div className="w-full max-w-5xl px-4 md:px-8 gap-4 flex flex-col">
          <div className="w-full gap-2 flex mb-4 items-center">
            <h1 className="w-full text-2xl">Feedback overview</h1>
            <TimeFrameSelector />
            <Button>Generate Link</Button>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>NPS (-100 to +100)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {timeframeNps >= 0 ? `+${timeframeNps}` : timeframeNps}
                </p>
                <p className="text-sm text-muted-foreground">
                  {timeFrameDisplay} (baserat på {totalResponses} svar)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Nöjdhet (1-5)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{avgSatisfaction}</p>
                <p className="text-sm text-muted-foreground">
                  Genomsnitt (baserat på {totalResponses} svar)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Kommunikation (1-5)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{avgCommunication}</p>
                <p className="text-sm text-muted-foreground">
                  Genomsnitt (baserat på {totalResponses} svar)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* NPS Trend Chart */}
          <div className="w-full">
            <NPSTrendChart
              trendData={trendData}
              avgNps={timeframeNps}
              latestNps={latestNps}
              totalResponses={totalResponses}
              timeFrame={timeFrame}
              industryData={industryBenchmarks}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
