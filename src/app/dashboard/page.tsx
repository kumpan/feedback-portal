import { TimeFrameSelector } from "@/components/TimeFrameSelector";
import { NPSTrendChart } from "@/components/NPSTrendChart";
import { SummaryMetrics } from "@/components/SummaryMetrics";
import SurveyResponsesList from "@/components/SurveyResponsesList";
import {
  getTimeFrameStartDate,
  processSurveyData,
} from "@/app/utils/surveyUtils";
import { getRandomPositiveMessage } from "@/app/utils/positiveMessages";
import GenerateLink from "@/components/GenerateLink";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { TimeFrameProvider } from "@/context/TimeFrameContext";
import { DashboardContent } from "@/components/DashboardContent";
import { getSurveyData } from "@/app/actions/surveyActions";

import Image from "next/image";

export default async function Dashboard() {
  const session = await getServerSession();

  if (!session || !session.user) {
    redirect("/auth/signin");
  }

  const highResImage =
    session?.user?.image?.replace(/=s\d+-c$/, "=s400-c") || "";

  const firstName = session.user.name
    ? session.user.name.split(" ")[0]
    : undefined;
  const positiveMessage = getRandomPositiveMessage(firstName);

  return (
    <main className="w-full bg-background">
      <div className="flex items-center justify-center border-b">
        <div className="w-full max-w-5xl px-4 md:px-8 flex justify-between gap-4 py-4">
          <div className="h-16 w-16 bg-primary-20 rounded-xl flex items-center justify-center" />
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <p className="font-medium text-xl">{session.user.name}</p>
            </div>
            {session.user.image && (
              <div className="h-12 w-12 overflow-hidden rounded-full border">
                <Image
                  src={highResImage}
                  alt={session?.user?.name ?? "User profile picture"}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <TimeFrameProvider initialTimeFrame="last30days">
        <DashboardContent 
          session={session} 
          positiveMessage={positiveMessage} 
          getSurveyData={getSurveyData}
        />
      </TimeFrameProvider>
    </main>
  );
}
