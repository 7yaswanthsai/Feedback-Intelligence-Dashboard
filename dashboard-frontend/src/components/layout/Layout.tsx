import { type ReactNode, useEffect, useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
    LayoutDashboard, Users, BarChart3, TrendingUp, Sparkles, Search, GitCompare
} from "lucide-react"
import CommandPalette from "../ui/CommandPalette"
import ToastContainer from "../ui/Toast"
import { useDashboard } from "../../context/DashboardContext"

interface LayoutProps { children: ReactNode }

function useTimeAgo(date: Date | null): string {
    const [label, setLabel] = useState("—")

    useEffect(() => {
        if (!date) { setLabel("—"); return }

        const update = () => {
            const secs = Math.floor((Date.now() - date.getTime()) / 1000)
            if (secs < 10) setLabel("just now")
            else if (secs < 60) setLabel(`${secs}s ago`)
            else if (secs < 3600) setLabel(`${Math.floor(secs / 60)}m ago`)
            else setLabel(`${Math.floor(secs / 3600)}h ago`)
        }

        update()
        const id = setInterval(update, 5000)
        return () => clearInterval(id)
    }, [date])

    return label
}

export default function Layout({ children }: LayoutProps) {
    const [paletteOpen, setPaletteOpen] = useState(false)
    const { toasts, dismissToast, lastSyncTime } = useDashboard()
    const syncLabel = useTimeAgo(lastSyncTime)
    const location = useLocation()

    // ⌘K / Ctrl+K global listener
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault()
                setPaletteOpen(prev => !prev)
            }
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [])

    return (
        <div className="flex min-h-screen text-white relative overflow-hidden">

            {/* Ambient background */}
            <div className="absolute inset-0 -z-10 bg-[#0B1220]" />
            <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px]
                bg-blue-600/10 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px]
                bg-emerald-500/10 rounded-full blur-[120px] -z-10" />

            {/* Sidebar */}
            <aside className="w-64 backdrop-blur-xl bg-white/5
                border-r border-white/10 flex flex-col shadow-2xl shrink-0">

                {/* Logo */}
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-lg font-semibold tracking-wide">Mentor Intelligence</h1>
                    <p className="text-xs text-gray-400 mt-1">Analytics Command Center</p>
                </div>

                {/* ⌘K search trigger */}
                <div className="px-4 pt-4">
                    <button
                        onClick={() => setPaletteOpen(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
                                   bg-white/5 border border-white/10 text-gray-500 text-sm
                                   hover:border-blue-500/40 hover:text-gray-300 transition-all duration-200"
                    >
                        <Search size={14} />
                        <span className="flex-1 text-left text-xs">Search…</span>
                        <kbd className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">⌘K</kbd>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    <SidebarItem icon={<LayoutDashboard size={18} />} label="Overview" path="/" />
                    <SidebarItem icon={<Users size={18} />} label="Mentor Intelligence" path="/mentors" />
                    <SidebarItem icon={<BarChart3 size={18} />} label="Cohort Analytics" path="/cohorts" />
                    <SidebarItem icon={<TrendingUp size={18} />} label="Session Trends" path="/trends" />
                    <SidebarItem icon={<Sparkles size={18} />} label="AI Insights" path="/ai-insights" />
                    <SidebarItem icon={<GitCompare size={18} />} label="Compare Mentors" path="/compare" />
                </nav>

                {/* Live sync status */}
                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${lastSyncTime ? "bg-emerald-400 animate-pulse" : "bg-gray-600"
                                }`} />
                            <span className={lastSyncTime ? "text-emerald-400" : "text-gray-500"}>
                                {lastSyncTime ? "Live" : "Connecting…"}
                            </span>
                        </div>
                        <span className="text-xs text-gray-600">{syncLabel}</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto min-h-screen">
                {children}
            </main>

            {/* Command Palette */}
            <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

            {/* Toasts */}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </div>
    )
}

function SidebarItem({ icon, label, path }: { icon: ReactNode; label: string; path: string }) {
    return (
        <NavLink
            to={path}
            end
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${isActive
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.1)]"
                    : "hover:bg-white/5 text-gray-400 hover:text-gray-200 border border-transparent"
                }`
            }
        >
            {icon}
            <span className="text-sm font-medium">{label}</span>
        </NavLink>
    )
}