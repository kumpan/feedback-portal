// app/api/survey-results/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const timeframe = searchParams.get("timeframe") || "30d";

  try {
    let dateFilter = {};

    // Set date filter based on timeframe
    if (timeframe !== "all") {
      const days = parseInt(timeframe.replace("d", ""));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      dateFilter = {
        createdAt: {
          gte: startDate,
        },
      };
    }

    const surveyResponses = await prisma.surveyResponse.findMany({
      where: dateFilter,
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(surveyResponses);
  } catch (error) {
    console.error("Error fetching survey data:", error);
    return NextResponse.json(
      { error: "Failed to fetch survey data" },
      { status: 500 }
    );
  }
}
