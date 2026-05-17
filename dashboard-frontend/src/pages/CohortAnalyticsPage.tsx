import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import Loader from "../components/ui/Loader"
import ErrorState from "../components/ui/ErrorState"
import EmptyState from "../components/ui/EmptyState"
import TrendChart from "../components/charts/TrendChart"
import { useDashboard } from "../context/DashboardContext"
import type { MentorAnalytics } from "../types/dashboard"

interface CohortStats {
    name: string
    program: string
    avgRating: number
    feedbackCount: number
    mentorCount: number
    atRisk: number
}

const cohortList = [
    { name: "AI & ML Cohort 1", program: "AI & ML" },
    { name: "AI & ML Cohort 2", program: "AI & ML" },
    { name: "Data Engineering Cohort 1", program: "Data Engineering" },
    { name: "Data Engineering Cohort 2", program: "Data Engineering" },
    { name: "MBA Analytics Cohort 1", program: "MBA Analytics" },
    { name: "MBA Analytics Cohort 2", program: "MBA Analytics" },
]

export default function CohortAnalyticsPage() {
    const { pushToast, setLastSyncTime } = useDashboard()
    const [cohortStats, setCohortStats] = useState<CohortStats[]>([])
    const [trendData, setTrendData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [selected, setSelected] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        setError(false)
        try {
            const [trendsRes, ...cohortRes] = await Promise.all([
                fetch("http://localhost:8000/mentors/trends"),
                ...cohortList.map(c =>
                    fetch(`http://localhost:8000/analytics?cohort=${encodeURIComponent(c.name)}`).then(r => r.json())
                )
            ])
            if (!trendsRes.ok) throw new Error("trends failed")
            const trends = await trendsRes.json()
            setTrendData(trends || [])

            const stats: CohortStats[] = cohortList.map((c, i) => {
                const breakdown: MentorAnalytics[] = cohortRes[i]?.mentor_breakdown || []
                return {
                    name: c.name,
                    program: c.program,
                    avgRating: cohortRes[i]?.overall_avg_rating ?? 0,
                    feedbackCount: cohortRes[i]?.total_feedback_count ?? 0,
                    mentorCount: breakdown.length,
                    atRisk: breakdown.filter((m: MentorAnalytics) => m.category === "At Risk").length,
                }
            })
            setCohortStats(stats)
            setLastSyncTime(new Date())
        } catch {
            setError(true)
            pushToast("Failed to load cohort data", "warning")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [])

    if (loading) return <Loader />
    if (error) return <ErrorState onRetry={load} />

    const programs = Array.from(new Set(cohortList.map(c => c.program)))

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="space-y-10"
        >
            <h2 className="text-3xl font-semibold">Cohort Analytics</h2>

            {cohortStats.length === 0
                ? <EmptyState icon="🎓" title="No cohort data available" message="Feedback data hasn't been synced yet." />
                : programs.map(prog => (
                    <div key={prog}>
                        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">{prog}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {cohortStats.filter(c => c.program === prog).map((c, i) => (
                                <motion.div
                                    key={c.name}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.07 }}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => setSelected(selected === c.name ? null : c.name)}
                                    className={`bg-white/5 border rounded-2xl p-6 cursor-pointer backdrop-blur-xl transition-all duration-200
                                        ${selected === c.name
                                            ? "border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                                            : "border-white/10 hover:border-white/20"}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="font-semibold text-white">{c.name}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{c.mentorCount} mentors</div>
                                        </div>
                                        {c.atRisk > 0
                                            ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">{c.atRisk} at risk</span>
                                            : <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">All healthy</span>
                                        }
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Avg Rating</div>
                                            <div className="text-xl font-bold text-blue-400 tabular-nums">{c.avgRating.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Feedback</div>
                                            <div className="text-xl font-bold text-white tabular-nums">{c.feedbackCount.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Mentors</div>
                                            <div className="text-xl font-bold text-white">{c.mentorCount}</div>
                                        </div>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-full h-1.5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(c.avgRating / 5) * 100}%` }}
                                            transition={{ duration: 0.8, delay: i * 0.07 }}
                                            className="bg-blue-500 h-1.5 rounded-full"
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))
            }

            <div>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">Session Trends — All Mentors</h3>
                {trendData.length === 0
                    ? <EmptyState icon="📈" title="No trend data yet" message="Trend data will appear after at least 2 weeks of sessions." />
                    : <TrendChart data={trendData} />
                }
            </div>
        </motion.div>
    )
}