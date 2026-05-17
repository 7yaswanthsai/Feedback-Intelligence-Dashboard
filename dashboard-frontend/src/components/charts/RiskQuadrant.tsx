import { ReferenceLine } from "recharts"
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import type { MentorAnalytics } from "../../types/dashboard"

interface Props {
    data: MentorAnalytics[]
}

interface Mentor {
    mentor_id: number
    mentor_name: string
    quality_score: number
    consistency_score: number
    category: string
}


export default function RiskQuadrant({ data }: Props) {
    const getColor = (category: string) => {
        if (category === "Stable") return "#3B82F6"
        if (category === "At Risk") return "#EF4444"
        if (category === "Needs Attention") return "#F59E0B"
        return "#9CA3AF"
    }

    return (
        <div className="relative rounded-2xl p-6 h-[400px]
                bg-white/5 backdrop-blur-xl
                border border-white/10
                shadow-[0_0_80px_rgba(59,130,246,0.05)]
                overflow-hidden">            <h3 className="text-lg font-semibold mb-4">
                Performance Risk Quadrant
            </h3>

            <div className="absolute top-4 right-6 text-xs text-green-400 opacity-60">
                Elite Zone
            </div>

            {/* Quadrant background zones */}
            <div className="absolute inset-6 grid grid-cols-2 grid-rows-2 pointer-events-none">

                <div className="bg-blue-500/5 border border-blue-500/10" />
                <div className="bg-green-500/5 border border-green-500/10" />
                <div className="bg-red-500/5 border border-red-500/10" />
                <div className="bg-yellow-500/5 border border-yellow-500/10" />

            </div>

            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>

                    <ReferenceLine x={0.7} stroke="#334155" strokeDasharray="4 4" />
                    <ReferenceLine y={0.7} stroke="#334155" strokeDasharray="4 4" />
                    <CartesianGrid stroke="#1F2937" />

                    <XAxis
                        type="number"
                        dataKey="quality_score"
                        name="Quality"
                        domain={[0, 1]}
                        tick={{ fill: "#94A3B8", fontSize: 12 }}
                    />

                    <YAxis
                        type="number"
                        dataKey="consistency_score"
                        name="Consistency"
                        domain={[0, 1]}
                        tick={{ fill: "#94A3B8", fontSize: 12 }}
                    />

                    <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        contentStyle={{
                            backgroundColor: "#476999ff",
                            border: "none",
                            color: "white",
                        }}
                    />

                    <Scatter
                        data={data}
                        fill="#3B82F6"
                        shape={(props: any) => {
                            const { cx, cy, payload } = props
                            return (
                                <g>
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={14}
                                        fill={getColor(payload.category)}
                                        opacity={0.15}
                                    />
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={8}
                                        fill={getColor(payload.category)}
                                    />
                                </g>
                            )
                        }}
                    />
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    )
}