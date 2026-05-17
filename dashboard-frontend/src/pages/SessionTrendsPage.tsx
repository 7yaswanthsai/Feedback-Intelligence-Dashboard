import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import {
    LineChart, Line, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, Legend
} from "recharts"
import Loader from "../components/ui/Loader"
import ErrorState from "../components/ui/ErrorState"
import EmptyState from "../components/ui/EmptyState"
import { useDashboard } from "../context/DashboardContext"

interface TrendPoint {
    mentor_id: number
    mentor_name: string
    week_number: number
    avg_rating: number
}

const COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#A855F7", "#06B6D4", "#F97316", "#8B5CF6"]

export default function SessionTrendsPage() {
    const { pushToast, setLastSyncTime } = useDashboard()
    const [trendData, setTrendData] = useState<TrendPoint[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [visibleMentors, setVisibleMentors] = useState<Set<string>>(new Set())

    const load = useCallback(async () => {
        setLoading(true)
        setError(false)
        try {
            const res = await fetch("http://localhost:8000/mentors/trends")
            if (!res.ok) throw new Error()
            const data: TrendPoint[] = await res.json()
            setTrendData(data || [])
            const names = Array.from(new Set(data.map(d => d.mentor_name)))
            setVisibleMentors(new Set(names))
            setLastSyncTime(new Date())
        } catch {
            setError(true)
            pushToast("Failed to load trend data", "warning")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [])

    if (loading) return <Loader />
    if (error) return <ErrorState onRetry={load} />

    const mentors = Array.from(new Set(trendData.map(d => d.mentor_name)))
    const weeks = Array.from(new Set(trendData.map(d => d.week_number))).sort((a, b) => a - b)

    const formatted = weeks.map(week => {
        const row: any = { week: `W${week}` }
        mentors.forEach(name => {
            const found = trendData.find(d => d.week_number === week && d.mentor_name === name)
            row[name] = found?.avg_rating ?? null
        })
        return row
    })

    const institutionWeekly = weeks.map(week => {
        const pts = trendData.filter(d => d.week_number === week)
        const avg = pts.length > 0 ? pts.reduce((a, d) => a + d.avg_rating, 0) / pts.length : null
        return { week: `W${week}`, avg: avg ? parseFloat(avg.toFixed(2)) : null }
    })

    const toggleMentor = (name: string) => {
        setVisibleMentors(prev => {
            const next = new Set(prev)
            next.has(name) ? next.delete(name) : next.add(name)
            return next
        })
    }

    const tooltipStyle = {
        contentStyle: { backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "8px" },
        labelStyle: { color: "#E2E8F0" }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="space-y-10"
        >
            <h2 className="text-3xl font-semibold">Session Trends</h2>

            {trendData.length === 0 ? (
                <EmptyState icon="📈" title="No trend data yet" message="Trend data will appear after sessions are recorded." />
            ) : (
                <>
                    {/* Institution-wide avg */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-5">
                            Institution-Wide Weekly Average
                        </h3>
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={institutionWeekly}>
                                    <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
                                    <XAxis dataKey="week" tick={{ fill: "#94A3B8", fontSize: 12 }} />
                                    <YAxis domain={[1, 5]} tick={{ fill: "#94A3B8", fontSize: 12 }} />
                                    <Tooltip {...tooltipStyle} />
                                    <Line type="monotone" dataKey="avg" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Per-mentor with toggles */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest">Per-Mentor Trends</h3>
                            <span className="text-xs text-gray-600">Click to toggle</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {mentors.map((name, i) => (
                                <button
                                    key={name}
                                    onClick={() => toggleMentor(name)}
                                    className="text-xs px-3 py-1 rounded-full border transition-all duration-200"
                                    style={visibleMentors.has(name)
                                        ? { backgroundColor: COLORS[i % COLORS.length] + "22", borderColor: COLORS[i % COLORS.length] + "66", color: COLORS[i % COLORS.length] }
                                        : { backgroundColor: "transparent", borderColor: "rgba(255,255,255,0.1)", color: "#6B7280" }
                                    }
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={formatted}>
                                    <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
                                    <XAxis dataKey="week" tick={{ fill: "#94A3B8", fontSize: 12 }} />
                                    <YAxis domain={[1, 5]} tick={{ fill: "#94A3B8", fontSize: 12 }} />
                                    <Tooltip {...tooltipStyle} />
                                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                                    {mentors.map((name, i) =>
                                        visibleMentors.has(name) ? (
                                            <Line key={name} type="monotone" dataKey={name}
                                                stroke={COLORS[i % COLORS.length]} strokeWidth={2.5}
                                                dot={false} activeDot={{ r: 5 }} connectNulls />
                                        ) : null
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Weekly summary table */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                        <div className="px-6 py-4 border-b border-white/10">
                            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest">Weekly Summary</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left px-6 py-3 text-gray-500 font-medium">Week</th>
                                        <th className="text-right px-6 py-3 text-gray-500 font-medium">Inst. Avg</th>
                                        <th className="text-right px-6 py-3 text-gray-500 font-medium">Best</th>
                                        <th className="text-right px-6 py-3 text-gray-500 font-medium">Lowest</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {weeks.map(week => {
                                        const pts = trendData.filter(d => d.week_number === week)
                                        if (!pts.length) return null
                                        const avg = pts.reduce((a, d) => a + d.avg_rating, 0) / pts.length
                                        const best = pts.reduce((a, b) => a.avg_rating > b.avg_rating ? a : b)
                                        const worst = pts.reduce((a, b) => a.avg_rating < b.avg_rating ? a : b)
                                        return (
                                            <tr key={week} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-3 text-gray-300">Week {week}</td>
                                                <td className="px-6 py-3 text-right text-blue-400 font-medium tabular-nums">{avg.toFixed(2)}</td>
                                                <td className="px-6 py-3 text-right text-emerald-400 tabular-nums">{best.mentor_name} ({best.avg_rating.toFixed(2)})</td>
                                                <td className="px-6 py-3 text-right text-red-400 tabular-nums">{worst.mentor_name} ({worst.avg_rating.toFixed(2)})</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </motion.div>
    )
}