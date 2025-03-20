import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function generateUniqueCode(length = 6) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { clientName, companyName } = await request.json();

    if (!clientName || !companyName) {
      return NextResponse.json(
        { error: "Client name and company name are required" },
        { status: 400 }
      );
    }

    const uniqueCode = generateUniqueCode();

    const surveyLink = await prisma.surveyLink.create({
      data: {
        uniqueCode,
        clientName,
        companyName,
        response: {
          create: {
            completed: false,
          },
        },
      },
      include: {
        response: true,
      },
    });

    const surveyUrl = `${request.nextUrl.origin}/?code=${uniqueCode}`;

    return NextResponse.json({ surveyLink, surveyUrl });
  } catch (error) {
    console.error("Error creating survey link:", error);
    return NextResponse.json(
      { error: "Failed to create survey link" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Survey code is required" },
        { status: 400 }
      );
    }

    const surveyLink = await prisma.surveyLink.findUnique({
      where: { uniqueCode: code },
      include: { response: true },
    });

    if (!surveyLink) {
      return NextResponse.json(
        { error: "Survey link not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ surveyLink });
  } catch (error) {
    console.error("Error fetching survey link:", error);
    return NextResponse.json(
      { error: "Failed to fetch survey link" },
      { status: 500 }
    );
  }
}
