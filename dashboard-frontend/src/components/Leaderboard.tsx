import { motion } from "framer-motion"
import type { MentorAnalytics } from "../types/dashboard"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import { useNavigate } from "react-router-dom"

interface MentorTrend {
    mentor_id: number
    week_number: number
    avg_rating: number
}

interface Props {
    data: MentorAnalytics[]
    trends: MentorTrend[]
}

export default function Leaderboard({ data, trends }: Props) {
    const navigate = useNavigate()
    const sorted = [...data].sort((a, b) => b.mpi_score - a.mpi_score)

    return (
        <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] 
                    rounded-2xl border border-gray-800 
                    shadow-[0_0_60px_rgba(59,130,246,0.05)] 
                    overflow-hidden">

            <div className="px-6 py-5 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white">
                    Mentor Intelligence Ranking
                </h3>
            </div>

            <div className="divide-y divide-gray-800">
                {sorted.map((mentor, index) => (
                    <motion.div
                        key={mentor.mentor_id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => navigate(`/mentor/${mentor.mentor_id}`)}
                        className="
                        flex justify-between items-center px-6 py-5
                        cursor-pointer
                        transition-all duration-300
                        hover:bg-[#111827]
                        hover:shadow-[0_0_25px_rgba(59,130,246,0.08)]
                        hover:scale-[1.01]
                        group
                        "
                    >

                        {/* Left Section */}
                        <div className="flex items-center gap-4">

                            <RankMedal rank={index + 1} />

                            <div>
                                <div className="font-medium text-white">
                                    {mentor.mentor_name}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    Rating {mentor.avg_rating.toFixed(2)} •
                                    Confidence {mentor.confidence_score.toFixed(2)}
                                </div>
                                {mentor.consistency_score < 0.6 && (
                                    <div className="text-xs text-yellow-400 mt-1">
                                        High Volatility
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Section */}
                        <div className="grid grid-cols-[120px_110px_120px_150px] items-center gap-6">

                            <TrendIndicator trend={mentor.trend_score ?? 0} />

                            <Sparkline mentorId={mentor.mentor_id} trends={trends} />

                            <div className="text-right group-hover:translate-x-1 
                                            group-hover:drop-shadow-[0_0_12px_rgba(59,130,246,0.9)]
                                            transition-all duration-300">
                                <div className="text-xs text-gray-500 tracking-wider opacity-70">
                                    MPI
                                </div>
                                <div className="text-2xl font-semibold text-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]">
                                    {mentor.mpi_score.toFixed(3)}
                                </div>
                            </div>

                            <CategoryBadge category={mentor.category} />

                        </div>

                    </motion.div>
                ))}
            </div>
        </div>
    )
}

function RankMedal({ rank }: { rank: number }) {
    let bg = "bg-gray-700"
    if (rank === 1) bg = "bg-yellow-500"
    if (rank === 2) bg = "bg-gray-400"
    if (rank === 3) bg = "bg-orange-600"

    return (
        <div className={`w-8 h-8 flex items-center justify-center 
                     text-xs font-bold rounded-full ${bg}`}>
            {rank}
        </div>
    )
}

function CategoryBadge({ category }: { category: string }) {
    let style =
        "bg-gray-700 text-gray-300"

    if (category === "Stable")
        style = "bg-blue-500/20 text-blue-400 border border-blue-400/40 shadow-[0_0_10px_rgba(59,130,246,0.3)]"

    if (category === "At Risk")
        style = "bg-red-500/20 text-red-400 border border-red-400/40 shadow-[0_0_10px_rgba(239,68,68,0.45)]"

    if (category === "Needs Attention")
        style = "bg-yellow-500/20 text-yellow-400 border border-yellow-400/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]"

    return (
        <span className={`px-3 py-1 text-xs rounded-full text-center w-[150px] ${style}`}>
            {category}
        </span>
    )
}

function TrendIndicator({ trend }: { trend: number }) {

    const percent = Math.round(trend * 1000) / 10

    let direction: "up" | "down" | "flat" = "flat"

    if (percent > 0) direction = "up"
    if (percent < 0) direction = "down"

    let color =
        direction === "up"
            ? "text-green-400"
            : direction === "down"
                ? "text-red-400"
                : "text-yellow-400"

    return (
        <div className="flex items-center gap-2 min-w-[100px]">

            <motion.div
                animate={{
                    y: direction === "up"
                        ? [-2, 2, -2]
                        : direction === "down"
                            ? [2, -2, 2]
                            : 0
                }}
                transition={{
                    repeat: Infinity,
                    duration: 1.5
                }}
                className={`text-lg ${color}`}
            >
                {direction === "up" && "▲"}
                {direction === "down" && "▼"}
                {direction === "flat" && "—"}
            </motion.div>

            <div className={`text-sm ${color}`}>
                {percent.toFixed(1)}%
            </div>

        </div>
    )
}

function Sparkline({ mentorId, trends }: { mentorId: number; trends: MentorTrend[] }) {

    const mentorTrend = trends
        .filter(t => t.mentor_id === mentorId)
        .sort((a, b) => a.week_number - b.week_number)

    if (mentorTrend.length < 2) {
        return <div className="w-24 h-10" />
    }

    const last = mentorTrend[mentorTrend.length - 1].avg_rating
    const prev = mentorTrend[mentorTrend.length - 2].avg_rating

    const delta = Math.round((last - prev) * 100) / 100

    const isUp = delta > 0
    const isDown = delta < 0
    const isFlat = delta === 0

    const color = isUp
        ? "#22c55e"
        : isDown
            ? "#ef4444"
            : "#facc15"

    return (
        <div className="w-24 h-10 opacity-70 hover:opacity-100 transition duration-200">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mentorTrend}>
                    <Line
                        type="monotone"
                        dataKey="avg_rating"
                        stroke={color}
                        strokeWidth={2.5}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}