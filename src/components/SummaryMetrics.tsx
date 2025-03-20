import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface SummaryMetricsProps {
  avgSatisfaction: number;
  avgCommunication: number;
  totalResponses: number;
  timeframeNps: number;
  timeFrameDisplay: string;
}

export function SummaryMetrics({
  timeFrameDisplay,
  timeframeNps,
  avgCommunication,
  avgSatisfaction,
  totalResponses,
}: SummaryMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>NPS (-100 to +100)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {timeframeNps >= 0 ? `+${timeframeNps}` : timeframeNps}
          </p>
          <p className="text-sm text-muted-foreground">
            {timeFrameDisplay} (baserat på {totalResponses} svar)
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Nöjdhet (1-5)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{avgSatisfaction}</p>
          <p className="text-sm text-muted-foreground">
            Genomsnitt (baserat på {totalResponses} svar)
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Kommunikation (1-5)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{avgCommunication}</p>
          <p className="text-sm text-muted-foreground">
            Genomsnitt (baserat på {totalResponses} svar)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
