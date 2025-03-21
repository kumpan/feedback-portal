"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type TimeFrame = "last7days" | "last30days" | "last6months" | "last1year" | "all";

interface TimeFrameContextType {
  timeFrame: TimeFrame;
  setTimeFrame: (timeFrame: TimeFrame) => void;
}

const TimeFrameContext = createContext<TimeFrameContextType | undefined>(undefined);

export function TimeFrameProvider({ children, initialTimeFrame = "last30days" }: { 
  children: ReactNode;
  initialTimeFrame?: TimeFrame;
}) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>(initialTimeFrame as TimeFrame);

  return (
    <TimeFrameContext.Provider value={{ timeFrame, setTimeFrame }}>
      {children}
    </TimeFrameContext.Provider>
  );
}

export function useTimeFrame() {
  const context = useContext(TimeFrameContext);
  if (context === undefined) {
    throw new Error("useTimeFrame must be used within a TimeFrameProvider");
  }
  return context;
}
