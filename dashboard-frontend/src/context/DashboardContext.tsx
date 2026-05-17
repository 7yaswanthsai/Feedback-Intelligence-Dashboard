import { createContext, useContext, useState, useCallback } from "react"

export interface ToastMessage {
    id: string
    message: string
    type: "success" | "info" | "warning"
}

interface DashboardContextType {
    institution: string | null
    program: string | null
    cohort: string | null
    setInstitution: (val: string | null) => void
    setProgram: (val: string | null) => void
    setCohort: (val: string | null) => void

    // Toast
    toasts: ToastMessage[]
    pushToast: (message: string, type?: ToastMessage["type"]) => void
    dismissToast: (id: string) => void

    // Sync
    lastSyncTime: Date | null
    setLastSyncTime: (d: Date) => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const [institution, setInstitution] = useState<string | null>(null)
    const [program, setProgram] = useState<string | null>(null)
    const [cohort, setCohort] = useState<string | null>(null)
    const [toasts, setToasts] = useState<ToastMessage[]>([])
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

    const pushToast = useCallback((message: string, type: ToastMessage["type"] = "info") => {
        const id = `${Date.now()}-${Math.random()}`
        setToasts(prev => [...prev.slice(-4), { id, message, type }])
    }, [])

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    return (
        <DashboardContext.Provider value={{
            institution, program, cohort,
            setInstitution, setProgram, setCohort,
            toasts, pushToast, dismissToast,
            lastSyncTime, setLastSyncTime,
        }}>
            {children}
        </DashboardContext.Provider>
    )
}

export function useDashboard() {
    const context = useContext(DashboardContext)
    if (!context) throw new Error("DashboardContext missing")
    return context
}