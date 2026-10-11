import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function Tip({ active, payload, label, field }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-md border border-navy-600 bg-navy-900 p-2 text-xs shadow-lg">
      <p className="font-mono text-white">|{label}⟩</p>
      <p className="text-slate-300">p = {row[field].toFixed(4)}</p>
      <p className="text-slate-400">{row[`${field}Count`]} counts</p>
    </div>
  );
}

export default function Histogram({ title, field, rows, color, shots }) {
  return (
    <figure className="rounded-xl border border-navy-700 bg-navy-800 p-4">
      <figcaption className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-white">{title}</span>
        <span className="text-xs text-slate-500">{shots.toLocaleString()} shots</span>
      </figcaption>
      <div className="h-64" role="img" aria-label={`${title} measurement probabilities: ${rows.map((r) => `${r.state} ${r[field].toFixed(3)}`).join(", ")}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="#26345f" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="state" stroke="#94a3b8" tick={{ fontFamily: "monospace", fontSize: 12 }} />
            <YAxis domain={[0, 1]} stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(v) => v.toFixed(1)} />
            <Tooltip content={<Tip field={field} />} cursor={{ fill: "rgba(148,163,184,0.08)" }} />
            <Bar dataKey={field} fill={color} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
