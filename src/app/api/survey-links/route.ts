import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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
    const { clientName, companyName, clientEmail } = await request.json();

    const session = await getServerSession(authOptions);

    if (!clientName || !companyName) {
      return NextResponse.json(
        { error: "Client name and company name are required" },
        { status: 400 }
      );
    }

    const uniqueCode = generateUniqueCode();

    const createData: {
      uniqueCode: string;
      clientName: string;
      companyName: string;
      clientEmail?: string;
      response: {
        create: {
          completed: boolean;
        };
      };
      createdById?: string;
    } = {
      uniqueCode,
      clientName,
      companyName,
      response: {
        create: {
          completed: false,
        },
      },
    };
    
    if (clientEmail) {
      createData.clientEmail = clientEmail;
    }

    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (user) {
        createData.createdById = session.user.id;
      } else {
        console.warn(`User with ID ${session.user.id} not found in database`);
      }
    } else {
      console.warn("No user session found when creating survey link");
    }

    const surveyLink = await prisma.surveyLink.create({
      data: createData,
      include: {
        response: true,
        createdBy: true,
      },
    });

    const surveyUrl = `${request.nextUrl.origin}/?code=${surveyLink.uniqueCode}`;

    return NextResponse.json({ surveyLink, surveyUrl });
  } catch (error: unknown) {
    console.error("Error creating survey link:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to create survey link",
        details: errorMessage,
      },
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
      include: {
        response: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
      },
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
