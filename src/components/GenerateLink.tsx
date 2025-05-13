"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertCircle, Loader } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useSession } from "next-auth/react";
import { ProfileImage } from "@/components/ProfileImage";
import { cn } from "@/lib/utils";

export default function GenerateLink() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    const button = document.getElementById("generate-link-button");
    if (button) {
      const handleClick = () => {
        setIsOpen(true);
      };
      button.addEventListener("click", handleClick);
      return () => {
        button.removeEventListener("click", handleClick);
      };
    }
  }, []);

  const handleGenerateLink = async () => {
    if (!clientName || !companyName || !clientEmail) {
      setError("Fyll i alla fält");
      setGeneratedLink("error");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/survey-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clientName, companyName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Gick inte att generera länk");
      }

      const data = await response.json();
      setGeneratedLink(data.surveyUrl);

      if (clientEmail) {
        await sendEmailWithLink(data.surveyUrl);
      }
    } catch (err: unknown) {
      const errorMessage =
        typeof err === "object" && err !== null && "message" in err
          ? (err.message as string)
          : "Gick inte att generera länk";

      setError(errorMessage);
      setGeneratedLink("error"); // Set a dummy value to show the error container
      console.error("Error med skapandet av länk:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailWithLink = async (surveyUrl: string) => {
    // Set all states at once to prevent flickering
    setIsSendingEmail(true);
    setEmailSent(false);
    setError(""); // Clear any previous errors

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientName,
          companyName,
          clientEmail,
          surveyUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Gick inte att skicka e-post");
      }

      setEmailSent(true);
    } catch (err: unknown) {
      console.error("Error sending email:", err);
      let errorMessage = "Gick inte att skicka e-post";

      if (typeof err === "object" && err !== null) {
        if ("message" in err) {
          const message = err.message as string;

          if (message.includes("API key")) {
            errorMessage = "Saknar API-nyckel för Resend";
          } else if (message.includes("from") || message.includes("sender")) {
            errorMessage = "Ogiltig avsändaradress";
          } else if (message.includes("to") || message.includes("recipient")) {
            errorMessage = "Ogiltig mottagaradress";
          } else if (
            message.includes("network") ||
            message.includes("connect")
          ) {
            errorMessage = "Nätverksfel vid anslutning till e-posttjänsten";
          } else {
            errorMessage = message;
          }
        }
      }

      setError(errorMessage);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setClientName("");
    setCompanyName("");
    setClientEmail("");
    setGeneratedLink("");
    setError("");
    setEmailSent(false);
  };

  return (
    <>
      <Button id="generate-link-button" size="lg">
        Skicka enkät
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title="Skicka enkät till kund"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <p className="opacity-70 mb-8">
            Skicka ut enkäten vid leverans av projektet. Vid långvariga
            kundrelationer kan du överväga att skicka den under en lugnare
            period, exempelvis sommaren eller vintern.
          </p>

          <div className="space-y-2">
            <Label htmlFor="clientName">Namn på kunden</Label>
            <Input
              id="clientName"
              value={clientName}
              required
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Emilito Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Kundens företagsnamn</Label>
            <Input
              id="companyName"
              value={companyName}
              required
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Kumpan"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientEmail">Kundens e-postadress</Label>
            <Input
              id="clientEmail"
              type="email"
              required
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="client@example.com"
            />
          </div>

          {!generatedLink || generatedLink === "error" ? (
            <>
              <Button
                onClick={handleGenerateLink}
                className="w-full mt-2"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? "Genererar..." : "Skicka enkät"}
              </Button>

              {error && generatedLink === "error" && (
                <div className="mt-4">
                  <div className="flex">
                    <div className="flex flex-row items-center gap-4 w-full p-1 rounded-lg bg-red-100 text-red-800">
                      <div className="p-4 bg-red-200 rounded-md">
                        <AlertCircle />
                      </div>
                      <p className="w-full">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              {clientEmail && (
                <div className="mt-4">
                  <div className="flex">
                    <div
                      className={cn(
                        "flex flex-row items-center gap-4 w-full p-1 rounded-lg",
                        emailSent ? "bg-primary-80 text-primary-20" : "",
                        error && !emailSent ? "bg-red-100 text-red-800" : ""
                      )}
                    >
                      {emailSent && (
                        <div className="p-4 bg-primary-90 rounded-md">
                          <CheckCircle />
                        </div>
                      )}
                      {error && !emailSent && (
                        <div className="p-4 bg-red-200 rounded-md">
                          <AlertCircle />
                        </div>
                      )}

                      <p className="w-full">
                        {emailSent
                          ? `Enkät skickad till ${clientEmail}`
                          : error
                            ? `${error}`
                            : ""}
                      </p>
                    </div>
                  </div>

                  {!emailSent && (
                    <Button
                      onClick={() => sendEmailWithLink(generatedLink)}
                      variant="outline"
                      size="lg"
                      className="mt-2 w-full"
                      disabled={isSendingEmail}
                    >
                      {isSendingEmail ? "Skickar e-post..." : "Försök igen"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
