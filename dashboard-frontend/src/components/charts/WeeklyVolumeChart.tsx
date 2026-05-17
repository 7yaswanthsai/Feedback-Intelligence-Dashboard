import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts"

export default function WeeklyVolumeChart({ data }: { data: any[] }) {

  return (
    <div className="bg-[#111827] p-6 rounded-xl border border-gray-800 h-[350px]">
      <h3 className="text-lg font-semibold mb-4">Weekly Feedback Volume</h3>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#1F2937" />
          <XAxis dataKey="week" stroke="#94A3B8" />
          <YAxis stroke="#94A3B8" />
          <Tooltip />
          <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}