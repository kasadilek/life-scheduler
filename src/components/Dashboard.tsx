"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDuration, formatHours } from "@/lib/utils";

type SummaryItem = {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  totalSeconds: number;
};

type EntryItem = {
  id: string;
  startedAt: string;
  stoppedAt: string;
  duration: number;
  note: string | null;
  category: { name: string; color: string; icon: string };
};

type DashboardData = {
  entries: EntryItem[];
  summary: SummaryItem[];
  range: string;
  start: string;
  end: string;
};

export default function Dashboard({ refreshKey }: { refreshKey: number }) {
  const [range, setRange] = useState<"day" | "week" | "month">("day");
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/entries?range=${range}`);
    setData(await res.json());
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const totalSeconds = data?.summary.reduce((sum, s) => sum + s.totalSeconds, 0) || 0;

  const rangeLabels = { day: "Today", week: "This Week", month: "This Month" };

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex gap-2">
        {(["day", "week", "month"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              range === r
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {rangeLabels[r]}
          </button>
        ))}
      </div>

      {/* Total time */}
      <div className="text-center py-4">
        <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Total {rangeLabels[range]}
        </div>
        <div className="text-4xl font-bold mt-1">
          {formatHours(totalSeconds)}h
        </div>
      </div>

      {/* Category breakdown bar */}
      {totalSeconds > 0 && (
        <div className="h-4 rounded-full overflow-hidden flex">
          {data?.summary.map((s) => (
            <div
              key={s.categoryId}
              className="h-full transition-all"
              style={{
                backgroundColor: s.color,
                width: `${(s.totalSeconds / totalSeconds) * 100}%`,
              }}
              title={`${s.name}: ${formatDuration(s.totalSeconds)}`}
            />
          ))}
        </div>
      )}

      {/* Category list */}
      <div className="space-y-3">
        {data?.summary.map((s) => (
          <div key={s.categoryId} className="flex items-center gap-3">
            <span className="text-xl">{s.icon}</span>
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="font-medium">{s.name}</span>
                <span className="text-gray-500 dark:text-gray-400 font-mono text-sm">
                  {formatDuration(s.totalSeconds)}
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    backgroundColor: s.color,
                    width: `${(s.totalSeconds / totalSeconds) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}

        {(!data?.summary || data.summary.length === 0) && (
          <p className="text-center text-gray-400 dark:text-gray-500 py-8">
            No activity tracked {range === "day" ? "today" : `this ${range}`} yet.
            Start a timer above!
          </p>
        )}
      </div>

      {/* Recent entries */}
      {data?.entries && data.entries.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Recent Activity
          </h3>
          <div className="space-y-2">
            {data.entries.slice(0, 10).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <span>{entry.category.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{entry.category.name}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(entry.startedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    –{" "}
                    {new Date(entry.stoppedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                  {formatDuration(entry.duration)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
