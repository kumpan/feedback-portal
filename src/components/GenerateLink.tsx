"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { X, Copy, Check } from "lucide-react";

interface GenerateLinkProps {}

const GenerateLink = ({}: GenerateLinkProps) => {
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
      <Button onClick={() => setIsModalOpen(true)}>Generate link</Button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-semibold mb-4">Generate Survey Link</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name"
                />
              </div>
              
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
              
              {error && <p className="text-red-500 text-sm">{error}</p>}
              
              {!generatedLink ? (
                <Button 
                  onClick={handleGenerateLink} 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Generating..." : "Generate Link"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Survey Link:</p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={generatedLink}
                      readOnly
                      className="flex-1 bg-gray-50"
                    />
                    <Button 
                      size="sm" 
                      onClick={copyToClipboard}
                      variant="outline"
                    >
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
                    className="w-full"
                  >
                    Generate Another Link
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default GenerateLink;
