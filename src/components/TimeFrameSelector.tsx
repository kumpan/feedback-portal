"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function TimeFrameSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [timeFrame, setTimeFrame] = useState(
    searchParams.get("timeframe") || "last30days"
  );

  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set("timeframe", timeFrame);
    router.push(`/dashboard?${currentParams.toString()}`);
  }, [timeFrame, router, searchParams]);

  return (
    <div className="">
      <Select value={timeFrame} onValueChange={(value) => setTimeFrame(value)}>
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
