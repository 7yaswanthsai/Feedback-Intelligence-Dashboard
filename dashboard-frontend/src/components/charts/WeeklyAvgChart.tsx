import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    ReferenceLine
} from "recharts"

export default function WeeklyAvgChart({ data, institutionalAvg }: { data: any[], institutionalAvg: number }) {

    return (
        <div className="bg-[#111827] p-6 rounded-xl border border-gray-800 h-[350px]">
            <h3 className="text-lg font-semibold mb-4">Weekly Average Rating</h3>

            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid stroke="#1F2937" />
                    <XAxis dataKey="week" stroke="#94A3B8" />
                    <YAxis domain={[1, 5]} stroke="#94A3B8" />
                    <Tooltip />
                    <Line
                        type="monotone"
                        dataKey="avg_rating"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                    <ReferenceLine
                        y={institutionalAvg}
                        stroke="#F59E0B"
                        strokeDasharray="4 4"
                    />


                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}