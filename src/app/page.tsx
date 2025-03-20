"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [surveyLink, setSurveyLink] = useState<any>(null);
  const [formData, setFormData] = useState({
    nps: "",
    satisfaction: "",
    communication: "",
    whatWeDidWell: "",
    whatWeCanImprove: "",
  });

  useEffect(() => {
    const storedCode = localStorage.getItem("surveyCode");

    if (code) {
      localStorage.setItem("surveyCode", code);

      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      fetchSurveyLink(code);
    } else if (storedCode) {
      fetchSurveyLink(storedCode);
    } else {
      setIsLoading(false);
    }
  }, [code]);

  const fetchSurveyLink = async (codeToFetch: string) => {
    try {
      const response = await fetch(`/api/survey-links?code=${codeToFetch}`);
      if (!response.ok) {
        throw new Error("Invalid survey link");
      }

      const data = await response.json();
      setSurveyLink(data.surveyLink);

      if (data.surveyLink.response?.completed) {
        setError(
          "You have already submitted this survey. You can update your responses if you wish."
        );
      }
    } catch (err) {
      setError("The survey link is invalid or has expired");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const storedCode = localStorage.getItem("surveyCode");
      let linkId = surveyLink?.id;

      if (surveyLink && surveyLink.id) {
        linkId = surveyLink.id;
      }

      const response = await fetch("/api/survey-responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          linkId,
          code: storedCode,
          nps: parseInt(formData.nps),
          satisfaction: parseInt(formData.satisfaction),
          communication: parseInt(formData.communication),
          whatWeDidWell: formData.whatWeDidWell,
          whatWeCanImprove: formData.whatWeCanImprove,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit survey");
      }

      router.push("/tack");
    } catch (err) {
      setError("An error occurred while submitting the survey");
      console.error(err);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading survey...</p>
      </main>
    );
  }

  if (error && error.includes("invalid or has expired")) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h1 className="text-2xl mb-4">Error</h1>
          <p className="mb-4">{error}</p>
          <Button onClick={() => router.push("/")}>Return Home</Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <section className="w-full flex items-center justify-center">
        <div className="flex max-w-3xl flex-col w-full px-4 md:px-8">
          <h1 className="text-2xl mb-4">Kumpan survey</h1>
          {surveyLink && (
            <div className="mb-4">
              <p className="text-lg">
                Hello {surveyLink.clientName} from {surveyLink.companyName}! We
                appreciate your feedback.
              </p>
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded">
              <p>{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                      checked={formData.nps === i.toString()}
                      onChange={handleInputChange}
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
                    className="flex flex-col justify-center items-center w-full py-2 rounded bg-indigo-200 hover:bg-indigo-300 active:bg-indigo-400 cursor-pointer has-[:checked]:bg-indigo-900 has-[:checked]:text-indigo-100 transition-colors"
                  >
                    <input
                      type="radio"
                      name="satisfaction"
                      value={i + 1}
                      id={`sat-${i + 1}`}
                      className="sr-only"
                      required
                      checked={formData.satisfaction === (i + 1).toString()}
                      onChange={handleInputChange}
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
                    className="flex flex-col justify-center items-center w-full py-2 rounded bg-indigo-200 hover:bg-indigo-300 active:bg-indigo-400 cursor-pointer has-[:checked]:bg-indigo-900 has-[:checked]:text-indigo-100 transition-colors"
                  >
                    <input
                      type="radio"
                      name="communication"
                      value={i + 1}
                      id={`com-${i + 1}`}
                      className="sr-only"
                      required
                      checked={formData.communication === (i + 1).toString()}
                      onChange={handleInputChange}
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
              <Textarea
                name="whatWeDidWell"
                placeholder="Skriv ditt svar..."
                value={formData.whatWeDidWell}
                onChange={handleInputChange}
              />
            </Card>

            {/* What We Can Improve (Text) */}
            <Card className="px-4 md:px-8 py-4 md:py-8">
              <h2 className="text-xl mb-4 md:text-2xl">
                Vad kan vi göra bättre?
              </h2>
              <Textarea
                name="whatWeCanImprove"
                placeholder="Skriv ditt svar..."
                value={formData.whatWeCanImprove}
                onChange={handleInputChange}
              />
            </Card>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Skickar..." : "Skicka"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
