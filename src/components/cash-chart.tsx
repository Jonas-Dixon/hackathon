import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DayPoint } from "@/lib/engine";
import { formatSek } from "@/lib/utils";

export function CashChart({ days }: { days: DayPoint[] }) {
  const data = days.slice(0, 56).map((d) => ({
    date: d.date.slice(5),
    cash: Math.round(d.endCash),
  }));

  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a7a4c" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#1a7a4c" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e4e3dc" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#8a8a82", fontSize: 10, fontFamily: "IBM Plex Mono" }}
            axisLine={false}
            tickLine={false}
            interval={13}
          />
          <YAxis
            tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            tick={{ fill: "#8a8a82", fontSize: 10, fontFamily: "IBM Plex Mono" }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e4e3dc",
              borderRadius: 10,
              fontSize: 12,
              color: "#161615",
            }}
            cursor={{ stroke: "#cdcbc2", strokeDasharray: "4 4" }}
            formatter={(v) => [formatSek(Number(v ?? 0)), "Kassa"]}
          />
          <Area
            type="monotone"
            dataKey="cash"
            stroke="#161615"
            strokeWidth={1.6}
            fill="url(#cashFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
