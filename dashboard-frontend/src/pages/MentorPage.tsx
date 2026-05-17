import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Download, FileText, ArrowLeft } from "lucide-react"

import Loader from "../components/ui/Loader"
import MetricCard from "../components/ui/MetricCard"
import ScoreBreakdown from "../components/mentor/ScoreBreakdown"
import MentorTrendChart from "../components/mentor/MentorTrendChart"
import ExecutiveBrief from "../components/mentor/ExecutiveBrief"
import SentimentPieChart from "../components/charts/SentimentPieChart"
import WeeklyAvgChart from "../components/charts/WeeklyAvgChart"
import RatingDistributionChart from "../components/charts/RatingDistributionChart"
import WeeklyVolumeChart from "../components/charts/WeeklyVolumeChart"
import WeeklyAttendanceChart from "../components/charts/WeeklyAttendanceChart"
import CommentExplorer from "../components/mentor/CommentExplorer"
import { downloadCSV, printAsPDF } from "../utils/exportUtils"

const CATEGORY_STYLE: Record<string, string> = {
    "Top Performer": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    "Stable": "text-blue-400    bg-blue-500/10    border-blue-500/30",
    "Needs Attention": "text-yellow-400  bg-yellow-500/10  border-yellow-500/30",
    "High Volatility": "text-orange-400  bg-orange-500/10  border-orange-500/30",
    "At Risk": "text-red-400     bg-red-500/10     border-red-500/30",
}

export default function MentorPage() {
    const { mentorId } = useParams()
    const navigate = useNavigate()

    const [mentor, setMentor] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [trends, setTrends] = useState<any[]>([])
    const [feedbackData, setFeedbackData] = useState<any>(null)
    const [brief, setBrief] = useState("")
    const [aiLoading, setAiLoading] = useState(true)
    const [institutionalAvg, setInstitutionalAvg] = useState<number>(0)

    useEffect(() => {
        if (!mentorId) return
        async function fetchMentor() {
            try {
                setLoading(true)
                const [analyticsRes, trendsRes, feedbackRes] = await Promise.all([
                    fetch(`http://localhost:8000/analytics?mentor=${mentorId}`),
                    fetch(`http://localhost:8000/mentors/trends`),
                    fetch(`http://localhost:8000/mentor-feedback/${mentorId}`)
                ])
                const analytics = await analyticsRes.json()
                const trendsData = await trendsRes.json()
                const feedbackJson = await feedbackRes.json()

                setMentor(analytics?.mentor_breakdown?.[0] ?? null)
                setInstitutionalAvg(analytics?.overall_avg_rating ?? 0)
                setTrends(trendsData?.filter((t: any) => t.mentor_id === Number(mentorId)) ?? [])
                setFeedbackData(feedbackJson)
            } catch (err) {
                console.error("Failed to load mentor", err)
            } finally {
                setLoading(false)
            }
        }
        fetchMentor()
    }, [mentorId])

    useEffect(() => {
        if (!mentorId) return
        setAiLoading(true)
        fetch(`http://localhost:8000/mentor-intelligence/${mentorId}`)
            .then(res => res.json())
            .then(data => setBrief(data?.brief ?? ""))
            .catch(console.error)
            .finally(() => setAiLoading(false))
    }, [mentorId])

    if (loading) return (
        <div className="flex items-center justify-center h-[70vh]">
            <Loader />
        </div>
    )

    if (!mentor) return (
        <div className="text-center text-gray-400 mt-20">Mentor not found.</div>
    )

    const totalReviews: number = feedbackData?.rating_distribution
        ? (Object.values(feedbackData.rating_distribution) as number[]).reduce((a, b) => a + b, 0)
        : 0

    const handleExportCSV = () => {
        const rows = Object.entries(feedbackData?.rating_distribution ?? {}).map(([star, count]) => ({
            mentor: mentor.mentor_name,
            star_rating: star,
            count,
        }))
        const summary = [{
            mentor_name: mentor.mentor_name,
            mpi_score: mentor.mpi_score,
            avg_rating: mentor.avg_rating,
            category: mentor.category,
            quality_score: mentor.quality_score,
            consistency_score: mentor.consistency_score,
            reliability_score: mentor.reliability_score,
            trend_score: mentor.trend_score,
            confidence_score: mentor.confidence_score,
            feedback_count: mentor.feedback_count,
            total_students: feedbackData?.total_students ?? 0,
            total_sessions: feedbackData?.total_sessions ?? 0,
        }]
        downloadCSV(summary, `${mentor.mentor_name.replace(/ /g, "_")}_report.csv`)
    }

    const catStyle = CATEGORY_STYLE[mentor.category] ?? "text-gray-400 bg-white/5 border-white/10"

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
        >
            {/* Back + Export header */}
            <div className="flex items-center justify-between no-print">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10
                                   text-sm text-gray-300 hover:border-blue-500/40 hover:text-white transition-all duration-200"
                    >
                        <Download size={14} />
                        Export CSV
                    </button>
                    <button
                        onClick={() => printAsPDF(`${mentor.mentor_name} — Mentor Report`)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30
                                   text-sm text-blue-400 hover:bg-blue-500/20 transition-all duration-200"
                    >
                        <FileText size={14} />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Mentor Header */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-lg page-break-avoid">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">{mentor.mentor_name}</h1>
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className={`text-xs px-3 py-1 rounded-full border ${catStyle}`}>
                                {mentor.category}
                            </span>
                            <span className="text-sm text-gray-400">
                                Confidence: <span className="text-white">{mentor.confidence_score.toFixed(3)}</span>
                            </span>
                            <span className="text-sm text-gray-400">
                                Rank score: <span className="text-blue-400 font-bold">{mentor.mpi_score.toFixed(3)} MPI</span>
                            </span>
                        </div>
                    </div>
                    {/* Big MPI */}
                    <div className="text-right hidden md:block">
                        <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">MPI</div>
                        <div className="text-5xl font-bold text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] tabular-nums">
                            {mentor.mpi_score.toFixed(3)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Engagement KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 page-break-avoid">
                <MetricCard title="Total Students Reached" value={feedbackData?.total_students ?? 0} />
                <MetricCard title="Sessions Conducted" value={feedbackData?.total_sessions ?? 0} />
                <MetricCard title="Total Feedback Submitted" value={totalReviews} />
            </div>

            {/* Score Breakdown */}
            <div className="page-break-avoid">
                <ScoreBreakdown
                    quality={mentor.quality_score}
                    consistency={mentor.consistency_score}
                    reliability={mentor.reliability_score}
                    trend={mentor.trend_score}
                />
            </div>

            {/* Weekly Trend */}
            <div className="page-break-avoid">
                <MentorTrendChart
                    trends={trends}
                    mentorId={Number(mentorId)}
                    trendScore={mentor.trend_score}
                />
            </div>

            {/* Charts Section */}
            {feedbackData && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 page-break-avoid">
                    {feedbackData.sentiment_distribution && (
                        <SentimentPieChart data={feedbackData.sentiment_distribution} />
                    )}
                    <RatingDistributionChart
                        distribution={feedbackData.rating_distribution ?? {}}
                        total={totalReviews}
                    />
                    <WeeklyAvgChart
                        data={feedbackData.weekly_avg ?? []}
                        institutionalAvg={institutionalAvg}
                    />
                    <WeeklyVolumeChart data={feedbackData.weekly_volume ?? []} />
                    <WeeklyAttendanceChart data={feedbackData.weekly_attendance ?? []} />
                </div>
            )}

            {/* Student Comment Explorer */}
            <div className="page-break-before">
                <CommentExplorer mentorId={Number(mentorId)} />
            </div>

            {/* AI Executive Brief */}
            <div className="page-break-avoid">
                <ExecutiveBrief text={brief} loading={aiLoading} />
            </div>
        </motion.div>
    )
}