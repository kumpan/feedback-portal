"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeRetentionData } from "@/app/actions/employeeActions";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Info } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import React, { useState } from "react";

interface EmployeeMetricsProps {
  retentionData: EmployeeRetentionData;
}

function AnimateNumber({
  value,
  duration = 0.8,
  decimals = 0,
  suffix = "",
  prefix = "",
}: {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
}) {
  const prevValueRef = useRef(value);
  const count = useMotionValue(prevValueRef.current);

  const formattedValue = useTransform(count, (latest) => {
    return `${prefix}${latest.toFixed(decimals)}${suffix}`;
  });

  useEffect(() => {
    if (prevValueRef.current !== value) {
      const animation = animate(count, value, {
        duration: duration,
        ease: "easeOut",
      });

      prevValueRef.current = value;

      return animation.stop;
    }
  }, [count, value, duration]);

  return <motion.span>{formattedValue}</motion.span>;
}

const InfoButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="hover:text-primary-30 active:text-primary-30 transition-colors"
    aria-label="Mer information"
  >
    <Info className="h-4 w-4 opacity-70" />
  </button>
);

const RetentionInfoModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Retention">
    <div>
      <p>
        Retention visar andelen anställda från årets början som fortfarande är
        kvar vid årets slut.
      </p>

      <h4 className="text-lg font-medium mt-4">Exempel</h4>
      <div className="bg-primary-90 p-4 rounded-md">
        <p>
          Om ett företag hade 100 anställda vid årets början och 80 av dessa
          fortfarande är anställda vid årets slut:
        </p>
        <p className="font-mono mt-2">Retention = (80 / 100) × 100 = 80%</p>
      </div>

      <h4 className="text-lg font-medium mt-4">Tolkning</h4>
      <p>
        En hög Retention (närmare 100%) indikerar att företaget är bra på att
        behålla sina anställda över tid. Detta är ofta ett tecken på god
        arbetsmiljö, konkurrenskraftiga förmåner och karriärmöjligheter.
      </p>
    </div>
  </Modal>
);

const TurnoverInfoModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Turnover">
    <div className="">
      <p>
        Turnover visar andelen anställda som lämnat under året jämfört med det
        genomsnittliga antalet anställda.
      </p>

      <h4 className="text-lg font-medium mt-4">Exempel</h4>
      <div className="bg-primary-90 p-4 rounded-md">
        <p>
          Om ett företag hade 100 anställda vid årets början, 110 vid årets
          slut, och 15 anställda lämnade under året:
        </p>
        <p className="font-mono mt-2">
          Genomsnittligt antal anställda = (100 + 110) / 2 = 105
        </p>
        <p className="font-mono mt-1">Turnover = (15 / 105) × 100 = 14.3%</p>
      </div>

      <h4 className="text-lg font-medium mt-4">Skillnad från retention</h4>
      <p>
        Medan Retention fokuserar på att behålla befintliga anställda från årets
        början, mäter Turnover flödet av anställda som lämnar organisationen i
        förhållande till den genomsnittliga arbetsstyrkan.
      </p>
      <p className="mt-2">
        Retention är ett &quot;positivt&quot; mått (högre är bättre), medan
        Turnover är ett &quot;negativt&quot; mått (lägre är bättre).
      </p>
    </div>
  </Modal>
);

export function EmployeeMetrics({ retentionData }: EmployeeMetricsProps) {
  const [isRetentionModalOpen, setIsRetentionModalOpen] = useState(false);
  const [isTurnoverModalOpen, setIsTurnoverModalOpen] = useState(false);

  return (
    <div className="grid gap-2 md:gap-4 grid-cols-1 md:grid-cols-2">
      <Card>
        <CardHeader className="border-b border-border/20 mb-4">
          <div className="flex items-center">
            <CardTitle>Anställda vid årets början</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-5xl md:text-6xl proportional-nums font-medium">
            <AnimateNumber
              value={retentionData.startOfYearCount}
              decimals={0}
            />
          </div>
          <p className="opacity-70">
            Antal anställda {retentionData.year}-01-01
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/20 mb-4">
          <div className="flex items-center">
            <CardTitle>Anställda vid årets slut</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-5xl md:text-6xl proportional-nums font-medium">
            <AnimateNumber value={retentionData.endOfYearCount} decimals={0} />
          </div>
          <p className="opacity-70">
            Antal anställda {retentionData.year}-12-31
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/20 mb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Retention</CardTitle>
            <InfoButton onClick={() => setIsRetentionModalOpen(true)} />
          </div>
          <p className="text-sm opacity-70">
            Andelen anställda som var med från årets början och fortfarande är
            anställda vid årets slut.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-5xl md:text-6xl proportional-nums font-medium">
            <AnimateNumber
              value={retentionData.retentionRate}
              decimals={1}
              suffix="%"
            />
          </div>
          <p className="opacity-70">
            <AnimateNumber
              value={retentionData.originalEmployeesRetained}
              decimals={0}
            />{" "}
            av {retentionData.startOfYearCount} anställda
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/20 mb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Turnover</CardTitle>
            <InfoButton onClick={() => setIsTurnoverModalOpen(true)} />
          </div>
          <p className="text-sm opacity-70">
            Andelen anställda som lämnade företaget under året, sett mot det
            genomsnittliga antalet anställda.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-5xl md:text-6xl proportional-nums font-medium">
            <AnimateNumber
              value={retentionData.turnoverRate}
              decimals={1}
              suffix="%"
            />
          </div>
          <p className="opacity-70">
            Baserat på genomsnitt av{" "}
            {Math.round(
              (retentionData.startOfYearCount + retentionData.endOfYearCount) /
                2
            )}{" "}
            anställda
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="border-b border-border/20 mb-4">
          <CardTitle>Genomsnittlig anställningstid</CardTitle>
          <p className="text-sm opacity-70">
            Beräknat på alla anställda över alla år, inte bara för det visade
            året
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-5xl md:text-6xl proportional-nums font-medium">
            <AnimateNumber
              value={retentionData.averageEmploymentDuration}
              decimals={1}
              suffix=" år"
            />
          </div>
          <p className="opacity-70">Genomsnitt för alla anställda</p>
        </CardContent>
      </Card>

      <RetentionInfoModal
        isOpen={isRetentionModalOpen}
        onClose={() => setIsRetentionModalOpen(false)}
      />

      <TurnoverInfoModal
        isOpen={isTurnoverModalOpen}
        onClose={() => setIsTurnoverModalOpen(false)}
      />
    </div>
  );
}
