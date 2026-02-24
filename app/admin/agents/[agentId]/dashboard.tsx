"use client";

import { useEffect, useState, useCallback } from "react";
import saGetAgentDashboardData from "@/actions/saGetAgentDashboardData";
import saGetAgentDashboardHourlyData from "@/actions/saGetAgentDashboardHourlyData";
import saGetAgentDashboardWeekdayData from "@/actions/saGetAgentDashboardWeekdayData";
import saGetAgentEarliestMessageDate from "@/actions/saGetAgentEarliestMessageDate";
import saGetAgentDashboardSummary from "@/actions/saGetAgentDashboardSummary";
import saGetAgentDashboardSessionsPerDay from "@/actions/saGetAgentDashboardSessionsPerDay";
import saGetAgentDashboardNewVsReturning from "@/actions/saGetAgentDashboardNewVsReturning";
import saGetAgentDashboardTopUsers from "@/actions/saGetAgentDashboardTopUsers";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import DateRangePicker from "@/components/shared/DateRangePicker";
import {
  Users,
  UserPlus,
  MessageSquare,
  Clock,
  DollarSign,
} from "lucide-react";

interface DashboardProps {
  agentId: string;
}

interface DailyChartData {
  date: string;
  count: number;
  displayDate: string;
}

interface HourlyChartData {
  hour: number;
  avgCount: number;
  displayHour: string;
}

interface WeekdayChartData {
  dayOfWeek: number;
  dayName: string;
  avgCount: number;
}

interface SummaryStats {
  totalUniqueUsers: number;
  newUsers: number;
  totalSessions: number;
  avgResponseTimeMs: number | null;
  totalCost: number;
  errorRate: number;
  totalMessages: number;
}

interface SessionsChartData {
  date: string;
  count: number;
  displayDate: string;
}

interface NewVsReturningChartData {
  date: string;
  newUsers: number;
  returningUsers: number;
  displayDate: string;
}

interface TopUser {
  userId: string;
  name: string | null;
  number: string | null;
  messageCount: number;
  sessionCount: number;
}

const HOUR_LABELS = [
  "12am",
  "1am",
  "2am",
  "3am",
  "4am",
  "5am",
  "6am",
  "7am",
  "8am",
  "9am",
  "10am",
  "11am",
  "12pm",
  "1pm",
  "2pm",
  "3pm",
  "4pm",
  "5pm",
  "6pm",
  "7pm",
  "8pm",
  "9pm",
  "10pm",
  "11pm",
];

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const getDefaultFrom = (): Date => {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getDefaultTo = (): Date => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

const formatMs = (ms: number): string => {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const formatCost = (cost: number): string => {
  return `$${cost.toFixed(4)}`;
};

// Helper to fill in zero-count days for a date range
const fillDailyGaps = (
  data: Record<string, any>[],
  fromDate: Date,
  toDate: Date,
  defaults: Record<string, any>,
): Record<string, any>[] => {
  const dataMap = new Map(
    data.map((item) => {
      const dateStr =
        typeof item.date === "string"
          ? item.date.split("T")[0]
          : new Date(item.date).toISOString().split("T")[0];
      return [dateStr, item];
    }),
  );

  const result: Record<string, any>[] = [];
  const current = new Date(fromDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(toDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    const existing = dataMap.get(dateStr);
    result.push({
      date: dateStr,
      displayDate: format(current, "MMM d"),
      ...defaults,
      ...(existing || {}),
    });
    current.setDate(current.getDate() + 1);
  }
  return result;
};

const Dashboard = ({ agentId }: DashboardProps) => {
  const [fromDate, setFromDate] = useState<Date>(getDefaultFrom);
  const [toDate, setToDate] = useState<Date>(getDefaultTo);
  const [loading, setLoading] = useState(true);
  const [earliestDate, setEarliestDate] = useState<Date | undefined>(undefined);

  // Data states
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [dailyData, setDailyData] = useState<DailyChartData[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyChartData[]>([]);
  const [weekdayData, setWeekdayData] = useState<WeekdayChartData[]>([]);
  const [sessionsData, setSessionsData] = useState<SessionsChartData[]>([]);
  const [newVsReturningData, setNewVsReturningData] = useState<
    NewVsReturningChartData[]
  >([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);

  // Fetch earliest message date once on mount
  useEffect(() => {
    saGetAgentEarliestMessageDate({ agentId }).then((dateStr) => {
      if (dateStr) setEarliestDate(new Date(dateStr));
    });
  }, [agentId]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const fromStr = fromDate.toISOString();
      const toStr = toDate.toISOString();

      const [
        summaryResult,
        dailyResult,
        hourlyResult,
        weekdayResult,
        sessionsResult,
        newVsReturningResult,
        topUsersResult,
      ] = await Promise.all([
        saGetAgentDashboardSummary({ agentId, from: fromStr, to: toStr }),
        saGetAgentDashboardData({ agentId, from: fromStr, to: toStr }),
        saGetAgentDashboardHourlyData({ agentId, from: fromStr, to: toStr }),
        saGetAgentDashboardWeekdayData({ agentId, from: fromStr, to: toStr }),
        saGetAgentDashboardSessionsPerDay({
          agentId,
          from: fromStr,
          to: toStr,
        }),
        saGetAgentDashboardNewVsReturning({
          agentId,
          from: fromStr,
          to: toStr,
        }),
        saGetAgentDashboardTopUsers({ agentId, from: fromStr, to: toStr }),
      ]);

      setSummary(summaryResult);

      // Daily messages
      setDailyData(
        fillDailyGaps(dailyResult, fromDate, toDate, {
          count: 0,
        }) as DailyChartData[],
      );

      // Sessions per day
      setSessionsData(
        fillDailyGaps(sessionsResult, fromDate, toDate, {
          count: 0,
        }) as SessionsChartData[],
      );

      // New vs returning users
      setNewVsReturningData(
        fillDailyGaps(newVsReturningResult, fromDate, toDate, {
          newUsers: 0,
          returningUsers: 0,
        }) as NewVsReturningChartData[],
      );

      // Hourly
      const hourlyMap = new Map(
        hourlyResult.map((item) => [item.hour, item.avgCount]),
      );
      const allHours: HourlyChartData[] = [];
      for (let h = 0; h < 24; h++) {
        allHours.push({
          hour: h,
          avgCount: hourlyMap.get(h) || 0,
          displayHour: HOUR_LABELS[h],
        });
      }
      setHourlyData(allHours);

      // Weekday
      const weekdayMap = new Map(
        weekdayResult.map((item) => [item.dayOfWeek, item.avgCount]),
      );
      const allWeekdays: WeekdayChartData[] = [];
      for (let d = 0; d < 7; d++) {
        allWeekdays.push({
          dayOfWeek: d,
          dayName: DAY_NAMES[d],
          avgCount: weekdayMap.get(d) || 0,
        });
      }
      setWeekdayData(allWeekdays);

      setTopUsers(topUsersResult);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [agentId, fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Chart configs
  const dailyChartConfig = {
    count: { label: "User Messages", color: "#00a9ff" },
  };
  const sessionsChartConfig = {
    count: { label: "Sessions", color: "#8b5cf6" },
  };
  const hourlyChartConfig = {
    avgCount: { label: "Avg Messages", color: "#10b981" },
  };
  const weekdayChartConfig = {
    avgCount: { label: "Avg Messages", color: "#f59e0b" },
  };
  const newVsReturningConfig = {
    newUsers: { label: "New Users", color: "#10b981" },
    returningUsers: { label: "Returning Users", color: "#6366f1" },
  };

  return (
    <div className="space-y-4">
      <DateRangePicker
        from={fromDate}
        to={toDate}
        onFromChange={setFromDate}
        onToChange={setToDate}
        earliestDate={earliestDate}
      />

      {loading ? (
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>Loading dashboard data...</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary KPI cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Card className="py-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Unique Users
                    </p>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {summary.totalUniqueUsers.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="py-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">New Users</p>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {summary.newUsers.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="py-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Sessions</p>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {summary.totalSessions.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="py-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Avg Response
                    </p>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {summary.avgResponseTimeMs !== null
                      ? formatMs(summary.avgResponseTimeMs)
                      : "N/A"}
                  </p>
                </CardContent>
              </Card>
              <Card className="py-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {formatCost(summary.totalCost)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Daily messages chart */}
          <Card>
            <CardHeader>
              <CardTitle>User Messages</CardTitle>
              <CardDescription>
                {summary?.totalMessages.toLocaleString() ?? 0} messages in the
                selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={dailyChartConfig}
                className="h-[300px] w-full"
              >
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="displayDate"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                  <ChartTooltip
                    content={<ChartTooltipContent className="min-w-[150px]" />}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Sessions per day */}
          <Card>
            <CardHeader>
              <CardTitle>Sessions per Day</CardTitle>
              <CardDescription>
                Number of new sessions created each day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={sessionsChartConfig}
                className="h-[300px] w-full"
              >
                <BarChart data={sessionsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="displayDate"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                  <ChartTooltip
                    content={<ChartTooltipContent className="min-w-[150px]" />}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* New vs Returning Users */}
          <Card>
            <CardHeader>
              <CardTitle>New vs Returning Users</CardTitle>
              <CardDescription>
                Daily breakdown of new and returning users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={newVsReturningConfig}
                className="h-[300px] w-full"
              >
                <BarChart data={newVsReturningData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="displayDate"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                  <ChartTooltip
                    content={<ChartTooltipContent className="min-w-[150px]" />}
                  />
                  <Bar
                    dataKey="newUsers"
                    fill="var(--color-newUsers)"
                    stackId="users"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="returningUsers"
                    fill="var(--color-returningUsers)"
                    stackId="users"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Hourly and weekday charts side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Average Messages per Hour</CardTitle>
                <CardDescription>
                  Average volume of messages by hour of day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={hourlyChartConfig}
                  className="h-[300px] w-full"
                >
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="displayHour"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent className="min-w-[150px]" />
                      }
                    />
                    <Bar
                      dataKey="avgCount"
                      fill="var(--color-avgCount)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Messages per Day of Week</CardTitle>
                <CardDescription>
                  Average volume of messages by day (Sunday – Saturday)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={weekdayChartConfig}
                  className="h-[300px] w-full"
                >
                  <BarChart data={weekdayData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="dayName"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent className="min-w-[150px]" />
                      }
                    />
                    <Bar
                      dataKey="avgCount"
                      fill="var(--color-avgCount)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Users table */}
          {topUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Users</CardTitle>
                <CardDescription>
                  Most active users in the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Number</TableHead>
                      <TableHead className="text-right">Messages</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topUsers.map((user) => (
                      <TableRow key={user.userId}>
                        <TableCell>{user.name || "—"}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {user.number || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {user.messageCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {user.sessionCount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
