"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Trash2 } from "lucide-react";
import Image from "next/image";
import { deleteSurveyLink } from "@/app/actions/surveyActions";

interface SurveyResponsesListProps {
  responses: Array<{
    id: number;
    nps: number | null;
    communication: number | null;
    expectationMet: boolean | null;
    potentialReferral: string | null;
    feedback: string | null;
    completed: boolean;
    createdAt: Date;
    clientName: string;
    companyName: string;
    uniqueCode?: string;
    createdBy?: {
      name: string | null;
      image: string | null;
      email: string | null;
    } | null;
  }>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: "1rem" },
  visible: {
    opacity: 1,
    y: "0rem",
    transition: {
      opacity: {
        ease: "easeInOut",
        duration: 0.2,
      },
      y: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      opacity: {
        ease: "easeInOut",
        duration: 0.2,
      },
      y: {
        type: "spring",
        stiffness: 400,
        damping: 20,
      },
    },
  },
};

export default function SurveyResponsesList({
  responses,
}: SurveyResponsesListProps) {
  const [selectedResponse, setSelectedResponse] = useState<
    (typeof responses)[0] | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [surveyUrl, setSurveyUrl] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [visibleResponses, setVisibleResponses] =
    useState<typeof responses>(responses);

  useEffect(() => {
    setVisibleResponses(responses);
  }, [responses]);

  useEffect(() => {
    if (selectedResponse && selectedResponse.uniqueCode) {
      const isLegitimateLink =
        selectedResponse.uniqueCode &&
        !selectedResponse.uniqueCode.startsWith("ANON-");

      if (isLegitimateLink) {
        const domain = window.location.origin;
        const url = `${domain}/?code=${selectedResponse.uniqueCode}`;
        setSurveyUrl(url);
      } else {
        setSurveyUrl("");
      }
    } else {
      setSurveyUrl("");
    }
  }, [selectedResponse]);

  const openResponseDetails = (response: (typeof responses)[0]) => {
    setSelectedResponse(response);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsCopied(false);
  };

  const openConfirmModal = () => {
    setIsModalOpen(false);
    setIsConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(surveyUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDeleteSurvey = async () => {
    if (!selectedResponse || !selectedResponse.uniqueCode) return;

    setIsDeleting(true);
    try {
      const result = await deleteSurveyLink(selectedResponse.uniqueCode);

      if (result.success) {
        setVisibleResponses((prevResponses) =>
          prevResponses.filter(
            (response) => response.id !== selectedResponse.id
          )
        );
        closeConfirmModal();
      } else {
        alert(result.message);
      }
    } catch {
      alert("Failed to delete the survey.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (visibleResponses.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">Ingen feedback än😭</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {visibleResponses.map((response, index) => (
            <motion.div
              key={response.id}
              className={`cursor-pointer rounded-xl transition-colors ${
                response.completed
                  ? "bg-card hover:bg-card-hover"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => openResponseDetails(response)}
              variants={itemVariants}
              whileHover={{
                scale: 1.02,
                transition: { duration: 0.2 },
              }}
              custom={index}
            >
              <div className="p-4">
                <motion.div
                  className="flex justify-between items-center mb-4"
                  variants={childVariants}
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <h3 className="font-medium text-lg truncate">
                      <span>{response.clientName}</span>
                      {response.companyName &&
                        response.companyName.trim() !== "Anonymous" && (
                          <span>, {response.companyName}</span>
                        )}
                    </h3>
                  </div>
                  <motion.span
                    className={`rounded-full text-xs flex items-center gap-2`}
                    variants={childVariants}
                  >
                    {response.createdBy && response.createdBy.name && (
                      <>
                        {response.createdBy.image && (
                          <Image
                            src={response.createdBy.image}
                            alt={response.createdBy.name || "User"}
                            width={32}
                            height={32}
                            className={`rounded-lg ml-1 ${
                              response.completed
                                ? ""
                                : "filter-[saturate(0)] opacity-90"
                            }`}
                          />
                        )}
                      </>
                    )}
                  </motion.span>
                </motion.div>

                <motion.div
                  className="flex justify-between text-sm mt-2 opacity-60"
                  variants={childVariants}
                >
                  <div>
                    <p className="">NPS</p>
                    <p className="font-medium text-lg">
                      {response.nps !== null ? response.nps : "-"}
                    </p>
                  </div>
                  <div>
                    <p>Kommunikation</p>
                    <p className="font-medium text-lg">
                      {response.communication !== null
                        ? response.communication
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p>Förväntningar</p>
                    <p className="font-medium text-lg">
                      {response.expectationMet !== null
                        ? response.expectationMet === true
                          ? "Ja"
                          : "Nej"
                        : "-"}
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {selectedResponse && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={`${selectedResponse.clientName}${
            selectedResponse.companyName &&
            selectedResponse.companyName !== "Anonymous"
              ? `, ${selectedResponse.companyName}`
              : ""
          }`}
          actions={
            !selectedResponse.completed ? (
              <button
                onClick={openConfirmModal}
                className="rounded-lg p-4 hover:bg-primary-85 cursor-pointer transition-colors"
                aria-label="Delete"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            ) : null
          }
        >
          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05,
                  delayChildren: 0.1,
                },
              },
            }}
          >
            <motion.div
              className="flex items-center"
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 24,
                  },
                },
              }}
            >
              {selectedResponse.createdBy &&
                selectedResponse.createdBy.name && (
                  <div className="flex items-center gap-2">
                    {selectedResponse.createdBy.image && (
                      <Image
                        src={selectedResponse.createdBy.image}
                        alt={selectedResponse.createdBy.name || "User"}
                        width={44}
                        height={44}
                        className="rounded-lg"
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="text-lg leading-tight">
                        {selectedResponse.createdBy.name}
                      </span>
                      <span className="text-sm">
                        {new Date(
                          selectedResponse.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
            </motion.div>

            <motion.div
              className="grid grid-cols-3 gap-2 text-center"
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 24,
                    staggerChildren: 0.1,
                  },
                },
              }}
            >
              <motion.div
                className="bg-primary-80/30 flex flex-col justify-center rounded-md pt-4 pb-3"
                variants={{
                  hidden: { opacity: 0, scale: 0.9 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    transition: {
                      type: "spring",
                      stiffness: 300,
                      damping: 24,
                    },
                  },
                }}
              >
                <p className="text-4xl">
                  {selectedResponse.nps !== null ? selectedResponse.nps : "-"}
                </p>
                <p className="opacity-70 text-sm hidden md:block">NPS</p>
              </motion.div>
              <motion.div
                className="bg-primary-80/30 rounded-md py-4 md:pt-4 md:pb-3"
                variants={{
                  hidden: { opacity: 0, scale: 0.9 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    transition: {
                      type: "spring",
                      stiffness: 300,
                      damping: 24,
                    },
                  },
                }}
              >
                <p className="text-4xl">
                  {selectedResponse.communication !== null
                    ? selectedResponse.communication
                    : "-"}
                </p>
                <p className="opacity-70 text-sm hidden md:block">
                  Kommunikation
                </p>
              </motion.div>
              <motion.div
                className="bg-primary-80/30 rounded-md pt-4 pb-3"
                variants={{
                  hidden: { opacity: 0, scale: 0.9 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    transition: {
                      type: "spring",
                      stiffness: 300,
                      damping: 24,
                    },
                  },
                }}
              >
                <p className="text-4xl">
                  {selectedResponse.expectationMet !== null
                    ? selectedResponse.expectationMet === true
                      ? "Ja"
                      : "Nej"
                    : "-"}
                </p>
                <p className="opacity-70 text-sm hidden md:block">
                  Förväntningar
                </p>
              </motion.div>
            </motion.div>

            <motion.div
              className="space-y-1"
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 24,
                  },
                },
              }}
            >
              <h3 className="font-medium">Potentiella kunder</h3>
              <p className="bg-primary-80/30 p-3 rounded-md">
                {selectedResponse.potentialReferral || "Ingen information"}
              </p>
            </motion.div>

            <motion.div
              className="space-y-1"
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 24,
                  },
                },
              }}
            >
              <h3 className="font-medium">Feedback</h3>
              <p className="bg-primary-80/30 p-3 rounded-md">
                {selectedResponse.feedback || "Ingen feedback"}
              </p>
            </motion.div>

            <div className="space-y-6">
              {surveyUrl && (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 24,
                      },
                    },
                  }}
                >
                  <h3 className="font-medium mb-1">Kundens länk:</h3>
                  <div className="flex items-center gap-2">
                    <Input value={surveyUrl} readOnly className="flex-1" />
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 10,
                      }}
                    >
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        size="lg"
                        className="transition-all duration-200"
                      >
                        {isCopied ? <Check size={16} /> : <Copy size={16} />}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </Modal>
      )}

      {/* Confirmation Modal */}
      {selectedResponse && (
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={closeConfirmModal}
          title="Ta bort enkät?"
        >
          <div>
            <p className="md:text-lg">
              Är du säker på att du vill ta bort denna enkät? Detta kommer att
              permanent ta bort enkäten och kan inte ångras.
            </p>

            <div className="flex flex-col-reverse md:flex-row gap-2 mt-8">
              <Button
                size="lg"
                variant="outline"
                className="md:flex-1"
                onClick={closeConfirmModal}
                disabled={isDeleting}
              >
                Nej, rädda enkäten
              </Button>
              <Button
                size="lg"
                variant="destructive"
                className="md:flex-1"
                onClick={handleDeleteSurvey}
                disabled={isDeleting}
              >
                {isDeleting ? "Tar bort..." : "Ja, ta bort"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
