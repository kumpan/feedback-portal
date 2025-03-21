import { getRandomPositiveMessage } from "@/app/utils/positiveMessages";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { TimeFrameProvider } from "@/context/TimeFrameContext";
import { DashboardContent } from "@/app/dashboard/DashboardContent";
import { getSurveyData } from "@/app/actions/surveyActions";
import { ProfileImage } from "@/components/ProfileImage";
import Logo from "@/components/logo";

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
    <main className="w-full min-h-screen bg-background">
      <div className="flex items-center justify-center border-b">
        <div className="w-full max-w-5xl px-4 md:px-8 flex justify-between gap-4 py-4">
          <Logo className="h-12" />
          <div className="flex items-center gap-2">
            {session.user.image && (
              <ProfileImage
                src={highResImage}
                alt={session?.user?.name ?? "User profile picture"}
              />
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
