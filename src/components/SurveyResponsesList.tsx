"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";

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

export default function SurveyResponsesList({ responses }: SurveyResponsesListProps) {
  const [expandedResponseId, setExpandedResponseId] = useState<number | null>(null);

  const toggleResponseDetails = (id: number) => {
    if (expandedResponseId === id) {
      setExpandedResponseId(null);
    } else {
      setExpandedResponseId(id);
    }
  };

  if (responses.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">No survey responses yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Survey Responses</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Client</th>
              <th className="px-4 py-2 text-left">Company</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-center">NPS</th>
              <th className="px-4 py-2 text-center">Satisfaction</th>
              <th className="px-4 py-2 text-center">Communication</th>
              <th className="px-4 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {responses.map((response) => (
              <React.Fragment key={response.id}>
                <tr 
                  className={`border-b hover:bg-gray-50 cursor-pointer ${expandedResponseId === response.id ? 'bg-gray-50' : ''}`}
                  onClick={() => toggleResponseDetails(response.id)}
                >
                  <td className="px-4 py-3">{response.clientName}</td>
                  <td className="px-4 py-3">{response.companyName}</td>
                  <td className="px-4 py-3">
                    {new Date(response.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {response.nps !== null ? response.nps : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {response.satisfaction !== null ? response.satisfaction : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {response.communication !== null ? response.communication : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span 
                      className={`px-2 py-1 rounded-full text-xs ${
                        response.completed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {response.completed ? 'Completed' : 'Pending'}
                    </span>
                  </td>
                </tr>
                {expandedResponseId === response.id && (
                  <tr className="bg-gray-50">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-medium mb-1">What we did well:</h3>
                          <p className="text-gray-700">
                            {response.whatWeDidWell || 'No feedback provided'}
                          </p>
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">What we can improve:</h3>
                          <p className="text-gray-700">
                            {response.whatWeCanImprove || 'No feedback provided'}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
