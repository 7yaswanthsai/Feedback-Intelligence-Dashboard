import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Area,
    AreaChart
} from "recharts"

interface Props {
    trends: any[]
    mentorId: number
    trendScore: number
}

export default function MentorTrendChart({ trends, mentorId, trendScore }: Props) {
    const mentorTrend = trends
        .filter(t => t.mentor_id === mentorId)
        .sort((a, b) => a.week_number - b.week_number)

    const trendPercent = trendScore * 100

    return (
        <div className="bg-[#111827] rounded-2xl p-6 border border-gray-800 h-[380px] relative">

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                    Weekly Performance Trend
                </h3>

                <div
                    className={`text-sm font-medium ${trendPercent > 0
                        ? "text-green-400"
                        : trendPercent < 0
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                >
                    {trendPercent > 0 ? "▲" : trendPercent < 0 ? "▼" : ""}
                    {Math.abs(trendPercent).toFixed(1)}%
                </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mentorTrend}>
                    <defs>
                        <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid stroke="#1F2937" />

                    <XAxis
                        dataKey="week_number"
                        stroke="#94A3B8"
                    />

                    <YAxis
                        domain={[1, 5]}
                        stroke="#94A3B8"
                    />

                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#1F2937",
                            border: "none",
                            borderRadius: "8px",
                            color: "white",
                        }}
                    />

                    <Area
                        type="monotone"
                        dataKey="avg_rating"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRating)"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </AreaChart>
            </ResponsiveContainer>

        </div>
    )
}