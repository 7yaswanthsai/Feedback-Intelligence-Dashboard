import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import Loader from "../components/ui/Loader"
import ErrorState from "../components/ui/ErrorState"
import EmptyState from "../components/ui/EmptyState"
import RiskQuadrant from "../components/charts/RiskQuadrant"
import { useDashboard } from "../context/DashboardContext"
import type { MentorAnalytics } from "../types/dashboard"

const categoryColor: Record<string, string> = {
    "Top Performer": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    "Stable": "text-blue-400    bg-blue-500/10    border-blue-500/30",
    "Needs Attention": "text-yellow-400  bg-yellow-500/10  border-yellow-500/30",
    "High Volatility": "text-orange-400  bg-orange-500/10  border-orange-500/30",
    "At Risk": "text-red-400     bg-red-500/10     border-red-500/30",
}

export default function MentorIntelligencePage() {
    const navigate = useNavigate()
    const { pushToast, setLastSyncTime } = useDashboard()
    const [data, setData] = useState<MentorAnalytics[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        setError(false)
        try {
            const res = await fetch("http://localhost:8000/analytics")
            if (!res.ok) throw new Error("Bad response")
            const json = await res.json()
            setData(json?.mentor_breakdown || [])
            setLastSyncTime(new Date())
        } catch {
            setError(true)
            pushToast("Failed to load mentor data", "warning")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [])

    if (loading) return <Loader />
    if (error) return <ErrorState onRetry={load} />

    const sorted = [...data].sort((a, b) => b.mpi_score - a.mpi_score)

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="space-y-10"
        >
            <h2 className="text-3xl font-semibold">Mentor Intelligence</h2>

            {/* Summary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {[
                    { label: "Total Mentors", value: data.length },
                    { label: "Top Performers", value: data.filter(m => m.category === "Top Performer").length },
                    { label: "At Risk", value: data.filter(m => m.category === "At Risk").length },
                    { label: "Avg MPI", value: data.length > 0 ? (data.reduce((a, m) => a + m.mpi_score, 0) / data.length).toFixed(3) : "—" },
                ].map(kpi => (
                    <div key={kpi.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
                        <div className="text-xs text-gray-400 mb-2">{kpi.label}</div>
                        <div className="text-2xl font-bold text-white tabular-nums">{kpi.value}</div>
                    </div>
                ))}
            </div>

            {/* Mentor Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-white">All Mentors — Ranked by MPI</h3>
                    <button
                        onClick={() => navigate("/compare")}
                        className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400
                                   hover:bg-blue-500/20 transition-all duration-200"
                    >
                        ⚖️ Compare mentors
                    </button>
                </div>

                {sorted.length === 0
                    ? <EmptyState icon="👥" title="No mentor data available" message="No feedback has been recorded yet." />
                    : (
                        <div className="divide-y divide-white/5">
                            {sorted.map((mentor, i) => {
                                const catStyle = categoryColor[mentor.category] ?? "text-gray-400 bg-gray-500/10 border-gray-500/30"
                                return (
                                    <motion.div
                                        key={mentor.mentor_id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        onClick={() => navigate(`/mentor/${mentor.mentor_id}`)}
                                        className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-white/5 transition-all duration-200 group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                                                ${i === 0 ? "bg-yellow-500 text-black" : i === 1 ? "bg-gray-400 text-black" : i === 2 ? "bg-orange-600 text-white" : "bg-white/10 text-gray-400"}`}>
                                                {i + 1}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white group-hover:text-blue-400 transition-colors">
                                                    {mentor.mentor_name}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {mentor.feedback_count.toLocaleString()} feedback · avg {mentor.avg_rating.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="hidden md:flex gap-3 items-center">
                                                {[
                                                    { label: "Q", value: mentor.quality_score, color: "bg-blue-500" },
                                                    { label: "C", value: mentor.consistency_score, color: "bg-green-500" },
                                                    { label: "R", value: mentor.reliability_score, color: "bg-purple-500" },
                                                ].map(s => (
                                                    <div key={s.label} className="flex items-center gap-1.5">
                                                        <span className="text-xs text-gray-500">{s.label}</span>
                                                        <div className="w-16 h-1.5 bg-white/10 rounded-full">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${s.value * 100}%` }}
                                                                transition={{ duration: 0.7, delay: i * 0.04 }}
                                                                className={`h-full rounded-full ${s.color}`}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <span className={`text-xs px-2.5 py-0.5 rounded-full border ${catStyle}`}>
                                                {mentor.category}
                                            </span>
                                            <div className="text-right min-w-[60px]">
                                                <div className="text-xs text-gray-500">MPI</div>
                                                <div className="text-base font-bold text-blue-400 tabular-nums">{mentor.mpi_score.toFixed(3)}</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )
                }
            </div>

            {/* Risk Quadrant */}
            {data.length > 0
                ? <RiskQuadrant data={data} />
                : <EmptyState icon="📊" title="No data for risk quadrant" />
            }
        </motion.div>
    )
}