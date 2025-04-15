"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Suspense } from "react";
import { ChevronLeft, ArrowRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const surveyCode = searchParams.get("code");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [surveyDetails, setSurveyDetails] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [inputData, setInputData] = useState({
    nps: "",
    communication: "",
    expectationMet: null as boolean | null,
    potentialReferral: "",
    feedback: "",
  });

  const extractFirstName = (fullName: string | null | undefined) => {
    if (!fullName) return "vi";
    return fullName.split(" ")[0];
  };

  const calculateTotalQuestions = () => {
    return !inputData.nps ? 4 : parseInt(inputData.nps) >= 7 ? 5 : 4;
  };

  const totalQuestions = calculateTotalQuestions();

  const handleNextQuestion = () => {
    if (questionIndex < totalQuestions - 1) {
      setQuestionIndex(questionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
    }
  };

  const validateCurrentQuestion = () => {
    return true;
  };

  useEffect(() => {
    const storedSurveyCode = localStorage.getItem("surveyCode");

    if (surveyCode) {
      localStorage.setItem("surveyCode", surveyCode);
      const updatedUrl = window.location.pathname;
      window.history.replaceState({}, document.title, updatedUrl);
      fetchSurveyDetails(surveyCode);
    } else if (storedSurveyCode) {
      fetchSurveyDetails(storedSurveyCode);
    } else {
      setLoading(false);
    }
  }, [surveyCode]);

  const fetchSurveyDetails = async (code: string) => {
    try {
      const response = await fetch(`/api/survey-links?code=${code}`);
      if (!response.ok) {
        throw new Error("Invalid survey link");
      }

      const data = await response.json();
      setSurveyDetails(data.surveyLink);

      if (data.surveyLink.response?.completed) {
        setErrorMessage(
          "You have already submitted this survey. You can update your responses if you wish."
        );
      }
    } catch (error) {
      setErrorMessage("The survey link is invalid or has expired");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    if (name === "expectationMet") {
      setInputData({
        ...inputData,
        [name]: value === "true" ? true : value === "false" ? false : null,
      });
    } else {
      setInputData({
        ...inputData,
        [name]: value,
      });
    }

    if (
      name === "nps" ||
      name === "communication" ||
      name === "expectationMet"
    ) {
      setTimeout(() => handleNextQuestion(), 500);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (questionIndex !== totalQuestions - 1) {
      handleNextQuestion();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/survey-responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          linkId: surveyDetails.id,
          nps: parseInt(inputData.nps),
          communication: parseInt(inputData.communication),
          expectationMet: inputData.expectationMet,
          potentialReferral: inputData.potentialReferral,
          feedback: inputData.feedback,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit survey");
      }

      // Set submitted state to true before redirecting
      setSubmitted(true);
      // Use setTimeout to ensure state is updated before redirect
      setTimeout(() => {
        router.push("/tack");
      }, 100);
    } catch (error) {
      console.error("Error submitting survey:", error);
      setErrorMessage(
        "Det gick inte att skicka in din feedback. Försök igen senare."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <></>;
  }

  if (errorMessage && errorMessage.includes("invalid or has expired")) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
        <div className="w-full max-w-md p-6 md:p-8">
          <h1 className="text-2xl font-medium mb-4">Ogiltig länk</h1>
          <p className="opacity-70">
            Denna länk är inte giltig eller har upphört. Kontakta den som
            skickade länken för att få en ny.
          </p>
        </div>
      </main>
    );
  }

  if (!surveyDetails) {
    router.push("/dashboard");
    return null;
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
        <div className="w-full max-w-md p-6 md:p-8">
          <h1 className="text-2xl font-medium mb-4">Tack för din feedback!</h1>
          <p className="opacity-70">
            Dina svar har skickats in. Vi uppskattar att du tog dig tid att
            svara på vår enkät.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <section className="w-full max-w-xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl mb-4">
            Hej{" "}
            {surveyDetails?.clientName ? ` ${surveyDetails.clientName}` : ""}
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
          <p className="text-lg opacity-70">
            På Kumpan strävar vi alltid efter att bli bättre, så dela gärna med
            dig av din upplevelse när du nyligen arbetade tillsammans med{" "}
            {extractFirstName(surveyDetails?.createdBy?.name)}.
          </p>
        </div>

        <div className="mb-10">
          <div className="h-2 bg-primary-80/30 rounded-full w-full">
            <motion.div
              className="h-2 bg-primary rounded-full transition-all"
              initial={{ width: 0 }}
              animate={{
                width: `${((questionIndex + 1) / totalQuestions) * 100}%`,
                transition: { duration: 0.3 },
              }}
            ></motion.div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full">
          <motion.div
            className="relative overflow-hidden"
            initial={false}
            animate={{ height: "auto" }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {questionIndex === 0 && (
                <motion.div
                  key="nps-question"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4 w-full"
                  layout
                >
                  <h2 className="text-xl mb-4 md:text-2xl">
                    Hur troligt är det att du skulle rekommendera Kumpan till en
                    vän eller kollega?
                  </h2>

                  <motion.div
                    className="flex gap-1"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.03,
                        },
                      },
                    }}
                    initial="hidden"
                    animate="visible"
                  >
                    {Array.from({ length: 11 }, (_, i) => (
                      <motion.div
                        className="w-full"
                        key={i}
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: 0.3,
                              ease: "easeOut",
                            },
                          },
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
                            checked={inputData.nps === i.toString()}
                            onChange={handleInputChange}
                          />
                          <p className="text-lg md:text-xl">{i}</p>
                        </label>
                      </motion.div>
                    ))}
                  </motion.div>

                  <div className="flex justify-between w-full opacity-70">
                    <p className="text-sm">Inte alls troligt</p>
                    <p className="text-sm">Väldigt troligt</p>
                  </div>
                </motion.div>
              )}

              {questionIndex === 1 && (
                <motion.div
                  key="communication-question"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4 w-full"
                  layout
                >
                  <h2 className="text-xl mb-4 md:text-2xl">
                    Hur skulle du bedöma{" "}
                    {extractFirstName(surveyDetails?.createdBy?.name)}{" "}
                    kommunikation genom projektet?
                  </h2>

                  <motion.div
                    className="flex gap-1"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.05,
                        },
                      },
                    }}
                    initial="hidden"
                    animate="visible"
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <motion.div
                        key={i + 1}
                        className="w-full"
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: 0.3,
                              ease: "easeOut",
                            },
                          },
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
                            checked={
                              inputData.communication === (i + 1).toString()
                            }
                            onChange={handleInputChange}
                          />
                          <p className="text-lg md:text-xl">{i + 1}</p>
                        </label>
                      </motion.div>
                    ))}
                  </motion.div>

                  <div className="flex justify-between w-full opacity-70">
                    <p className="text-sm">Dålig</p>
                    <p className="text-sm">Utmärkt</p>
                  </div>
                </motion.div>
              )}

              {questionIndex === 2 && (
                <motion.div
                  key="expectations-question"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4 w-full"
                  layout
                >
                  <h2 className="text-xl mb-4 md:text-2xl">
                    Levererade{" "}
                    {extractFirstName(surveyDetails?.createdBy?.name)} som
                    förväntat?
                  </h2>

                  <motion.div
                    className="flex gap-1 flex-col-reverse md:flex-row"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.1,
                        },
                      },
                    }}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div
                      className="w-full"
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          transition: {
                            duration: 0.3,
                            ease: "easeOut",
                          },
                        },
                      }}
                    >
                      <label
                        htmlFor="expectation-under"
                        className="flex justify-center items-center w-full py-3 rounded bg-primary-80 hover:bg-primary-60 active:bg-primary-15 active:text-primary-90 cursor-pointer has-[:checked]:bg-primary-15 has-[:checked]:text-primary-90 transition-colors"
                      >
                        <input
                          type="radio"
                          name="expectationMet"
                          value="false"
                          id="expectation-under"
                          className="sr-only"
                          checked={inputData.expectationMet === false}
                          onChange={handleInputChange}
                        />
                        <p className="text-lg md:text-xl">Under förväntan</p>
                      </label>
                    </motion.div>

                    <motion.div
                      className="w-full"
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          transition: {
                            duration: 0.3,
                            ease: "easeOut",
                          },
                        },
                      }}
                    >
                      <label
                        htmlFor="expectation-over"
                        className="flex justify-center items-center w-full py-3 rounded bg-primary-80 hover:bg-primary-60 active:bg-primary-15 active:text-primary-90 cursor-pointer has-[:checked]:bg-primary-15 has-[:checked]:text-primary-90 transition-colors"
                      >
                        <input
                          type="radio"
                          name="expectationMet"
                          value="true"
                          id="expectation-over"
                          className="sr-only"
                          checked={inputData.expectationMet === true}
                          onChange={handleInputChange}
                        />
                        <p className="text-lg md:text-xl">Över förväntan</p>
                      </label>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}

              {questionIndex === 3 && parseInt(inputData.nps) >= 7 && (
                <motion.div
                  key="referral-question"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4 w-full"
                  layout
                >
                  <h2 className="text-xl mb-4 md:text-2xl">
                    Vilket annat bolag tror du kan ta nytta av våra tjänster?
                  </h2>
                  <Textarea
                    name="potentialReferral"
                    placeholder="Skriv ditt svar..."
                    value={inputData.potentialReferral}
                    onChange={handleInputChange}
                  />
                </motion.div>
              )}

              {((questionIndex === 4 && parseInt(inputData.nps) >= 7) ||
                (questionIndex === 3 &&
                  (parseInt(inputData.nps) < 7 || !inputData.nps))) && (
                <motion.div
                  key="feedback-question"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4 w-full"
                  layout
                >
                  <h2 className="text-xl mb-4 md:text-2xl">
                    Vad fungerade bra och vad kan{" "}
                    {extractFirstName(surveyDetails?.createdBy?.name)}{" "}
                    förbättra?
                  </h2>
                  <Textarea
                    name="feedback"
                    placeholder="Skriv ditt svar..."
                    value={inputData.feedback}
                    onChange={handleInputChange}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="flex justify-between items-center pt-4">
            <Button
              type="button"
              size="lg"
              onClick={handlePrevQuestion}
              disabled={questionIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {questionIndex === totalQuestions - 1 ? (
              <Button type="submit" disabled={loading} size="lg">
                {loading ? "Skickar..." : "Skicka feedback"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  handleNextQuestion();
                }}
                size="lg"
                className="gap-2"
              >
                Nästa <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
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
