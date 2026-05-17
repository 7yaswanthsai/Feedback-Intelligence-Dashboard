import { useSearchParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

import KpiCard from "../components/cards/KpiCard"
import Leaderboard from "../components/Leaderboard"
import RiskQuadrant from "../components/charts/RiskQuadrant"
import TrendChart from "../components/charts/TrendChart"
import Loader from "../components/ui/Loader"
import type { MentorAnalytics } from "../types/dashboard"
import SentimentPieChart from "../components/charts/SentimentPieChart"
import { useDashboard } from "../context/DashboardContext"
import RatingDistributionChart from "../components/charts/RatingDistributionChart"

export default function InstitutionPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()

    const program = searchParams.get("program") || undefined
    const cohort = searchParams.get("cohort") || undefined

    const [data, setData] = useState<MentorAnalytics[]>([])
    const [trendData, setTrendData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Per-program stats for enriched program cards
    const [programStats, setProgramStats] = useState<Record<string, {
        avgRating: number
        feedbackCount: number
        mentorCount: number
    }>>({})

    // Per-cohort stats for enriched cohort cards (populated when a program is selected)
    const [cohortStats, setCohortStats] = useState<Record<string, {
        avgRating: number
        feedbackCount: number
        mentorCount: number
        topPerformer: string | null
        atRisk: number
        categories: Record<string, number>
    }>>({})

    // Scoped feedback count from API (accurate, not summed from mentor breakdown)
    const [totalFeedbackCount, setTotalFeedbackCount] = useState(0)

    // Timestamp of last successful data load
    const [lastUpdated, setLastUpdated] = useState<string | null>(null)

    const { pushToast, setLastSyncTime } = useDashboard()

    const programs = [
        { id: 1, name: "AI & ML" },
        { id: 2, name: "Data Engineering" },
        { id: 3, name: "MBA Analytics" }
    ]

    const cohorts = [
        { name: "AI & ML Cohort 1", program: "AI & ML" },
        { name: "AI & ML Cohort 2", program: "AI & ML" },
        { name: "Data Engineering Cohort 1", program: "Data Engineering" },
        { name: "Data Engineering Cohort 2", program: "Data Engineering" },
        { name: "MBA Analytics Cohort 1", program: "MBA Analytics" },
        { name: "MBA Analytics Cohort 2", program: "MBA Analytics" }
    ]

    useEffect(() => {
        async function load(silent = false) {
            try {
                if (!silent) setLoading(true)

                const params = new URLSearchParams()
                if (program) params.append("program", program)
                if (cohort) params.append("cohort", cohort)

                const [analyticsRes, trendsRes] = await Promise.all([
                    fetch(`http://localhost:8000/analytics?${params}`),
                    fetch(`http://localhost:8000/mentors/trends`)
                ])

                const analytics = await analyticsRes.json()
                const trends = await trendsRes.json()

                setData(analytics?.mentor_breakdown || [])
                setTrendData(trends || [])
                setTotalFeedbackCount(analytics?.total_feedback_count ?? 0)

                // Fetch per-cohort stats when a program is selected (level-2)
                if (program && !cohort) {
                    const programCohorts = [
                        "AI & ML Cohort 1", "AI & ML Cohort 2",
                        "Data Engineering Cohort 1", "Data Engineering Cohort 2",
                        "MBA Analytics Cohort 1", "MBA Analytics Cohort 2"
                    ].filter(c => c.startsWith(program))

                    const cohortResponses = await Promise.all(
                        programCohorts.map(name =>
                            fetch(`http://localhost:8000/analytics?cohort=${encodeURIComponent(name)}`)
                                .then(r => r.json())
                        )
                    )

                    const cStats: Record<string, {
                        avgRating: number; feedbackCount: number; mentorCount: number;
                        topPerformer: string | null; atRisk: number; categories: Record<string, number>
                    }> = {}

                    programCohorts.forEach((name, i) => {
                        const breakdown = cohortResponses[i]?.mentor_breakdown || []
                        const avg = cohortResponses[i]?.overall_avg_rating ?? 0
                        const feedbackCount = cohortResponses[i]?.total_feedback_count ?? 0
                        const topMentor = breakdown.length > 0
                            ? breakdown.reduce((a: any, b: any) => a.mpi_score > b.mpi_score ? a : b, breakdown[0])
                            : null
                        const categories: Record<string, number> = {}
                        breakdown.forEach((m: any) => {
                            categories[m.category] = (categories[m.category] || 0) + 1
                        })
                        cStats[name] = {
                            avgRating: avg,
                            feedbackCount,
                            mentorCount: breakdown.length,
                            topPerformer: topMentor?.mentor_name ?? null,
                            atRisk: breakdown.filter((m: any) => m.category === "At Risk").length,
                            categories,
                        }
                    })
                    setCohortStats(cStats)
                }

                // Fetch per-program stats in parallel (only on level-1, no program selected)
                if (!program) {
                    const programNames = ["AI & ML", "Data Engineering", "MBA Analytics"]
                    const programResponses = await Promise.all(
                        programNames.map(name =>
                            fetch(`http://localhost:8000/analytics?program=${encodeURIComponent(name)}`)
                                .then(r => r.json())
                        )
                    )
                    const stats: Record<string, { avgRating: number; feedbackCount: number; mentorCount: number }> = {}
                    programNames.forEach((name, i) => {
                        const breakdown = programResponses[i]?.mentor_breakdown || []
                        const avg = programResponses[i]?.overall_avg_rating ?? 0
                        const feedbackCount = programResponses[i]?.total_feedback_count ?? 0
                        stats[name] = {
                            avgRating: avg,
                            feedbackCount: feedbackCount,
                            mentorCount: breakdown.length,
                        }
                    })
                    setProgramStats(stats)
                }

                const now = new Date()
                setLastUpdated(now.toLocaleString())
                setLastSyncTime(now)
                if (silent) pushToast("↑ Data refreshed", "success")
            } catch (err) {
                console.error("Failed to load institution data", err)
            } finally {
                setLoading(false)
            }
        }

        load()

        // Refresh data every 30 seconds silently (no loading spinner)
        const interval = setInterval(() => {
            load(true)
        }, 30000)

        return () => clearInterval(interval)
    }, [program, cohort])

    if (loading) return <Loader />

    // -------------------------
    // Institutional Metrics
    // -------------------------
    const totalMentors = data.length

    const avgScore =
        totalMentors > 0
            ? data.reduce((acc, m) => acc + (m.avg_rating || 0), 0) / totalMentors
            : 0

    const totalStudents = totalFeedbackCount

    const atRisk = data.filter((m) => m.category === "At Risk").length

    // -------------------------
    // LEVEL 1 → Institutional Overview
    // -------------------------

    // Health summary counts — derived from data already loaded
    const healthCounts = {
        "Top Performer": data.filter(m => m.category === "Top Performer").length,
        "Stable": data.filter(m => m.category === "Stable").length,
        "Needs Attention": data.filter(m => m.category === "Needs Attention").length,
        "High Volatility": data.filter(m => m.category === "High Volatility").length,
        "At Risk": data.filter(m => m.category === "At Risk").length,
    }

    const healthConfig = [
        { key: "Top Performer", label: "Top Performer", bar: "bg-emerald-500", text: "text-emerald-400", glow: "shadow-[0_0_10px_rgba(16,185,129,0.4)]", dot: "bg-emerald-400" },
        { key: "Stable", label: "Stable", bar: "bg-blue-500", text: "text-blue-400", glow: "shadow-[0_0_10px_rgba(59,130,246,0.4)]", dot: "bg-blue-400" },
        { key: "Needs Attention", label: "Needs Attention", bar: "bg-yellow-500", text: "text-yellow-400", glow: "shadow-[0_0_10px_rgba(245,158,11,0.4)]", dot: "bg-yellow-400" },
        { key: "High Volatility", label: "High Volatility", bar: "bg-orange-500", text: "text-orange-400", glow: "shadow-[0_0_10px_rgba(249,115,22,0.4)]", dot: "bg-orange-400" },
        { key: "At Risk", label: "At Risk", bar: "bg-red-500", text: "text-red-400", glow: "shadow-[0_0_10px_rgba(239,68,68,0.4)]", dot: "bg-red-400" },
    ]

    if (!program) {
        return (
            <>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-semibold">
                        Institutional Overview
                    </h2>
                    {lastUpdated && (
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse" />
                            <span className="text-xs text-gray-400">
                                Data as of <span className="text-gray-200 font-medium">{lastUpdated}</span>
                            </span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <KpiCard title="Programs" value={programs.length} loading={false} />
                    <KpiCard title="Total Mentors" value={totalMentors} loading={false} />
                    <KpiCard
                        title="Institution Avg Rating"
                        value={Number(avgScore.toFixed(2))}
                        loading={false}
                    />
                    <KpiCard
                        title="Students Impacted"
                        value={totalStudents}
                        loading={false}
                    />
                </div>

                {/* ── Mentor Health Summary ── */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-12 shadow-xl">
                    <h3 className="text-sm font-medium text-gray-400 mb-5 tracking-wide uppercase">
                        Mentor Health Summary
                    </h3>

                    {/* Segmented bar */}
                    <div className="flex w-full h-3 rounded-full overflow-hidden mb-6 gap-0.5">
                        {healthConfig.map(({ key, bar }) => {
                            const count = healthCounts[key as keyof typeof healthCounts]
                            const pct = totalMentors > 0 ? (count / totalMentors) * 100 : 0
                            if (pct === 0) return null
                            return (
                                <div
                                    key={key}
                                    className={`${bar} h-full transition-all duration-700`}
                                    style={{ width: `${pct}%` }}
                                    title={`${key}: ${count}`}
                                />
                            )
                        })}
                    </div>

                    {/* Legend row */}
                    <div className="flex flex-wrap gap-x-8 gap-y-3">
                        {healthConfig.map(({ key, label, text, glow, dot }) => {
                            const count = healthCounts[key as keyof typeof healthCounts]
                            if (count === 0) return null
                            return (
                                <div key={key} className="flex items-center gap-2.5">
                                    <span className={`w-2.5 h-2.5 rounded-full ${dot} ${glow} flex-shrink-0`} />
                                    <span className="text-sm text-gray-400">{label}</span>
                                    <span className={`text-sm font-semibold ${text}`}>{count}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* ── Top 3 Mentors Spotlight ── */}
                {(() => {
                    const top3 = [...data]
                        .sort((a, b) => b.mpi_score - a.mpi_score)
                        .slice(0, 3)

                    const medals = [
                        { bg: "bg-yellow-500", ring: "ring-yellow-500/40", label: "🥇 #1" },
                        { bg: "bg-gray-400", ring: "ring-gray-400/40", label: "🥈 #2" },
                        { bg: "bg-orange-600", ring: "ring-orange-500/40", label: "🥉 #3" },
                    ]

                    const categoryColor: Record<string, string> = {
                        "Top Performer": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
                        "Stable": "text-blue-400    bg-blue-500/10    border-blue-500/30",
                        "Needs Attention": "text-yellow-400  bg-yellow-500/10  border-yellow-500/30",
                        "High Volatility": "text-orange-400  bg-orange-500/10  border-orange-500/30",
                        "At Risk": "text-red-400     bg-red-500/10     border-red-500/30",
                    }

                    return (
                        <div className="mb-12">
                            <h3 className="text-sm font-medium text-gray-400 mb-5 tracking-wide uppercase">
                                Top Performing Mentors
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {top3.map((mentor, i) => {
                                    const medal = medals[i]
                                    const catStyle = categoryColor[mentor.category] ?? "text-gray-400 bg-gray-500/10 border-gray-500/30"

                                    return (
                                        <div
                                            key={mentor.mentor_id}
                                            className={`relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl ring-1 ${medal.ring} transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}
                                        >
                                            {/* Rank badge */}
                                            <div className={`absolute top-4 right-4 w-8 h-8 rounded-full ${medal.bg} flex items-center justify-center text-xs font-bold text-white shadow-lg`}>
                                                {i + 1}
                                            </div>

                                            {/* Name */}
                                            <div className="text-lg font-semibold text-white mb-1 pr-10">
                                                {mentor.mentor_name}
                                            </div>

                                            {/* Category badge */}
                                            <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full border mb-4 ${catStyle}`}>
                                                {mentor.category}
                                            </span>

                                            {/* Stats row */}
                                            <div className="grid grid-cols-3 gap-2 mt-2">
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 mb-1">MPI</div>
                                                    <div className="text-base font-bold text-blue-400">
                                                        {mentor.mpi_score.toFixed(3)}
                                                    </div>
                                                </div>
                                                <div className="text-center border-x border-white/5">
                                                    <div className="text-xs text-gray-500 mb-1">Avg Rating</div>
                                                    <div className="text-base font-bold text-white">
                                                        {mentor.avg_rating.toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 mb-1">Confidence</div>
                                                    <div className="text-base font-bold text-white">
                                                        {mentor.confidence_score.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })()}

                {/* ── Feature 5: Institutional Sentiment Donut ── */}
                {(() => {
                    // Derive sentiment from avg_rating weighted by feedback_count
                    // Positive: avg >= 4, Neutral: 3–3.99, Negative: < 3
                    let positive = 0, neutral = 0, negative = 0
                    const totalFb = data.reduce((acc, m) => acc + m.feedback_count, 0)

                    data.forEach(m => {
                        if (m.avg_rating >= 4) positive += m.feedback_count
                        else if (m.avg_rating >= 3) neutral += m.feedback_count
                        else negative += m.feedback_count
                    })

                    const toPercent = (n: number) =>
                        totalFb > 0 ? Math.round((n / totalFb) * 100) : 0

                    const sentimentData = {
                        positive: toPercent(positive),
                        neutral: toPercent(neutral),
                        negative: toPercent(negative),
                    }

                    // Derive rating distribution: approximate using normal distribution
                    // per mentor weighted by their feedback_count
                    const dist: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }

                    data.forEach(m => {
                        const avg = m.avg_rating
                        const std = Math.max(0.3, 2 - avg * 0.3) // rough stddev estimate
                        const count = m.feedback_count

                        // Gaussian weight for each star
                        const weights: Record<string, number> = {}
                        let weightSum = 0
                        for (let star = 1; star <= 5; star++) {
                            const w = Math.exp(-0.5 * Math.pow((star - avg) / std, 2))
                            weights[String(star)] = w
                            weightSum += w
                        }
                        for (let star = 1; star <= 5; star++) {
                            dist[String(star)] += Math.round((weights[String(star)] / weightSum) * count)
                        }
                    })

                    const distTotal = Object.values(dist).reduce((a, b) => a + b, 0)

                    return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                            <SentimentPieChart data={sentimentData} />
                            <RatingDistributionChart distribution={dist} total={distTotal} />
                        </div>
                    )
                })()}

                <h3 className="text-xl font-semibold mb-6">
                    Select Program
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {programs.map(p => {
                        const cohortCount = cohorts.filter(c => c.program === p.name).length
                        const stats = programStats[p.name]
                        const progAvg = stats?.avgRating ?? 0
                        const progFeedback = stats?.feedbackCount ?? 0
                        const progMentors = stats?.mentorCount ?? 0

                        return (
                            <div
                                key={p.name}
                                onClick={() => setSearchParams({ program: p.name })}
                                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-7 cursor-pointer
                                           transition-all duration-300 hover:scale-[1.03] hover:border-blue-500/40
                                           hover:shadow-[0_0_30px_rgba(59,130,246,0.12)] overflow-hidden"
                            >
                                {/* Subtle gradient on hover */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500
                                                bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.06),transparent_70%)]
                                                pointer-events-none" />

                                {/* Arrow indicator */}
                                <div className="absolute top-5 right-5 text-gray-600 group-hover:text-blue-400
                                                group-hover:translate-x-1 transition-all duration-300 text-lg">
                                    →
                                </div>

                                {/* Program name */}
                                <h3 className="text-lg font-semibold text-white mb-4 pr-6">
                                    {p.name}
                                </h3>

                                {/* Divider */}
                                <div className="border-t border-white/5 mb-4" />

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Cohorts</div>
                                        <div className="text-base font-bold text-white">{cohortCount}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Avg Rating</div>
                                        <div className="text-base font-bold text-blue-400">
                                            {stats ? progAvg.toFixed(2) : "—"}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Feedback</div>
                                        <div className="text-base font-bold text-white">
                                            {stats ? progFeedback.toLocaleString() : "—"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </>
        )
    }

    // -------------------------
    // LEVEL 2 → Cohort Select
    // -------------------------
    if (program && !cohort) {
        const filteredCohorts = cohorts.filter(c => c.program === program)

        // Program-level aggregate (from data already loaded for this program)
        const progAvg = data.length > 0
            ? data.reduce((acc, m) => acc + m.avg_rating, 0) / data.length : 0
        const progAtRisk = data.filter(m => m.category === "At Risk").length
        const progTopPerformer = data.length > 0
            ? data.reduce((a, b) => a.mpi_score > b.mpi_score ? a : b)
            : null

        const categoryConfig = [
            { key: "Top Performer", color: "bg-emerald-500", text: "text-emerald-400" },
            { key: "Stable", color: "bg-blue-500", text: "text-blue-400" },
            { key: "Needs Attention", color: "bg-yellow-500", text: "text-yellow-400" },
            { key: "High Volatility", color: "bg-orange-500", text: "text-orange-400" },
            { key: "At Risk", color: "bg-red-500", text: "text-red-400" },
        ]

        return (
            <>
                {/* Header */}
                <button
                    onClick={() => navigate("/")}
                    className="mb-6 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                    ← Back to Programs
                </button>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-semibold">{program}</h2>
                        <p className="text-sm text-gray-400 mt-1">Select a cohort to drill into the dashboard</p>
                    </div>
                    <div className="text-xs text-gray-500 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
                        {data.length} mentors · {totalFeedbackCount.toLocaleString()} feedback records
                    </div>
                </div>

                {/* Program-level KPI strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Mentors", value: data.length },
                        { label: "Program Avg Rating", value: progAvg.toFixed(2) },
                        { label: "At Risk", value: progAtRisk },
                        { label: "Top Mentor", value: progTopPerformer?.mentor_name ?? "—" },
                    ].map(kpi => (
                        <div key={kpi.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
                            <div className="text-xs text-gray-400 mb-1">{kpi.label}</div>
                            <div className={`font-bold truncate ${kpi.label === "Top Mentor" ? "text-base text-emerald-400" : "text-2xl text-white"}`}>
                                {kpi.value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Mentor health bar for this program */}
                {(() => {
                    const total = data.length
                    if (total === 0) return null
                    return (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 backdrop-blur-xl">
                            <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">Mentor Health — {program}</div>
                            <div className="flex rounded-full overflow-hidden h-3 mb-3">
                                {categoryConfig.map(cfg => {
                                    const count = data.filter(m => m.category === cfg.key).length
                                    if (count === 0) return null
                                    return (
                                        <div
                                            key={cfg.key}
                                            className={`${cfg.color} transition-all duration-500`}
                                            style={{ width: `${(count / total) * 100}%` }}
                                            title={`${cfg.key}: ${count}`}
                                        />
                                    )
                                })}
                            </div>
                            <div className="flex flex-wrap gap-4">
                                {categoryConfig.map(cfg => {
                                    const count = data.filter(m => m.category === cfg.key).length
                                    if (count === 0) return null
                                    return (
                                        <div key={cfg.key} className="flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
                                            <span className={`text-xs ${cfg.text}`}>{cfg.key}</span>
                                            <span className="text-xs text-gray-500">({count})</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })()}

                {/* Cohort cards */}
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">Choose Cohort</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredCohorts.map(c => {
                        const stats = cohortStats[c.name]
                        return (
                            <div
                                key={c.name}
                                onClick={() => setSearchParams({ program, cohort: c.name })}
                                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-7 cursor-pointer
                                           transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/40
                                           hover:shadow-[0_0_30px_rgba(59,130,246,0.12)] overflow-hidden"
                            >
                                {/* Hover gradient */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500
                                                bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.07),transparent_70%)]
                                                pointer-events-none" />

                                {/* Arrow */}
                                <div className="absolute top-5 right-5 text-gray-600 group-hover:text-blue-400
                                                group-hover:translate-x-1 transition-all duration-300 text-lg">→</div>

                                {/* Cohort name */}
                                <h3 className="text-lg font-semibold text-white mb-1 pr-6">{c.name}</h3>
                                <div className="text-xs text-gray-500 mb-4">{program}</div>

                                <div className="border-t border-white/5 mb-4" />

                                {/* Stats grid */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Avg Rating</div>
                                        <div className="text-xl font-bold text-blue-400">
                                            {stats ? stats.avgRating.toFixed(2) : "—"}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Feedback</div>
                                        <div className="text-xl font-bold text-white">
                                            {stats ? stats.feedbackCount.toLocaleString() : "—"}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Mentors</div>
                                        <div className="text-xl font-bold text-white">
                                            {stats ? stats.mentorCount : "—"}
                                        </div>
                                    </div>
                                </div>

                                {/* Top mentor + at-risk row */}
                                {stats && (
                                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">Top mentor:</span>
                                            <span className="text-xs text-emerald-400 font-medium">
                                                {stats.topPerformer ?? "—"}
                                            </span>
                                        </div>
                                        {stats.atRisk > 0 && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
                                                {stats.atRisk} at risk
                                            </span>
                                        )}
                                        {stats.atRisk === 0 && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                                                All healthy
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Mini category bar */}
                                {stats && stats.mentorCount > 0 && (
                                    <div className="mt-3 flex rounded-full overflow-hidden h-1.5">
                                        {categoryConfig.map(cfg => {
                                            const count = stats.categories[cfg.key] || 0
                                            if (count === 0) return null
                                            return (
                                                <div
                                                    key={cfg.key}
                                                    className={`${cfg.color}`}
                                                    style={{ width: `${(count / stats.mentorCount) * 100}%` }}
                                                />
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </>
        )
    }

    // -------------------------
    // LEVEL 3 → Dashboard View
    // -------------------------
    return (
        <>
            <button
                onClick={() => setSearchParams({ program })}
                className="mb-6 text-sm text-blue-400"
            >
                ← Back to Cohorts
            </button>

            <h2 className="text-2xl font-semibold mb-6">
                Executive Overview ({cohort})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-14">
                <KpiCard title="Total Mentors" value={totalMentors} loading={false} />
                <KpiCard title="Mentors At Risk" value={atRisk} loading={false} />
                <KpiCard
                    title="Institutional Avg Rating"
                    value={Number(avgScore.toFixed(2))}
                    loading={false}
                />
                <KpiCard
                    title="Total Feedback Records"
                    value={totalFeedbackCount}
                    loading={false}
                />
            </div>

            <div className="mb-14">
                <Leaderboard data={data} trends={trendData} />
            </div>

            <div className="mb-14">
                <RiskQuadrant data={data} />
            </div>

            <TrendChart data={trendData} />
        </>
    )
}