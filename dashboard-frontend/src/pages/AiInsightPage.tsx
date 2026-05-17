import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import Loader from "../components/ui/Loader"
import ErrorState from "../components/ui/ErrorState"
import EmptyState from "../components/ui/EmptyState"
import { useDashboard } from "../context/DashboardContext"

interface Insight {
    mentor_name: string
    category: string
    insight: string
}

const categoryStyle: Record<string, string> = {
    "Top Performer": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    "Stable": "text-blue-400    bg-blue-500/10    border-blue-500/30",
    "Needs Attention": "text-yellow-400  bg-yellow-500/10  border-yellow-500/30",
    "High Volatility": "text-orange-400  bg-orange-500/10  border-orange-500/30",
    "At Risk": "text-red-400     bg-red-500/10     border-red-500/30",
}

const categoryIcon: Record<string, string> = {
    "Top Performer": "🏆",
    "Stable": "✅",
    "Needs Attention": "⚠️",
    "High Volatility": "📊",
    "At Risk": "🚨",
}

export default function AIInsightsPage() {
    const { pushToast, setLastSyncTime } = useDashboard()
    const [insights, setInsights] = useState<Insight[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [filter, setFilter] = useState<string>("All")

    const load = useCallback(async () => {
        setLoading(true)
        setError(false)
        try {
            const res = await fetch("http://localhost:8000/insights")
            if (!res.ok) throw new Error()
            const data = await res.json()
            setInsights(data || [])
            setLastSyncTime(new Date())
        } catch {
            setError(true)
            pushToast("Failed to load AI insights", "warning")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [])

    if (loading) return <Loader />
    if (error) return <ErrorState onRetry={load} title="Failed to load AI insights" message="The insights endpoint could not be reached. Check the backend is running." />

    const categories = ["All", "Top Performer", "Stable", "Needs Attention", "High Volatility", "At Risk"]
    const filtered = filter === "All" ? insights : insights.filter(i => i.category === filter)
    const counts = categories.slice(1).reduce((acc, cat) => {
        acc[cat] = insights.filter(i => i.category === cat).length
        return acc
    }, {} as Record<string, number>)

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
        >
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-semibold">AI Insights</h2>
                <div className="text-xs text-gray-500 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
                    {insights.length} mentor insights generated
                </div>
            </div>

            {/* Category summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {categories.slice(1).map(cat => (
                    <motion.div
                        key={cat}
                        whileHover={{ scale: 1.03 }}
                        onClick={() => setFilter(filter === cat ? "All" : cat)}
                        className={`rounded-xl p-4 border cursor-pointer transition-all duration-200
                            ${filter === cat ? categoryStyle[cat] : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"}`}
                    >
                        <div className="text-xl mb-1">{categoryIcon[cat]}</div>
                        <div className="text-lg font-bold tabular-nums">{counts[cat] ?? 0}</div>
                        <div className="text-xs mt-0.5 opacity-80 leading-tight">{cat}</div>
                    </motion.div>
                ))}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`text-xs px-4 py-1.5 rounded-full border transition-all duration-200 ${filter === cat
                                ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                                : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                            }`}
                    >
                        {cat} ({cat !== "All" ? counts[cat] ?? 0 : insights.length})
                    </button>
                ))}
            </div>

            {/* Insights */}
            {filtered.length === 0
                ? <EmptyState icon="🤖" title="No insights for this category" message="Try selecting a different filter." />
                : (
                    <div className="space-y-4">
                        {filtered.map((insight, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:border-white/20 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{categoryIcon[insight.category] ?? "📌"}</span>
                                        <span className="font-semibold text-white">{insight.mentor_name}</span>
                                    </div>
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full border ${categoryStyle[insight.category] ?? "text-gray-400 bg-white/5 border-white/10"}`}>
                                        {insight.category}
                                    </span>
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed">{insight.insight}</p>
                            </motion.div>
                        ))}
                    </div>
                )
            }
        </motion.div>
    )
}