"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check } from "lucide-react";
import Image from "next/image";

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
  const [isCopied, setIsCopied] = useState(false);
  const [surveyUrl, setSurveyUrl] = useState("");

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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(surveyUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (responses.length === 0) {
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
          {responses.map((response, index) => (
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
                    <p>Nöjdhet</p>
                    <p className="font-medium text-lg">
                      {response.satisfaction !== null
                        ? response.satisfaction
                        : "-"}
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
                  {selectedResponse.nps !== null ? selectedResponse.nps : "-"}
                </p>
                <p className="opacity-70 text-sm">NPS</p>
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
                  {selectedResponse.satisfaction !== null
                    ? selectedResponse.satisfaction
                    : "-"}
                </p>
                <p className="opacity-70 text-sm">Nöjdhet</p>
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
                  {selectedResponse.communication !== null
                    ? selectedResponse.communication
                    : "-"}
                </p>
                <p className="opacity-70 text-sm">Kommunikation</p>
              </motion.div>
            </motion.div>

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
              <h3 className="font-medium mb-1">Vad vi gjorde bra:</h3>
              <p className="bg-primary-80/30 p-4 rounded-sm">
                {selectedResponse.whatWeDidWell || "Ingen feedback"}
              </p>
            </motion.div>

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
              <h3 className="font-medium mb-1">Vad vi kan förbättra:</h3>
              <p className="bg-primary-80/30 p-4 rounded-sm">
                {selectedResponse.whatWeCanImprove || "Ingen feedback"}
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
    </div>
  );
}
