"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, KeyboardEvent } from "react";
import { Suspense } from "react";
import { ChevronLeft, ArrowRight, ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ProfileImage } from "@/components/ProfileImage";
import Logo from "@/components/logo";

interface SurveyDetails {
  id: string;
  uniqueCode: string;
  clientName?: string;
  companyName?: string;
  createdAt: string;
  createdBy?: {
    name?: string;
    image?: string;
  };
  response?: {
    completed: boolean;
  };
}

function HomeContent() {
  const searchParams = useSearchParams();
  const surveyCode = searchParams.get("code");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [surveyDetails, setSurveyDetails] = useState<SurveyDetails | null>(
    null
  );
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

  const getQuestionType = (index: number, npsScore: string) => {
    const nps = npsScore ? parseInt(npsScore) : 0;
    const isHighNps = nps >= 7;

    // For high NPS (≥7): NPS → Referral → Communication → Expectations → Feedback
    // For low NPS (<7): NPS → Communication → Expectations → Feedback
    if (index === 0) return "nps";

    if (isHighNps) {
      if (index === 1) return "referral";
      if (index === 2) return "communication";
      if (index === 3) return "expectations";
      if (index === 4) return "feedback";
    } else {
      if (index === 1) return "communication";
      if (index === 2) return "expectations";
      if (index === 3) return "feedback";
    }

    return "";
  };

  const calculateTotalQuestions = () => {
    // For NPS >= 7: NPS → Referral → Communication → Expectations → Feedback = 5 questions
    // For NPS < 7: NPS → Communication → Expectations → Feedback = 4 questions
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

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (
        event.target instanceof HTMLInputElement &&
        event.target.type === "radio"
      ) {
        event.target.checked = true;
        const name = event.target.name;
        const value = event.target.value;

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
      } else if (questionIndex === totalQuestions - 1) {
        handleSubmit(event as unknown as React.FormEvent<HTMLFormElement>);
      } else {
        handleNextQuestion();
      }
    }

    if (
      (event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown") &&
      event.target instanceof HTMLInputElement &&
      event.target.type === "radio"
    ) {
      event.preventDefault();

      const radioButtons = Array.from(
        document.querySelectorAll(
          `input[type="radio"][name="${event.target.name}"]`
        )
      ) as HTMLInputElement[];

      const currentIndex = radioButtons.findIndex(
        (radio) => radio === event.target
      );
      let newIndex = currentIndex;

      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        newIndex = Math.max(0, currentIndex - 1);
      } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        newIndex = Math.min(radioButtons.length - 1, currentIndex + 1);
      }

      if (newIndex !== currentIndex) {
        radioButtons[newIndex].focus();
      }
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
          linkId: surveyDetails?.id,
          nps: parseInt(inputData.nps),
          communication: parseInt(inputData.communication),
          expectationMet: inputData.expectationMet,
          potentialReferral: inputData.potentialReferral,
          feedback: inputData.feedback,
          anonymous: !surveyDetails,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit survey");
      }

      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting survey:", error);
      setErrorMessage(
        "Det gick inte att skicka in din feedback. Försök igen senare."
      );
    } finally {
      setLoading(false);
    }
  };

  const { data: session } = useSession();

  const highResImage =
    session?.user?.image?.replace(/=s\d+-c$/, "=s400-c") || "";

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

  if (loading) {
    return <></>;
  }

  if (errorMessage && errorMessage.includes("invalid or has expired")) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
        <div className="w-full max-w-md flex items-center text-center flex-col">
          <h1 className="text-3xl md:text-4xl font-medium mb-2">
            Ogiltig länk
          </h1>
          <p className="opacity-70 md:text-lg">
            Denna länk är inte giltig eller har upphört. Kontakta den som
            skickade länken för att få en ny.
          </p>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
        <div className="w-full max-w-md p-6 md:p-8 text-center items-center">
          <h1 className="text-3xl font-medium mb-1">Tack för din feedback!</h1>
          <p className="opacity-70">
            Dina svar har skickats in. Vi uppskattar att du tog dig tid att
            svara på vår enkät.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 pt-8 pb-12 md:px-24">
      <section className="w-full max-w-xl">
        <div className="flex items-center justify-center mb-8">
          <Logo className="size-14 md:size-16" />
        </div>
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
          <p className="text-lg leading-snug opacity-70">
            {surveyDetails ? (
              <>
                Du arbetade nyligen med{" "}
                {extractFirstName(surveyDetails?.createdBy?.name)} på Kumpan,
                och vi värdesätter din feedback högt. Hur upplevde du ert
                samarbetet tillsammans?
              </>
            ) : (
              <>
                Vi på Kumpan värdesätter din feedback högt. Hur upplevde du vårt
                samarbete tillsammans?
              </>
            )}
          </p>
        </div>

        <div className="mb-10">
          <div className="h-2 bg-primary-80/30 rounded-full w-full">
            <motion.div
              className="h-2 bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${((questionIndex + 1) / totalQuestions) * 100}%`,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                },
              }}
            ></motion.div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full"
          onKeyDown={handleKeyDown}
        >
          <div className="relative min-h-56 md:min-h-44">
            <AnimatePresence mode="wait">
              {getQuestionType(questionIndex, inputData.nps) === "nps" && (
                <motion.div
                  key="nps-question"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    opacity: { duration: 0.3 },
                    y: { duration: 0.3 },
                  }}
                  className="space-y-2 pb-4"
                >
                  <h2 className="text-xl mb-4 leading-tight md:text-2xl">
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
                          className="flex flex-col justify-center items-center w-full py-3 rounded bg-primary-80 hover:bg-primary-60 active:bg-primary-15 active:text-primary-90 cursor-pointer has-[:checked]:bg-primary-15 has-[:checked]:text-primary-90 transition-colors focus-within:ring-ring/50 focus-within:ring-[3px] focus-within:ring-offset-2"
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

              {getQuestionType(questionIndex, inputData.nps) === "referral" && (
                <motion.div
                  key="referral-question"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    opacity: { duration: 0.3 },
                    y: { duration: 0.3 },
                  }}
                  className="space-y-4 pb-4"
                >
                  <h2 className="text-xl mb-4 leading-tight md:text-2xl">
                    Vilket annat bolag tror du kan ta nytta av våra tjänster?
                  </h2>
                  <Textarea
                    name="potentialReferral"
                    placeholder="Skriv ditt svar..."
                    value={inputData.potentialReferral}
                    onChange={handleInputChange}
                    className="focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:border-ring"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.shiftKey) {
                        e.preventDefault();
                        handleNextQuestion();
                      }
                    }}
                  />
                </motion.div>
              )}

              {getQuestionType(questionIndex, inputData.nps) ===
                "communication" && (
                <motion.div
                  key="communication-question"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    opacity: { duration: 0.3 },
                    y: { duration: 0.3 },
                  }}
                  className="space-y-2 pb-4"
                >
                  <h2 className="text-xl mb-4 leading-tight md:text-2xl">
                    Hur skulle du bedöma{" "}
                    {surveyDetails
                      ? `${extractFirstName(
                          surveyDetails?.createdBy?.name
                        )}s kommunikation genom projektet?`
                      : "vår kommunikation genom projektet?"}
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
                        className="w-full"
                        key={i + 1}
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
                          className="flex flex-col justify-center items-center w-full py-3 rounded bg-primary-80 hover:bg-primary-60 active:bg-primary-15 active:text-primary-90 cursor-pointer has-[:checked]:bg-primary-15 has-[:checked]:text-primary-90 transition-colors focus-within:ring-ring/50 focus-within:ring-[3px] focus-within:ring-offset-2"
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

              {getQuestionType(questionIndex, inputData.nps) ===
                "expectations" && (
                <motion.div
                  key="expectation-question"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    opacity: { duration: 0.3 },
                    y: { duration: 0.3 },
                  }}
                  className="space-y-4 pb-4"
                >
                  <h2 className="text-xl mb-4 leading-tight md:text-2xl">
                    Levererade{" "}
                    {surveyDetails
                      ? `${extractFirstName(
                          surveyDetails?.createdBy?.name
                        )} som förväntat?`
                      : "vi som förväntat?"}
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
                        className="flex justify-center items-center w-full py-3 rounded bg-primary-80 hover:bg-primary-60 active:bg-primary-15 active:text-primary-90 cursor-pointer has-[:checked]:bg-primary-15 has-[:checked]:text-primary-90 transition-colors focus-within:ring-ring/50 focus-within:ring-[3px] focus-within:ring-offset-2"
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
                        className="flex justify-center items-center w-full py-3 rounded bg-primary-80 hover:bg-primary-60 active:bg-primary-15 active:text-primary-90 cursor-pointer has-[:checked]:bg-primary-15 has-[:checked]:text-primary-90 transition-colors focus-within:ring-ring/50 focus-within:ring-[3px] focus-within:ring-offset-2"
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

              {getQuestionType(questionIndex, inputData.nps) === "feedback" && (
                <motion.div
                  key="feedback-question"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    opacity: { duration: 0.3 },
                    y: { duration: 0.3 },
                  }}
                  className="space-y-4 pb-4"
                >
                  <h2 className="text-xl mb-4 leading-tight md:text-2xl">
                    Vad fungerade bra och vad kan{" "}
                    {surveyDetails
                      ? `${extractFirstName(surveyDetails?.createdBy?.name)}`
                      : "Kumpan"}{" "}
                    förbättra?
                  </h2>
                  <Textarea
                    name="feedback"
                    placeholder="Skriv ditt svar..."
                    value={inputData.feedback}
                    onChange={handleInputChange}
                    className="focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:border-ring"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.shiftKey) {
                        e.preventDefault();
                        handleNextQuestion();
                      }
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex justify-between items-center pt-4 fixed bottom-4 left-4 right-4 md:static">
            <Button
              type="button"
              size="lg"
              onClick={handlePrevQuestion}
              disabled={questionIndex === 0}
              className="gap-2 focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:ring-offset-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {questionIndex === totalQuestions - 1 ? (
              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:ring-offset-2"
              >
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
                className="gap-2 focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:ring-offset-2"
              >
                Nästa <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </section>
      {session?.user && (
        <div className="flex fixed top-0 left-0 right-0 justify-center border-b bg-primary-90">
          <div className="w-full max-w-5xl px-4 md:px-8 flex items-center justify-between gap-4 py-4">
            <Button
              asChild
              className="gap-2 focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:ring-offset-2"
            >
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
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
      )}
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<></>}>
      <HomeContent />
    </Suspense>
  );
}
