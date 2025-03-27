"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [surveyLink, setSurveyLink] = useState<{
    id: string;
    uniqueCode: string;
    clientName: string;
    companyName: string;
    createdAt: string;
  } | null>(null);
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
    return <></>;
  }

  if (error && error.includes("invalid or has expired")) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h1 className="text-2xl mb-4">Error</h1>
          <p className="mb-4">{error}</p>
          <Button onClick={() => router.push("/")}>Gå tillbaka</Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <section className="w-full flex items-center justify-center">
        <div className="flex max-w-3xl flex-col w-full px-4 md:px-8 py-12 md:py-16">
          <div className="space-y-2 max-w-lg">
            <h1 className="text-4xl md:text-5xl">
              Hej {surveyLink?.clientName ? ` ${surveyLink.clientName}` : ""}
              <motion.span
                className="inline-block cursor-grab ml-2"
                initial={{ rotate: 0 }}
                animate={{
                  rotate: [0, 15, -15, 15, 0],
                  transition: {
                    duration: 1.5,
                    ease: "easeInOut",
                    times: [0, 0.2, 0.5, 0.8, 1],
                    repeat: 0,
                    delay: 0.1,
                  },
                }}
                whileHover={{
                  scale: 1.2,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  },
                }}
              >
                👋
              </motion.span>
            </h1>
            <p className="text-lg leading-snug">
              På Kumpan strävar vi alltid efter att bli bättre, så dela gärna
              med dig av din upplevelse när vi nyligen arbetade tillsammans.
            </p>
          </div>

          {/* Divider */}
          <div className="h-0.5 w-full bg-border/10 my-8 rounded-full" />

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NPS Question (0-10) */}
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-xl mb-4 md:text-2xl">
                  Hur troligt är det att du rekommenderar oss?
                </h2>
                <div className="flex gap-1">
                  {Array.from({ length: 11 }, (_, i) => (
                    <motion.div
                      className="w-full"
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: 0.1 + i * 0.03,
                        ease: "easeOut",
                      }}
                    >
                      <label
                        htmlFor={`nps-${i}`}
                        className="flex flex-col justify-center items-center w-full py-3 rounded bg-primary-80 hover:bg-primary-60 active:bg-primary-15 active:text-primary-90 cursor-pointer has-[:checked]:bg-primary-15 has-[:checked]:text-primary-90 transition-colors"
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
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between w-full opacity-70">
              <p className="text-sm">Inte alls troligt</p>
              <p className="text-sm">Väldigt troligt</p>
            </div>

            {/* Divider */}
            <div className="h-0.5 w-full bg-border/10 my-8 rounded-full" />

            {/* Satisfaction Question (1-5) */}
            <AnimatePresence>
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h2 className="text-xl mb-4 md:text-2xl">
                  Hur nöjd är du med våra tjänster överlag?
                </h2>

                <div className="flex gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <motion.div
                      key={i + 1}
                      className="w-full"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: 0.3 + i * 0.05,
                        ease: "easeOut",
                      }}
                    >
                      <label
                        htmlFor={`sat-${i + 1}`}
                        className="flex flex-col justify-center items-center w-full py-3 rounded bg-primary-80 hover:bg-primary-60 active:bg-primary-15 active:text-primary-90 cursor-pointer has-[:checked]:bg-primary-15 has-[:checked]:text-primary-90 transition-colors"
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
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between w-full opacity-70">
              <p className="text-sm">Mycket missnöjd</p>
              <p className="text-sm">Mycket nöjd</p>
            </div>

            {/* Divider */}
            <div className="h-0.5 w-full bg-border/10 my-8 rounded-full" />

            {/* Communication Question (1-5) */}
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h2 className="text-xl mb-4 md:text-2xl">
                  Hur skulle du bedöma vår kommunikation genom projektet?
                </h2>

                <div className="flex gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <motion.div
                      key={i + 1}
                      className="w-full"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: 0.5 + i * 0.05,
                        ease: "easeOut",
                      }}
                    >
                      <label
                        htmlFor={`com-${i + 1}`}
                        className="flex flex-col justify-center items-center w-full py-3 rounded bg-primary-80 hover:bg-primary-60 active:bg-primary-15 active:text-primary-90 cursor-pointer has-[:checked]:bg-primary-15 has-[:checked]:text-primary-90 transition-colors"
                      >
                        <input
                          type="radio"
                          name="communication"
                          value={i + 1}
                          id={`com-${i + 1}`}
                          className="sr-only"
                          required
                          checked={
                            formData.communication === (i + 1).toString()
                          }
                          onChange={handleInputChange}
                        />
                        <p className="text-lg md:text-xl">{i + 1}</p>
                      </label>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Divider */}
            <div className="h-0.5 w-full bg-border/10 my-8 rounded-full" />

            {/* What We Did Well (Text) */}
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <h2 className="text-xl mb-4 md:text-2xl">Vad gjorde vi bra?</h2>
                <Textarea
                  name="whatWeDidWell"
                  placeholder="Skriv ditt svar..."
                  value={formData.whatWeDidWell}
                  onChange={handleInputChange}
                />
              </motion.div>
            </AnimatePresence>

            {/* Divider */}
            <div className="h-0.5 w-full bg-border/10 my-8 rounded-full" />

            {/* What We Can Improve (Text) */}
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <h2 className="text-xl mb-4 md:text-2xl">
                  Vad kan vi förbättra?
                </h2>
                <Textarea
                  name="whatWeCanImprove"
                  placeholder="Skriv ditt svar..."
                  value={formData.whatWeCanImprove}
                  onChange={handleInputChange}
                />
              </motion.div>
            </AnimatePresence>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="pt-6"
            >
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? "Skickar..." : "Skicka feedback"}
              </Button>
            </motion.div>
          </form>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<></>}>
      <HomeContent />
    </Suspense>
  );
}
