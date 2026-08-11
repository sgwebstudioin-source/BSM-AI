import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PricePoint } from "../data/priceHistory";

interface Props {
  data: PricePoint[];
  strike?: number;
  breakEven?: number;
}

export function PriceChart({ data, strike, breakEven }: Props) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.4)"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            tickFormatter={(v: string) => v.slice(5)}
            minTickGap={32}
          />
          <YAxis
            stroke="rgba(255,255,255,0.4)"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            domain={["dataMin", "dataMax"]}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${Math.round(v).toLocaleString("en-IN")}` : v.toFixed(0)
            }
            width={64}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(10,12,20,0.92)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "#E2E8F0",
              fontSize: 12,
            }}
            labelStyle={{ color: "#94A3B8" }}
            formatter={(v: number | string) => {
              const n = typeof v === "number" ? v : parseFloat(v as string);
              return [`₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, "Close"];
            }}
          />
          {strike !== undefined && (
            <ReferenceLine
              y={strike}
              stroke="#A3E635"
              strokeDasharray="4 4"
              label={{
                value: `K ${strike.toLocaleString("en-IN")}`,
                fill: "#A3E635",
                fontSize: 10,
                position: "insideTopRight",
              }}
            />
          )}
          {breakEven !== undefined && (
            <ReferenceLine
              y={breakEven}
              stroke="#F59E0B"
              strokeDasharray="2 4"
              label={{
                value: `BE ${breakEven.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}`,
                fill: "#F59E0B",
                fontSize: 10,
                position: "insideBottomRight",
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="close"
            stroke="#22D3EE"
            strokeWidth={2}
            fill="url(#priceFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
