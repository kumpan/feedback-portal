"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTimeFrame } from "@/context/TimeFrameContext";

export function TimeFrameSelector() {
  const { timeFrame, setTimeFrame } = useTimeFrame();

  return (
    <div className="">
      <Select 
        value={timeFrame} 
        onValueChange={(value) => setTimeFrame(value as "last7days" | "last30days" | "last6months" | "last1year" | "all")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Välj tidsram" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="last7days">Senaste 7 dagarna</SelectItem>
          <SelectItem value="last30days">Senaste 30 dagarna</SelectItem>
          <SelectItem value="last6months">Senaste 6 månaderna</SelectItem>
          <SelectItem value="last1year">Senaste året</SelectItem>
          <SelectItem value="all">Visa allt</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
