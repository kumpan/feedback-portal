import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

async function submitSurvey(data: FormData) {
  "use server";

  const nps = data.get("nps")?.toString();
  const satisfaction = data.get("satisfaction")?.toString();
  const communication = data.get("communication")?.toString();
  const whatWeDidWell = data.get("whatWeDidWell")?.toString() || "";
  const whatWeCanImprove = data.get("whatWeCanImprove")?.toString() || "";

  if (!nps || !satisfaction || !communication) {
    throw new Error("Please fill out all rating questions.");
  }

  const surveyData: Prisma.SurveyResponseCreateInput = {
    nps: parseInt(nps),
    satisfaction: parseInt(satisfaction),
    communication: parseInt(communication),
    whatWeDidWell,
    whatWeCanImprove,
  };

  await prisma.surveyResponse.create({
    data: surveyData,
  });

  revalidatePath("/dashboard");
  redirect("/tack");
}

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <section className="w-full flex items-center justify-center">
        <div className="flex max-w-3xl flex-col w-full px-4 md:px-8">
          <h1 className="text-2xl mb-4">Kumpan survey</h1>
          <form action={submitSurvey} className="space-y-4">
            {/* NPS Question (0-10) */}
            <Card className="px-4 md:px-8 py-4 md:py-8">
              <h2 className="text-xl mb-4 md:text-2xl">
                Hur troligt är det att du rekommenderar oss?
              </h2>
              <div className="flex gap-1">
                {Array.from({ length: 11 }, (_, i) => (
                  <label
                    key={i}
                    htmlFor={`nps-${i}`}
                    className="flex flex-col justify-center items-center w-full py-2 rounded bg-indigo-200 hover:bg-indigo-300 active:bg-indigo-400 cursor-pointer has-[:checked]:bg-indigo-900 has-[:checked]:text-indigo-100 transition-colors"
                  >
                    <input
                      type="radio"
                      name="nps"
                      value={i}
                      id={`nps-${i}`}
                      className="sr-only"
                      required
                    />
                    <p className="text-lg md:text-xl">{i}</p>
                  </label>
                ))}
              </div>

              <div className="flex justify-between w-full opacity-70">
                <p className="text-sm">Inte alls troligt</p>
                <p className="text-sm">Väldigt troligt</p>
              </div>
            </Card>

            {/* Satisfaction Question (1-5) */}
            <Card className="px-4 md:px-8 py-4 md:py-8">
              <h2 className="text-xl mb-4 md:text-2xl">
                Hur nöjd är du med våra tjänster överlag?
              </h2>

              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <label
                    key={i + 1}
                    htmlFor={`sat-${i + 1}`}
                    className="flex flex-col justify-center items-center w-full py-2 px-4 rounded bg-indigo-200 hover:bg-indigo-300 active:bg-indigo-400 cursor-pointer has-[:checked]:bg-indigo-900 has-[:checked]:text-indigo-100 transition-colors"
                  >
                    <input
                      type="radio"
                      name="satisfaction"
                      value={i + 1}
                      id={`sat-${i + 1}`}
                      className="sr-only"
                      required
                    />
                    <p className="text-lg md:text-xl">{i + 1}</p>
                  </label>
                ))}
              </div>

              <div className="flex justify-between w-full opacity-70">
                <p className="text-sm">Mycket missnöjd</p>
                <p className="text-sm">Mycket nöjd</p>
              </div>
            </Card>

            {/* Communication Question (1-5) */}
            <Card className="px-4 md:px-8 py-4 md:py-8">
              <h2 className="text-xl mb-4 md:text-2xl">
                Hur skulle du bedöma vår kommunikation genom projektet?
              </h2>

              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <label
                    key={i + 1}
                    htmlFor={`com-${i + 1}`}
                    className="flex flex-col justify-center items-center w-full py-2 px-4 rounded bg-indigo-200 hover:bg-indigo-300 active:bg-indigo-400 cursor-pointer has-[:checked]:bg-indigo-900 has-[:checked]:text-indigo-100 transition-colors"
                  >
                    <input
                      type="radio"
                      name="communication"
                      value={i + 1}
                      id={`com-${i + 1}`}
                      className="sr-only"
                      required
                    />
                    <p className="text-lg md:text-xl">{i + 1}</p>
                  </label>
                ))}
              </div>

              <div className="flex justify-between w-full opacity-70">
                <p className="text-sm">Mycket missnöjd</p>
                <p className="text-sm">Mycket nöjd</p>
              </div>
            </Card>

            {/* What We Did Well (Text) */}
            <Card className="px-4 md:px-8 py-4 md:py-8">
              <h2 className="text-xl mb-4 md:text-2xl">Vad gjorde vi bra?</h2>
              <Textarea name="whatWeDidWell" placeholder="Skriv ditt svar..." />
            </Card>

            {/* What We Can Improve (Text) */}
            <Card className="px-4 md:px-8 py-4 md:py-8">
              <h2 className="text-xl mb-4 md:text-2xl">
                Vad kan vi göra bättre?
              </h2>
              <Textarea
                name="whatWeCanImprove"
                placeholder="Skriv ditt svar..."
              />
            </Card>

            <Button type="submit" className="w-full" size="lg">
              Skicka
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
