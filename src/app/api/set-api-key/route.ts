import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    process.env.HAILEY_HR_API_KEY = apiKey;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting API key:", error);
    return NextResponse.json(
      { error: "Failed to set API key" },
      { status: 500 }
    );
  }
}
