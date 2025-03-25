"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { motion, AnimatePresence } from "framer-motion";

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2,
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
              className={`cursor-pointer rounded-lg transition-colors ${
                response.completed
                  ? "bg-card hover:bg-card-hover"
                  : "bg-gray-100 hover:bg-gray-200"
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
                  className="flex justify-between items-start mb-2"
                  variants={childVariants}
                >
                  <div>
                    <h3 className="font-medium">
                      <span>{response.companyName}</span>
                      {response.clientName &&
                        response.clientName.trim() !== "Anonymous" && (
                          <span>, {response.clientName}</span>
                        )}
                    </h3>
                  </div>
                  <motion.span
                    className={`px-2 py-1 rounded-full text-xs ${
                      response.completed
                        ? "bg-primary-60/30"
                        : "bg-gray-300 text-gray-800"
                    }`}
                    variants={childVariants}
                  >
                    {response.completed ? "Svarad" : "Ej besvarad"}
                  </motion.span>
                </motion.div>
                <motion.div
                  className="flex justify-between text-sm mt-2 opacity-60"
                  variants={childVariants}
                >
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
          title={`${selectedResponse.companyName}${
            selectedResponse.clientName &&
            selectedResponse.clientName !== "Anonymous"
              ? `, ${selectedResponse.clientName}`
              : ""
          }`}
        >
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
          >
            <motion.div
              className="text-xl mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 24,
                },
              }}
            >
              {new Date(selectedResponse.createdAt).toLocaleDateString()}
            </motion.div>
            <motion.div
              className="grid grid-cols-3 gap-2 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 24,
                  delayChildren: 0.1,
                  staggerChildren: 0.1,
                },
              }}
            >
              <motion.div
                className="bg-primary-80/30 rounded-md pt-4 pb-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 24,
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 24,
                    delay: 0.1,
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 24,
                    delay: 0.2,
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
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 24,
                  delay: 0.3,
                },
              }}
            >
              <h3 className="font-medium mb-2">Vad vi gjorde bra:</h3>
              <p className="bg-primary-80/30 p-4 rounded-sm">
                {selectedResponse.whatWeDidWell || "Ingen feedback"}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 24,
                  delay: 0.4,
                },
              }}
            >
              <h3 className="font-medium mb-2">Vad vi kan förbättra:</h3>
              <p className="bg-primary-80/30 p-4 rounded-sm">
                {selectedResponse.whatWeCanImprove || "Ingen feedback"}
              </p>
            </motion.div>
          </motion.div>
        </Modal>
      )}
    </div>
  );
}
