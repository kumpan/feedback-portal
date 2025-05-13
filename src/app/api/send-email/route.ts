import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { EmailTemplate } from "@/components/emails/SurveyLinkEmail";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { clientName, companyName, clientEmail, surveyUrl } =
      await request.json();

    const session = await getServerSession(authOptions);

    if (!clientName || !companyName || !clientEmail || !surveyUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const senderName = session?.user?.name || "Kumpan Feedback";
    const senderEmail = process.env.RESEND_FROM_EMAIL || "info@kumpan.se";

    const { data, error } = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: [clientEmail],
      subject: `Hej ${clientName} 👋, kan du hjälpa oss bli bättre?`,
      react: EmailTemplate({
        clientName,
        companyName,
        surveyUrl,
        senderName: session?.user?.name || "Kumpan",
      }),
    });

    if (error) {
      console.error("Error sending email:", error);

      let errorMessage = "Gick inte att skicka e-post";

      if (typeof error === "object" && error !== null) {
        const errorStr = JSON.stringify(error);

        if (errorStr.includes("API key")) {
          errorMessage = "Saknar API-nyckel för Resend";
        } else if (errorStr.includes("from") || errorStr.includes("sender")) {
          errorMessage = "Ogiltig avsändaradress";
        } else if (errorStr.includes("to") || errorStr.includes("recipient")) {
          errorMessage = "Ogiltig mottagaradress";
        } else if (errorStr.includes("rate limit")) {
          errorMessage = "För många förfrågningar till e-posttjänsten";
        } else if (
          errorStr.includes("network") ||
          errorStr.includes("connect")
        ) {
          errorMessage = "Nätverksfel vid anslutning till e-posttjänsten";
        }
      }

      return NextResponse.json(
        { error: errorMessage, details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    // Provide more specific error messages based on the error type
    let errorMessage = "Gick inte att skicka e-post";

    if (error instanceof Error) {
      const message = error.message;

      if (message.includes("API key")) {
        errorMessage = "Saknar API-nyckel för Resend";
      } else if (message.includes("from") || message.includes("sender")) {
        errorMessage = "Ogiltig avsändaradress";
      } else if (message.includes("to") || message.includes("recipient")) {
        errorMessage = "Ogiltig mottagaradress";
      } else if (message.includes("network") || message.includes("connect")) {
        errorMessage = "Nätverksfel vid anslutning till e-posttjänsten";
      } else {
        errorMessage = message;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
