import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  data: { price: number; pnl: number }[];
  spot: number;
  breakEven: number;
}

export function PayoffChart({ data, spot, breakEven }: Props) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="pnlPos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A3E635" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#A3E635" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="price"
            type="number"
            domain={["dataMin", "dataMax"]}
            stroke="rgba(255,255,255,0.4)"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            tickFormatter={(v: number) =>
              v >= 1000 ? Math.round(v).toLocaleString("en-IN") : v.toFixed(0)
            }
          />
          <YAxis
            stroke="rgba(255,255,255,0.4)"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            tickFormatter={(v: number) => v.toFixed(0)}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(10,12,20,0.92)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "#E2E8F0",
              fontSize: 12,
            }}
            labelFormatter={(v: number | string) => {
              const n = typeof v === "number" ? v : parseFloat(v as string);
              return `Spot ₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
            }}
            formatter={(v: number | string) => {
              const n = typeof v === "number" ? v : parseFloat(v as string);
              return [`₹${n.toFixed(2)}`, "P&L at expiry"];
            }}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
          <ReferenceLine
            x={spot}
            stroke="#22D3EE"
            strokeDasharray="3 3"
            label={{ value: "Spot", fill: "#22D3EE", fontSize: 10, position: "top" }}
          />
          <ReferenceLine
            x={breakEven}
            stroke="#F59E0B"
            strokeDasharray="3 3"
            label={{ value: "Break-even", fill: "#F59E0B", fontSize: 10, position: "top" }}
          />
          <Area dataKey="pnl" stroke="#A3E635" strokeWidth={2} fill="url(#pnlPos)" />
          <Line dataKey="pnl" stroke="transparent" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
