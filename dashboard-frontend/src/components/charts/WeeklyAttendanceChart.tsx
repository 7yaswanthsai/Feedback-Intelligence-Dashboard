import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from "recharts"

export default function WeeklyAttendanceChart({ data }: { data: any[] }) {
    return (
        <div className="bg-[#111827] p-6 rounded-xl border border-gray-800 h-[350px]">
            <h3 className="text-lg font-semibold mb-4">Weekly Attendance</h3>

            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid stroke="#1F2937" />
                    <XAxis dataKey="week" stroke="#94A3B8" />
                    <YAxis stroke="#94A3B8" />
                    <Tooltip />
                    <Line
                        type="monotone"
                        dataKey="attendance"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}