"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";

const GenerateLink = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateLink = async () => {
    if (!clientName || !companyName) {
      setError("Please fill in both fields");
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
        throw new Error("Failed to generate link");
      }

      const data = await response.json();
      setGeneratedLink(data.surveyUrl);
    } catch (err) {
      setError("An error occurred while generating the link");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setClientName("");
    setCompanyName("");
    setGeneratedLink("");
    setError("");
  };

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} size="lg">
        Generera länk
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Generera länk"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <p className="opacity-70">
            Här kan du generera en länk som du kan skicka till kunden, så kan vi
            se vem som svarat på frågorna.
          </p>

          <div className="space-y-2">
            <Label htmlFor="clientName">Namn på kunden</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Emilito Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Företagsnamn</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Kumpan"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {!generatedLink ? (
            <Button
              onClick={handleGenerateLink}
              className="w-full mt-2"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? "Generating..." : "Generate Link"}
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">Kundens länk:</p>
              <div className="flex items-center gap-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="flex-1 bg-gray-50"
                />
                <Button onClick={copyToClipboard} variant="outline" size="lg">
                  {isCopied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
              <Button
                onClick={() => {
                  setGeneratedLink("");
                  setClientName("");
                  setCompanyName("");
                }}
                variant="outline"
                className="w-full mt-1"
                size="lg"
              >
                Generera ny länk
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default GenerateLink;
