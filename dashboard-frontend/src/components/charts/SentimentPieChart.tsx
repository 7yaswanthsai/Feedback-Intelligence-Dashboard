import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from "recharts"

interface SentimentData {
    positive: number
    neutral: number
    negative: number
}

interface Props {
    data: SentimentData
}

const COLORS = ["#10B981", "#F59E0B", "#EF4444"]

export default function SentimentPieChart({ data }: Props) {
    if (!data) return null

    const chartData = [
        { name: "Positive", value: data.positive || 0 },
        { name: "Neutral", value: data.neutral || 0 },
        { name: "Negative", value: data.negative || 0 },
    ]

    return (
        <div className="bg-[#111827] p-6 rounded-2xl border border-gray-800 shadow-lg">
            <h3 className="text-sm text-gray-400 mb-4">
                Sentiment Distribution
            </h3>

            <div className="h-64">

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            innerRadius={75}
                            outerRadius={110}
                            paddingAngle={0}        // 🔹 No gaps
                            stroke="none"           // 🔹 No borders
                            dataKey="value"
                            isAnimationActive
                        >
                            {chartData.map((_, index) => (
                                <Cell key={index} fill={COLORS[index]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>

            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-6 text-sm">

                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-gray-300">
                        Positive ({data.positive}%)
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span className="text-gray-300">
                        Neutral ({data.neutral}%)
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="text-gray-300">
                        Negative ({data.negative}%)
                    </span>
                </div>

            </div>
        </div>
    )
}