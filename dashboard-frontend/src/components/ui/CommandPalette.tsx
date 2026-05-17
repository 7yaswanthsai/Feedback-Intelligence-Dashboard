import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Search, User, LayoutDashboard, BarChart3, TrendingUp, Sparkles, X } from "lucide-react"

interface MentorOption {
    id: number
    name: string
    category: string
    mpi_score: number
}

const STATIC_ROUTES = [
    { label: "Overview", path: "/", icon: <LayoutDashboard size={15} /> },
    { label: "Mentor Intelligence", path: "/mentors", icon: <User size={15} /> },
    { label: "Cohort Analytics", path: "/cohorts", icon: <BarChart3 size={15} /> },
    { label: "Session Trends", path: "/trends", icon: <TrendingUp size={15} /> },
    { label: "AI Insights", path: "/ai-insights", icon: <Sparkles size={15} /> },
]

const CATEGORY_COLOR: Record<string, string> = {
    "Top Performer": "text-emerald-400",
    "Stable": "text-blue-400",
    "Needs Attention": "text-yellow-400",
    "High Volatility": "text-orange-400",
    "At Risk": "text-red-400",
}

interface Props {
    open: boolean
    onClose: () => void
}

export default function CommandPalette({ open, onClose }: Props) {
    const navigate = useNavigate()
    const [query, setQuery] = useState("")
    const [mentors, setMentors] = useState<MentorOption[]>([])
    const [activeIndex, setActiveIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

    // Fetch mentor list once when palette opens
    useEffect(() => {
        if (!open) return
        setQuery("")
        setActiveIndex(0)
        setTimeout(() => inputRef.current?.focus(), 50)

        if (mentors.length === 0) {
            fetch("http://localhost:8000/analytics")
                .then(r => r.json())
                .then(data => {
                    const list: MentorOption[] = (data?.mentor_breakdown || []).map((m: any) => ({
                        id: m.mentor_id,
                        name: m.mentor_name,
                        category: m.category,
                        mpi_score: m.mpi_score,
                    }))
                    setMentors(list)
                })
                .catch(console.error)
        }
    }, [open])

    // Escape to close
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [onClose])

    const q = query.toLowerCase().trim()

    const filteredRoutes = STATIC_ROUTES.filter(r =>
        r.label.toLowerCase().includes(q)
    )

    const filteredMentors = mentors.filter(m =>
        m.name.toLowerCase().includes(q)
    )

    // Flatten results for keyboard nav
    const allResults: { type: "route" | "mentor"; label: string; sub?: string; action: () => void }[] = [
        ...filteredRoutes.map(r => ({
            type: "route" as const,
            label: r.label,
            action: () => { navigate(r.path); onClose() }
        })),
        ...filteredMentors.map(m => ({
            type: "mentor" as const,
            label: m.name,
            sub: `${m.category} · MPI ${m.mpi_score.toFixed(3)}`,
            action: () => { navigate(`/mentor/${m.id}`); onClose() }
        }))
    ]

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault()
            setActiveIndex(i => Math.min(i + 1, allResults.length - 1))
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setActiveIndex(i => Math.max(i - 1, 0))
        } else if (e.key === "Enter" && allResults[activeIndex]) {
            allResults[activeIndex].action()
        }
    }

    // Reset active index when query changes
    useEffect(() => setActiveIndex(0), [query])

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -12 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="fixed top-[20vh] left-1/2 -translate-x-1/2 z-50
                                   w-full max-w-xl bg-[#0f172a] border border-white/10
                                   rounded-2xl shadow-[0_0_80px_rgba(59,130,246,0.18)]
                                   overflow-hidden"
                    >
                        {/* Search input */}
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                            <Search size={16} className="text-gray-400 shrink-0" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={handleKey}
                                placeholder="Search pages or mentors…"
                                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500"
                            />
                            <div className="flex items-center gap-1">
                                <kbd className="text-[10px] text-gray-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">ESC</kbd>
                            </div>
                            <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors">
                                <X size={14} />
                            </button>
                        </div>

                        {/* Results */}
                        <div className="max-h-80 overflow-y-auto py-2">
                            {allResults.length === 0 && (
                                <div className="px-5 py-8 text-center text-sm text-gray-500">
                                    No results for "{query}"
                                </div>
                            )}

                            {/* Pages section */}
                            {filteredRoutes.length > 0 && (
                                <div>
                                    <div className="px-5 py-1.5 text-[10px] text-gray-500 uppercase tracking-widest">
                                        Pages
                                    </div>
                                    {filteredRoutes.map((r, i) => {
                                        const globalIdx = i
                                        return (
                                            <button
                                                key={r.label}
                                                onClick={allResults[globalIdx].action}
                                                onMouseEnter={() => setActiveIndex(globalIdx)}
                                                className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors
                                                    ${activeIndex === globalIdx ? "bg-blue-500/15 text-white" : "text-gray-300 hover:bg-white/5"}`}
                                            >
                                                <span className={activeIndex === globalIdx ? "text-blue-400" : "text-gray-500"}>
                                                    {STATIC_ROUTES.find(s => s.label === r.label)?.icon}
                                                </span>
                                                <span className="text-sm">{r.label}</span>
                                                {activeIndex === globalIdx && (
                                                    <span className="ml-auto text-[10px] text-gray-500">
                                                        <kbd className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">↵</kbd>
                                                    </span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Mentors section */}
                            {filteredMentors.length > 0 && (
                                <div>
                                    <div className="px-5 py-1.5 text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                                        Mentors
                                    </div>
                                    {filteredMentors.map((m, i) => {
                                        const globalIdx = filteredRoutes.length + i
                                        const catColor = CATEGORY_COLOR[m.category] ?? "text-gray-400"
                                        return (
                                            <button
                                                key={m.id}
                                                onClick={allResults[globalIdx].action}
                                                onMouseEnter={() => setActiveIndex(globalIdx)}
                                                className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors
                                                    ${activeIndex === globalIdx ? "bg-blue-500/15 text-white" : "text-gray-300 hover:bg-white/5"}`}
                                            >
                                                <span className={activeIndex === globalIdx ? "text-blue-400" : "text-gray-500"}>
                                                    <User size={15} />
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm truncate">{m.name}</div>
                                                    <div className={`text-xs mt-0.5 ${catColor}`}>{m.category} · MPI {m.mpi_score.toFixed(3)}</div>
                                                </div>
                                                {activeIndex === globalIdx && (
                                                    <span className="ml-auto text-[10px] text-gray-500 shrink-0">
                                                        <kbd className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">↵</kbd>
                                                    </span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer hint */}
                        <div className="px-5 py-2.5 border-t border-white/5 flex items-center gap-4 text-[10px] text-gray-600">
                            <span><kbd className="bg-white/5 border border-white/10 px-1 rounded">↑↓</kbd> navigate</span>
                            <span><kbd className="bg-white/5 border border-white/10 px-1 rounded">↵</kbd> select</span>
                            <span><kbd className="bg-white/5 border border-white/10 px-1 rounded">ESC</kbd> close</span>
                            <span className="ml-auto">⌘K / Ctrl+K to open anywhere</span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}