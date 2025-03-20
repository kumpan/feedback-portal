"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";

interface SurveyResponsesListProps {
  responses: Array<{
    id: number;
    nps: number | null;
    satisfaction: number | null;
    communication: number | null;
    whatWeDidWell: string | null;
    whatWeCanImprove: string | null;
    completed: boolean;
    createdAt: Date;
    clientName: string;
    companyName: string;
  }>;
}

export default function SurveyResponsesList({
  responses,
}: SurveyResponsesListProps) {
  const [selectedResponse, setSelectedResponse] = useState<
    (typeof responses)[0] | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openResponseDetails = (response: (typeof responses)[0]) => {
    setSelectedResponse(response);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  if (responses.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">Ingen feedback än😭</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3 mt-8">
      <h2 className="text-2xl md:text-3xl">Feedback svar</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
        {responses.map((response) => (
          <div
            key={response.id}
            className={`cursor-pointer rounded-lg transition-colors ${
              response.completed
                ? "bg-card hover:bg-card-hover"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => openResponseDetails(response)}
          >
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">
                    <span>{response.companyName}</span>
                    {response.clientName &&
                      response.clientName.trim() !== "Anonymous" && (
                        <span>, {response.clientName}</span>
                      )}
                  </h3>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    response.completed
                      ? "bg-primary-60/30"
                      : "bg-gray-300 text-gray-800"
                  }`}
                >
                  {response.completed ? "Svarad" : "Ej besvarad"}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2 opacity-60">
                <div>
                  <p className="">NPS</p>
                  <p className="font-medium">
                    {response.nps !== null ? response.nps : "-"}
                  </p>
                </div>
                <div>
                  <p>Nöjdhet</p>
                  <p className="font-medium">
                    {response.satisfaction !== null
                      ? response.satisfaction
                      : "-"}
                  </p>
                </div>
                <div>
                  <p>Kommunikation</p>
                  <p className="font-medium">
                    {response.communication !== null
                      ? response.communication
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedResponse && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={`${selectedResponse.companyName}${
            selectedResponse.clientName &&
            selectedResponse.clientName !== "Anonymous"
              ? `, ${selectedResponse.clientName}`
              : ""
          }`}
        >
          <div className="space-y-4">
            <div className="text-xl mb-4">
              {new Date(selectedResponse.createdAt).toLocaleDateString()}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-primary-80/30 rounded-md pt-4 pb-3">
                <p className="text-4xl">
                  {selectedResponse.nps !== null ? selectedResponse.nps : "-"}
                </p>
                <p className="opacity-70 text-sm">NPS</p>
              </div>
              <div className="bg-primary-80/30 rounded-md  pt-4 pb-3">
                <p className="text-4xl">
                  {selectedResponse.satisfaction !== null
                    ? selectedResponse.satisfaction
                    : "-"}
                </p>
                <p className="opacity-70 text-sm">Nöjdhet</p>
              </div>
              <div className="bg-primary-80/30 rounded-md  pt-4 pb-3">
                <p className="text-4xl">
                  {selectedResponse.communication !== null
                    ? selectedResponse.communication
                    : "-"}
                </p>
                <p className="opacity-70 text-sm">Kommunikation</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Vad vi gjorde bra:</h3>
              <p className="bg-primary-80/30 p-4 rounded-sm">
                {selectedResponse.whatWeDidWell || "Ingen feedback"}
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Vad vi kan förbättra:</h3>
              <p className="bg-primary-80/30 p-4 rounded-sm">
                {selectedResponse.whatWeCanImprove || "Ingen feedback"}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
