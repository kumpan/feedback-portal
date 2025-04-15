import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const {
      linkId,
      code,
      nps,
      communication,
      expectationMet,
      potentialReferral,
      feedback,
    } = await request.json();

    let surveyResponse;
    let surveyLink;

    if (linkId) {
      surveyResponse = await prisma.surveyResponse.findUnique({
        where: { linkId },
      });
    } else if (code) {
      surveyLink = await prisma.surveyLink.findUnique({
        where: { uniqueCode: code },
        include: { response: true },
      });

      if (surveyLink && surveyLink.response) {
        surveyResponse = surveyLink.response;
      }
    }

    if (surveyResponse) {
      const updatedResponse = await prisma.surveyResponse.update({
        where: { id: surveyResponse.id },
        data: {
          nps,
          communication,
          expectationMet,
          potentialReferral,
          feedback,
          completed: true,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        surveyResponse: updatedResponse,
      });
    } else if (code) {
      if (surveyLink) {
        const newResponse = await prisma.surveyResponse.create({
          data: {
            link: {
              connect: {
                id: surveyLink.id,
              },
            },
            nps,
            communication,
            expectationMet,
            potentialReferral,
            feedback,
            completed: true,
          },
        });

        return NextResponse.json({
          success: true,
          surveyResponse: newResponse,
        });
      } else {
        const newLink = await prisma.surveyLink.create({
          data: {
            uniqueCode: code,
            clientName: "Anonymous",
            companyName: "Anonymous",
          },
        });

        const newResponse = await prisma.surveyResponse.create({
          data: {
            link: {
              connect: {
                id: newLink.id,
              },
            },
            nps,
            communication,
            expectationMet,
            potentialReferral,
            feedback,
            completed: true,
          },
        });

        return NextResponse.json({
          success: true,
          surveyResponse: newResponse,
        });
      }
    } else {
      const anonymousLink = await prisma.surveyLink.create({
        data: {
          uniqueCode: `ANON-${Date.now()}`,
          clientName: "Anonymous",
          companyName: "Anonymous",
        },
      });

      const newResponse = await prisma.surveyResponse.create({
        data: {
          link: {
            connect: {
              id: anonymousLink.id,
            },
          },
          nps,
          communication,
          expectationMet,
          potentialReferral,
          feedback,
          completed: true,
        },
      });

      return NextResponse.json({ success: true, surveyResponse: newResponse });
    }
  } catch (error) {
    console.error("Error submitting survey response:", error);
    return NextResponse.json(
      { error: "Failed to submit survey response" },
      { status: 500 }
    );
  }
}
