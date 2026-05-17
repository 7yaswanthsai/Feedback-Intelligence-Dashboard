import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts"

interface TrendPoint {
    mentor_name: string
    week_number: number
    avg_rating: number
}

interface Props {
    data: TrendPoint[]
}

export default function TrendChart({ data }: Props) {
    const weeks = Array.from(
        new Set(data.map((d) => d.week_number))
    ).sort((a, b) => a - b)

    const mentors = Array.from(
        new Set(data.map((d) => d.mentor_name))
    ).slice(0, 3)

    const formatted = weeks.map((week) => {
        const weekData: any = { week }

        mentors.forEach((mentor) => {
            const found = data.find(
                (d) =>
                    d.week_number === week &&
                    d.mentor_name === mentor
            )
            weekData[mentor] = found?.avg_rating || null
        })

        return weekData
    })

    return (
        <div className="relative bg-[#111827] rounded-xl shadow-lg border border-gray-800 p-6 h-[500px] overflow-hidden">
            <h3 className="text-lg font-semibold mb-4">
                Weekly Performance Trends
            </h3>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10 pointer-events-none"></div>

            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formatted}>
                    <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />

                    <XAxis
                        dataKey="week"
                        tick={{ fill: "#94A3B8", fontSize: 12 }}
                    />

                    <YAxis
                        domain={[1, 5]}
                        tick={{ fill: "#94A3B8", fontSize: 12 }}
                    />

                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#0F172A",
                            border: "1px solid #1E293B",
                            borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#E2E8F0" }}
                    />

                    {/* <Legend
                        wrapperStyle={{
                            fontSize: "12px",
                        }}
                    /> */}

                    {mentors.map((mentor, index) => {
                        const colors = [
                            "#3B82F6",
                            "#22C55E",
                            "#F59E0B",
                            "#EF4444",
                            "#A855F7",
                            "#06B6D4",
                            "#F97316",
                            "#8B5CF6",
                        ]

                        return (
                            <Line
                                key={mentor}
                                type="monotone"
                                dataKey={mentor}
                                stroke={colors[index % colors.length]}
                                strokeWidth={3}
                                dot={false}
                                activeDot={{ r: 6 }}
                                isAnimationActive={true}
                                animationDuration={800}
                            />
                        )
                    })}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}