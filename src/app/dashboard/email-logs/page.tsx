"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { Mail, CheckCircle2, XCircle, Search, Clock, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EmailLogsPage() {
  const { data, error, mutate, isLoading } = useSWR("/api/dashboard/email-logs", fetcher);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTriggering, setIsTriggering] = useState(false);

  const handleTriggerCron = async () => {
    setIsTriggering(true);
    try {
      const res = await fetch("/api/cron/reminders");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to trigger cron");
      toast.success(`Cron executed successfully. Sent ${json.emailsSent} emails.`);
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to execute cron");
    } finally {
      setIsTriggering(false);
    }
  };

  const logs = data?.logs || [];
  const stats = data?.stats || { total: 0, sent: 0, failed: 0 };

  const filteredLogs = logs.filter((log: any) => 
    log.candidate?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Email Logs</h1>
          <p className="text-muted-foreground mt-1">Track automated email deliveries and system notifications.</p>
        </div>
        <Button 
          onClick={handleTriggerCron} 
          disabled={isTriggering}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg"
        >
          {isTriggering ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Mail className="mr-2 h-4 w-4" />
          )}
          Trigger Reminder Cron Now
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-card border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Emails Logged</p>
              <h3 className="text-2xl font-bold text-foreground">{stats.total}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-card border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Successfully Sent</p>
              <h3 className="text-2xl font-bold text-foreground">{stats.sent}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-card border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Failed Deliveries</p>
              <h3 className="text-2xl font-bold text-foreground">{stats.failed}</h3>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card border-border shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search logs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border-input h-10 text-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/20">
            <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No email logs found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 font-medium">Candidate</th>
                  <th className="pb-3 font-medium">Email Type</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Sent Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.map((log: any) => (
                  <tr key={log.id} className="text-sm text-foreground hover:bg-muted/50 transition-colors">
                    <td className="py-4 font-medium">
                      {log.candidate?.name || "Unknown"}
                      <div className="text-xs text-muted-foreground font-normal mt-0.5">
                        {log.candidate?.employeeId || "No ID"}
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-semibold">
                        {log.type.replace("REMINDER_", "").replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4">
                      {log.status === "SENT" ? (
                        <span className="flex items-center text-emerald-500 font-medium">
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Sent
                        </span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="flex items-center text-red-500 font-medium">
                            <XCircle className="w-4 h-4 mr-1.5" /> Failed
                          </span>
                          {log.error && <span className="text-[10px] text-red-400 mt-1 max-w-[150px] truncate" title={log.error}>{log.error}</span>}
                        </div>
                      )}
                    </td>
                    <td className="py-4 text-muted-foreground flex items-center">
                      <Clock className="w-4 h-4 mr-1.5 opacity-50" />
                      {formatDistanceToNow(new Date(log.sentAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
