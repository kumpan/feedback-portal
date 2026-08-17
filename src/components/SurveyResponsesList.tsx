"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { m, AnimatePresence } from "framer-motion";
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
    clientEmail?: string | null;
    uniqueCode?: string;
    createdBy?: {
      name: string | null;
      image: string | null;
      email: string | null;
    } | null;
  }>;
  onDeleted?: () => void;
  /** True until the first fetch settles, so the empty state can be held back. */
  isLoading?: boolean;
}

/**
 * How long to wait before admitting there is genuinely no feedback. Long enough
 * that a normal fetch never flashes "Ingen feedback än" on its way past.
 */
const EMPTY_STATE_DELAY_MS = 700;

/**
 * `transition` mixes two kinds of key, and they are not interchangeable:
 *
 *   - orchestration (staggerChildren, delayChildren, staggerDirection, when)
 *     must sit at the TOP level. framer destructures them straight off
 *     `transition`, so nesting them under a value name silently yields
 *     undefined and no stagger happens at all.
 *   - per-value overrides are keyed by the property being animated — `opacity`,
 *     `y`. There is no "spring" value, so a `transition.spring` key matches
 *     nothing. Spring is a `type` inside a value's own transition.
 *
 * Every value in `hidden` also needs a counterpart in `visible`; a `y` that is
 * only in `hidden` never animates back and leaves the grid offset.
 */
const containerVariants = {
  hidden: { opacity: 0, y: "2rem" },
  visible: {
    opacity: 1,
    y: "0rem",
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.15,
      opacity: { ease: "easeInOut", duration: 0.25 },
      y: { type: "spring", stiffness: 400, damping: 12 },
    },
  },
  exit: {
    opacity: 0,
    y: "1rem",
    transition: {
      // Reverse the stagger on the way out so the grid unbuilds from the
      // end, and outrun the entrance so a swap doesn't feel sluggish.
      staggerChildren: 0.02,
      staggerDirection: -1,
      opacity: { ease: "easeOut", duration: 0.15 },
      y: { type: "spring", stiffness: 400, damping: 32 },
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

/**
 * Exit target, deliberately an object literal rather than a variant label.
 *
 * framer-motion's `isControllingVariants` treats a STRING in any of
 * ["initial", "animate", "whileInView", "whileFocus", "whileHover", "whileTap",
 * "whileDrag", "exit"] as "this component drives its own variants". A card with
 * exit="exit" therefore stops inheriting initial/animate from the grid and stops
 * being registered as a variant child, so containerVariants' staggerChildren
 * never reaches it — silently, with no warning. An object is not a variant
 * label, so inheritance and the stagger both survive.
 *
 * Quick and non-springy on the way out: the card should be gone before the
 * survivors finish sliding into its slot, or the two motions read as a fight.
 */
const cardExit = {
  opacity: 0,
  scale: 0.92,
  transition: { duration: 0.16, ease: "easeOut" },
};

const layoutTransition = {
  type: "spring" as const,
  stiffness: 420,
  damping: 34,
  mass: 0.9,
};

const childVariants = {
  hidden: { opacity: 0, y: "1rem" },
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
        damping: 18,
      },
    },
  },
};

export default function SurveyResponsesList({
  responses,
  onDeleted,
  isLoading = false,
}: SurveyResponsesListProps) {
  const [selectedResponse, setSelectedResponse] = useState<
    (typeof responses)[0] | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [surveyUrl, setSurveyUrl] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  // Ids hidden optimistically after a delete, so the card can animate out
  // before the refetch confirms it. Derived rather than mirrored into state:
  // a mirror lags props by one render, and that render would flash the empty
  // state the moment the first fetch lands.
  const [deletedIds, setDeletedIds] = useState<ReadonlySet<number>>(
    () => new Set(),
  );

  const visibleResponses = responses.filter((r) => !deletedIds.has(r.id));

  // Keep an open modal in step with the poller. Without this it shows the row
  // as it looked when opened: a survey the client completes while the modal is
  // up would still read "-" and still offer Delete, which the server then
  // refuses with a raw alert.
  useEffect(() => {
    setSelectedResponse((current) => {
      if (!current) return current;
      const fresh = responses.find((r) => r.id === current.id);
      return fresh ?? current;
    });
  }, [responses]);

  // Drop ids the server has now forgotten, so the set can't grow forever.
  useEffect(() => {
    setDeletedIds((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set(
        [...prev].filter((id) => responses.some((r) => r.id === id)),
      );
      return next.size === prev.size ? prev : next;
    });
  }, [responses]);

  // Grace period before conceding the list is genuinely empty.
  const [graceElapsed, setGraceElapsed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setGraceElapsed(true), EMPTY_STATE_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

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
        setDeletedIds((prev) => new Set(prev).add(selectedResponse.id));
        closeConfirmModal();
        onDeleted?.();
      } else {
        alert(result.message);
      }
    } catch {
      alert("Failed to delete the survey.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Which of the three states to show. Nothing yet is the normal case
  // mid-fetch, not a result worth reporting, so the empty state waits for both
  // the fetch to settle and the grace window to pass.
  const listState =
    visibleResponses.length > 0
      ? "grid"
      : isLoading || !graceElapsed
        ? "pending"
        : "empty";

  return (
    <div className="space-y-3">
      {/*
       * The outer AnimatePresence is what gives containerVariants.exit
       * somewhere to run. Without it the grid would simply unmount and the
       * exit variant would never fire. `mode="wait"` lets the outgoing state
       * finish before the next one enters, so the two never overlap.
       */}
      <AnimatePresence mode="wait" initial={false}>
        {listState === "pending" && (
          <m.div key="pending" className="min-h-32" aria-busy="true" />
        )}

        {listState === "empty" && (
          <m.div
            key="empty"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Card className="p-6">
              <p className="text-center text-gray-500">Ingen feedback än😭</p>
            </Card>
          </m.div>
        )}

        {listState === "grid" && (
          <m.div
            key="grid"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <AnimatePresence mode="popLayout">
              {visibleResponses.map((response, index) => (
                <m.div
                  key={response.id}
                  className={`cursor-pointer rounded-xl transition-colors ${
                    response.completed
                      ? "bg-card hover:bg-card-hover"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => openResponseDetails(response)}
                  variants={itemVariants}
                  layout="position"
                  transition={layoutTransition}
                  exit={cardExit}
                  whileHover={{
                    scale: 1.02,
                    transition: { duration: 0.2 },
                  }}
                  custom={index}
                >
                  <div className="p-4">
                    <m.div
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
                      <m.span
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
                      </m.span>
                    </m.div>

                    <m.div
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
                    </m.div>
                  </div>
                </m.div>
              ))}
            </AnimatePresence>
          </m.div>
        )}
      </AnimatePresence>

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
          <m.div
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
            <m.div
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
                          selectedResponse.createdAt,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
            </m.div>

            <m.div
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
              <m.div
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
              </m.div>
              <m.div
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
              </m.div>
              <m.div
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
              </m.div>
            </m.div>

            <m.div
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
            </m.div>

            <m.div
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
            </m.div>

            <div className="space-y-6">
              {surveyUrl && (
                <m.div
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
                  <div className="flex justify-between items-center gap-2">
                    <h3 className="font-medium mb-1">Kundens länk:</h3>
                    {selectedResponse.clientEmail && (
                      <p className="text-sm truncate">
                        Skickad till {selectedResponse.clientEmail}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input value={surveyUrl} readOnly className="flex-1" />
                    <m.div
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
                    </m.div>
                  </div>
                </m.div>
              )}
            </div>
          </m.div>
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
