"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  syncEmployeeData,
  getLastSyncInfo,
} from "@/app/actions/employeeActions";
import { motion } from "framer-motion";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

interface EmployeeDataSyncProps {
  onSyncComplete?: () => void;
}

export default function EmployeeDataSync({
  onSyncComplete,
}: EmployeeDataSyncProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [lastSync, setLastSync] = useState<{
    date: Date | null;
    status: string;
  }>({ date: null, status: "none" });

  useEffect(() => {
    const storedApiKey = localStorage.getItem("hailey_hr_api_key");
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }

    getLastSyncInfo().then((info) => {
      setLastSync(info);
    });
  }, []);

  const handleSync = async (forceFullSync = false) => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      if (apiKey) {
        localStorage.setItem("hailey_hr_api_key", apiKey);

        await fetch("/api/set-api-key", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ apiKey }),
        });
      }

      const result = await syncEmployeeData(forceFullSync);
      setSyncResult({
        success: result.success,
        message: result.message,
      });

      if (result.success && onSyncComplete) {
        onSyncComplete();
      }

      getLastSyncInfo().then((info) => {
        setLastSync(info);
      });
    } catch (error) {
      setSyncResult({
        success: false,
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API nyckel</Label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Hailey HR API key"
                className="flex-1"
              />
              <Button
                variant="outline"
                type="button"
                size="lg"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? "Dölj" : "Visa"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Ange en Hailey HR API-nyckel för att synkronisera
            </p>
            {lastSync.date && (
              <p className="text-xs text-muted-foreground mt-1">
                Senaste synk: {new Date(lastSync.date).toLocaleString()} -
                Status: {lastSync.status}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleSync(false)}
              disabled={isSyncing}
              className="flex-1"
              size="lg"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Synkar...
                </>
              ) : (
                "Hämta ny data"
              )}
            </Button>
            <Button
              onClick={() => handleSync(true)}
              disabled={isSyncing}
              variant="outline"
              size="lg"
            >
              Hämta all data
            </Button>
          </div>

          {syncResult && (
            <div
              className={`p-3 rounded-md ${
                syncResult.success
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <div className="flex items-start">
                {syncResult.success ? (
                  <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                )}
                <div>
                  <p className="font-medium">
                    {syncResult.success ? "Success!" : "Error"}
                  </p>
                  <p className="text-sm">{syncResult.message}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
