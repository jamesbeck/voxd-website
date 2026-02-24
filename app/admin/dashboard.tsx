"use client";

import { useEffect, useState } from "react";
import saGetAgentDashboardData from "@/actions/saGetAgentDashboardData";
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
import { format } from "date-fns";

interface DashboardProps {
  agentId: string;
}

interface ChartData {
  date: string;
  count: number;
  displayDate: string;
}

const Dashboard = ({ agentId }: DashboardProps) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const to = new Date();
        to.setHours(23, 59, 59, 999);
        const from = new Date();
        from.setDate(from.getDate() - 29);
        from.setHours(0, 0, 0, 0);

        const result = await saGetAgentDashboardData({
          agentId,
          from: from.toISOString(),
          to: to.toISOString(),
        });

        // Create a map of existing data by date (normalize date strings)
        const dataMap = new Map(
          result.map((item) => {
            // Convert date to YYYY-MM-DD format if it's not already
            const dateStr =
              typeof item.date === "string"
                ? item.date.split("T")[0]
                : new Date(item.date).toISOString().split("T")[0];
            return [dateStr, item.count];
          }),
        );

        // Generate all dates for the last 30 days
        const allDates: ChartData[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset to start of day

        for (let i = 29; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD format

          allDates.push({
            date: dateStr,
            count: dataMap.get(dateStr) || 0,
            displayDate: format(date, "MMM d"),
          });
        }

        setData(allDates);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [agentId]);

  const chartConfig = {
    count: {
      label: "User Messages",
      color: "#00a9ff", // Using the primary color directly
    },
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Messages</CardTitle>
          <CardDescription>Loading dashboard data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const totalMessages = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Messages</CardTitle>
        <CardDescription>
          {totalMessages.toLocaleString()} messages in the last 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data}>
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
  );
};

export default Dashboard;
