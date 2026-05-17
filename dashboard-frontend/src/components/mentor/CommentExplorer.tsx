import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react"

interface Comment {
    comment: string
    structured_response: string
    rating: number | null
    submitted_at: string | null
}

const RESPONSE_STYLE: Record<string, string> = {
    "Excellent": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    "Good": "text-blue-400    bg-blue-500/10    border-blue-500/30",
    "Average": "text-yellow-400  bg-yellow-500/10  border-yellow-500/30",
    "Poor": "text-red-400     bg-red-500/10     border-red-500/30",
}

const STAR_COLOR: Record<number, string> = {
    5: "text-emerald-400", 4: "text-blue-400",
    3: "text-yellow-400", 2: "text-orange-400", 1: "text-red-400"
}

export default function CommentExplorer({ mentorId }: { mentorId: number }) {
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>("All")
    const [expanded, setExpanded] = useState<Set<number>>(new Set())

    useEffect(() => {
        fetch(`http://localhost:8000/mentor-comments/${mentorId}?limit=20`)
            .then(r => r.json())
            .then(data => setComments(data || []))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [mentorId])

    const responseTypes = ["All", "Excellent", "Good", "Average", "Poor"]
    const filtered = filter === "All" ? comments : comments.filter(c => c.structured_response === filter)

    const counts = responseTypes.slice(1).reduce((acc, r) => {
        acc[r] = comments.filter(c => c.structured_response === r).length
        return acc
    }, {} as Record<string, number>)

    const toggleExpand = (i: number) => {
        setExpanded(prev => {
            const next = new Set(prev)
            next.has(i) ? next.delete(i) : next.add(i)
            return next
        })
    }

    return (
        <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <MessageSquare size={18} className="text-blue-400" />
                    <h3 className="text-base font-semibold text-white">Student Voice</h3>
                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                        {comments.length} recent comments
                    </span>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1.5">
                    {responseTypes.map(r => (
                        <button
                            key={r}
                            onClick={() => setFilter(r)}
                            className={`text-xs px-3 py-1 rounded-full border transition-all duration-150 ${filter === r
                                    ? (RESPONSE_STYLE[r] ?? "text-white bg-blue-500/20 border-blue-500/40")
                                    : "text-gray-500 border-white/10 hover:border-white/20"
                                }`}
                        >
                            {r} {r !== "All" && counts[r] ? `(${counts[r]})` : ""}
                        </button>
                    ))}
                </div>
            </div>

            {/* Comments list */}
            <div className="divide-y divide-white/5">
                {loading && (
                    <div className="space-y-3 p-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                        ))}
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="py-12 text-center text-gray-500 text-sm">
                        No comments for this category.
                    </div>
                )}

                <AnimatePresence>
                    {!loading && filtered.map((c, i) => {
                        const isLong = c.comment.length > 140
                        const isOpen = expanded.has(i)
                        const displayText = isLong && !isOpen
                            ? c.comment.slice(0, 140) + "…"
                            : c.comment
                        const star = c.rating ? Math.round(c.rating) : null
                        const starColor = star ? (STAR_COLOR[star] ?? "text-gray-400") : "text-gray-500"
                        const date = c.submitted_at
                            ? new Date(c.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                            : ""

                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="px-6 py-4 hover:bg-white/[0.02] transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    {/* Comment body */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-300 leading-relaxed">{displayText}</p>
                                        {isLong && (
                                            <button
                                                onClick={() => toggleExpand(i)}
                                                className="flex items-center gap-1 text-xs text-blue-400 mt-1.5 hover:text-blue-300 transition-colors"
                                            >
                                                {isOpen ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show more</>}
                                            </button>
                                        )}
                                    </div>

                                    {/* Badges */}
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        {c.structured_response && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${RESPONSE_STYLE[c.structured_response] ?? "text-gray-400 bg-white/5 border-white/10"}`}>
                                                {c.structured_response}
                                            </span>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            {star && <span className={`text-xs font-medium ${starColor}`}>{"★".repeat(star)}</span>}
                                            {date && <span className="text-xs text-gray-600">{date}</span>}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </div>
    )
}