// components/recent-feedback.tsx
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SurveyResponse {
  id: number;
  nps: number;
  satisfaction: number;
  communication: number;
  whatWeDidWell: string | null;
  whatWeCanImprove: string | null;
  createdAt: string;
}

interface RecentFeedbackProps {
  data: SurveyResponse[];
}

export function RecentFeedback({ data }: RecentFeedbackProps) {
  const [showCount, setShowCount] = useState(3);

  // Sort by most recent first
  const sortedData = [...data].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const visibleData = sortedData.slice(0, showCount);

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Feedback</CardTitle>
        <CardDescription>Latest feedback from our customers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {visibleData.map((response) => (
            <div key={response.id} className="border-b pb-4 last:border-0">
              <div className="flex justify-between mb-2">
                <div className="text-sm text-muted-foreground">
                  {formatDate(response.createdAt)}
                </div>
                <div className="flex space-x-2">
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    NPS: {response.nps}
                  </span>
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                    SAT: {response.satisfaction}
                  </span>
                  <span className="text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded">
                    COM: {response.communication}
                  </span>
                </div>
              </div>

              {response.whatWeDidWell && (
                <div className="mt-2">
                  <h4 className="text-sm font-medium">What we did well:</h4>
                  <p className="text-sm text-gray-700">
                    {response.whatWeDidWell}
                  </p>
                </div>
              )}

              {response.whatWeCanImprove && (
                <div className="mt-2">
                  <h4 className="text-sm font-medium">What we can improve:</h4>
                  <p className="text-sm text-gray-700">
                    {response.whatWeCanImprove}
                  </p>
                </div>
              )}
            </div>
          ))}

          {showCount < sortedData.length && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setShowCount((prev) => prev + 3)}
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
