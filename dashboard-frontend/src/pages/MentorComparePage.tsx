import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    ResponsiveContainer, Tooltip, Legend
} from "recharts"
import Loader from "../components/ui/Loader"
import type { MentorAnalytics } from "../types/dashboard"

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"]

const CATEGORY_STYLE: Record<string, string> = {
    "Top Performer": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    "Stable": "text-blue-400    bg-blue-500/10    border-blue-500/30",
    "Needs Attention": "text-yellow-400  bg-yellow-500/10  border-yellow-500/30",
    "High Volatility": "text-orange-400  bg-orange-500/10  border-orange-500/30",
    "At Risk": "text-red-400     bg-red-500/10     border-red-500/30",
}

export default function MentorComparePage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const ids = searchParams.get("ids")?.split(",").map(Number).filter(Boolean) ?? []

    const [mentors, setMentors] = useState<MentorAnalytics[]>([])
    const [allMentors, setAllMentors] = useState<MentorAnalytics[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                // Always load all mentors for the picker
                const allRes = await fetch("http://localhost:8000/analytics")
                const allJson = await allRes.json()
                const all: MentorAnalytics[] = allJson?.mentor_breakdown || []
                setAllMentors(all)

                // Load selected mentors in parallel
                if (ids.length > 0) {
                    const selected = all.filter(m => ids.includes(m.mentor_id))
                    setMentors(selected)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [searchParams.toString()])

    const toggleMentor = (id: number) => {
        const current = ids
        let next: number[]
        if (current.includes(id)) {
            next = current.filter(i => i !== id)
        } else if (current.length >= 4) {
            return // max 4
        } else {
            next = [...current, id]
        }
        navigate(next.length > 0 ? `/compare?ids=${next.join(",")}` : "/compare")
    }

    if (loading) return <Loader />

    // Radar chart data
    const radarData = [
        { metric: "Quality", full: "Quality Score" },
        { metric: "Consistency", full: "Consistency Score" },
        { metric: "Reliability", full: "Reliability Score" },
        { metric: "Trend", full: "Trend Score" },
        { metric: "Avg Rating", full: "Average Rating" },
    ].map(({ metric, full }) => {
        const row: any = { metric }
        mentors.forEach(m => {
            if (metric === "Avg Rating") row[m.mentor_name] = parseFloat(((m.avg_rating / 5) * 100).toFixed(1))
            else if (metric === "Quality") row[m.mentor_name] = parseFloat((m.quality_score * 100).toFixed(1))
            else if (metric === "Consistency") row[m.mentor_name] = parseFloat((m.consistency_score * 100).toFixed(1))
            else if (metric === "Reliability") row[m.mentor_name] = parseFloat((m.reliability_score * 100).toFixed(1))
            else if (metric === "Trend") row[m.mentor_name] = parseFloat((((m.trend_score + 1) / 2) * 100).toFixed(1))
        })
        return row
    })

    const scoreRows = [
        { label: "MPI Score", key: "mpi_score", fmt: (v: number) => v.toFixed(3), higher: true },
        { label: "Avg Rating", key: "avg_rating", fmt: (v: number) => v.toFixed(2), higher: true },
        { label: "Quality", key: "quality_score", fmt: (v: number) => (v * 100).toFixed(0) + "%", higher: true },
        { label: "Consistency", key: "consistency_score", fmt: (v: number) => (v * 100).toFixed(0) + "%", higher: true },
        { label: "Reliability", key: "reliability_score", fmt: (v: number) => (v * 100).toFixed(0) + "%", higher: true },
        { label: "Trend", key: "trend_score", fmt: (v: number) => v.toFixed(3), higher: true },
        { label: "Confidence", key: "confidence_score", fmt: (v: number) => v.toFixed(3), higher: true },
        { label: "Feedback Count", key: "feedback_count", fmt: (v: number) => v.toLocaleString(), higher: true },
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-semibold">Mentor Comparison</h2>
                    <p className="text-sm text-gray-400 mt-1">Select up to 4 mentors to compare side-by-side</p>
                </div>
                {mentors.length >= 2 && (
                    <span className="text-xs text-gray-500 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
                        {mentors.length} mentors selected
                    </span>
                )}
            </div>

            {/* Mentor picker */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-4">Choose Mentors</div>
                <div className="flex flex-wrap gap-2">
                    {allMentors.map((m, i) => {
                        const selected = ids.includes(m.mentor_id)
                        const color = COLORS[ids.indexOf(m.mentor_id)]
                        return (
                            <button
                                key={m.mentor_id}
                                onClick={() => toggleMentor(m.mentor_id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all duration-200 ${selected
                                        ? "text-white border-transparent"
                                        : "text-gray-400 bg-white/5 border-white/10 hover:border-white/20"
                                    }`}
                                style={selected ? { backgroundColor: color + "22", borderColor: color + "55", color } : {}}
                            >
                                {selected && (
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                )}
                                {m.mentor_name}
                                <span className={`text-xs ${CATEGORY_STYLE[m.category]?.split(" ")[0] ?? "text-gray-500"}`}>
                                    {m.mpi_score.toFixed(3)}
                                </span>
                            </button>
                        )
                    })}
                </div>
                {ids.length >= 4 && (
                    <p className="text-xs text-yellow-400 mt-3">Maximum 4 mentors. Deselect one to add another.</p>
                )}
            </div>

            {mentors.length < 2 && (
                <div className="text-center py-20 text-gray-500">
                    <div className="text-4xl mb-4">⚖️</div>
                    <div className="text-base">Select at least 2 mentors to start comparing</div>
                </div>
            )}

            {mentors.length >= 2 && (
                <>
                    {/* Radar chart */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-6">
                            Performance Radar
                        </h3>
                        <div className="h-[360px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData}>
                                    <PolarGrid stroke="#1F2937" />
                                    <PolarAngleAxis
                                        dataKey="metric"
                                        tick={{ fill: "#94A3B8", fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "8px" }}
                                        formatter={(val: any) => `${val}%`}
                                    />
                                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                                    {mentors.map((m, i) => (
                                        <Radar
                                            key={m.mentor_id}
                                            name={m.mentor_name}
                                            dataKey={m.mentor_name}
                                            stroke={COLORS[i]}
                                            fill={COLORS[i]}
                                            fillOpacity={0.12}
                                            strokeWidth={2}
                                        />
                                    ))}
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Score breakdown bars side by side */}
                    <div className={`grid gap-5 ${mentors.length === 2 ? "grid-cols-2" : mentors.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
                        {mentors.map((m, i) => (
                            <div
                                key={m.mentor_id}
                                className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl"
                                style={{ borderColor: COLORS[i] + "33" }}
                            >
                                {/* Name + category */}
                                <div className="mb-4">
                                    <div className="text-base font-semibold" style={{ color: COLORS[i] }}>{m.mentor_name}</div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full border mt-1.5 inline-block ${CATEGORY_STYLE[m.category] ?? "text-gray-400 bg-white/5 border-white/10"}`}>
                                        {m.category}
                                    </span>
                                </div>

                                {/* Score bars */}
                                <div className="space-y-3">
                                    {[
                                        { label: "Quality", value: m.quality_score },
                                        { label: "Consistency", value: m.consistency_score },
                                        { label: "Reliability", value: m.reliability_score },
                                        { label: "Trend", value: (m.trend_score + 1) / 2 },
                                    ].map(s => (
                                        <div key={s.label}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-400">{s.label}</span>
                                                <span className="text-gray-300">{(s.value * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full bg-white/5 rounded-full h-1.5">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${s.value * 100}%` }}
                                                    transition={{ duration: 0.8, delay: i * 0.1 }}
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: COLORS[i] }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* MPI big number */}
                                <div className="mt-5 pt-4 border-t border-white/10 text-center">
                                    <div className="text-xs text-gray-500 mb-1">MPI Score</div>
                                    <div className="text-3xl font-bold tabular-nums" style={{ color: COLORS[i] }}>
                                        {m.mpi_score.toFixed(3)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Comparison table */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                        <div className="px-6 py-4 border-b border-white/10">
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Full Metrics Comparison</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left px-6 py-3 text-gray-500 font-medium w-40">Metric</th>
                                        {mentors.map((m, i) => (
                                            <th key={m.mentor_id} className="text-right px-6 py-3 font-medium" style={{ color: COLORS[i] }}>
                                                {m.mentor_name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {scoreRows.map(row => {
                                        const vals = mentors.map(m => (m as any)[row.key] as number)
                                        const best = row.higher ? Math.max(...vals) : Math.min(...vals)
                                        return (
                                            <tr key={row.label} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-3 text-gray-400">{row.label}</td>
                                                {mentors.map((m, i) => {
                                                    const v = (m as any)[row.key] as number
                                                    const isBest = v === best
                                                    return (
                                                        <td key={m.mentor_id} className="px-6 py-3 text-right">
                                                            <span className={`font-medium tabular-nums ${isBest ? "text-white" : "text-gray-500"}`}>
                                                                {row.fmt(v)}
                                                            </span>
                                                            {isBest && mentors.length > 1 && (
                                                                <span className="ml-1.5 text-[10px] text-emerald-400">↑</span>
                                                            )}
                                                        </td>
                                                    )
                                                })}
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