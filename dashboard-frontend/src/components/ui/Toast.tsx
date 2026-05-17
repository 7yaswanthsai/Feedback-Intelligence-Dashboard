import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export interface ToastMessage {
    id: string
    message: string
    type: "success" | "info" | "warning"
}

interface Props {
    toasts: ToastMessage[]
    onDismiss: (id: string) => void
}

export default function ToastContainer({ toasts, onDismiss }: Props) {
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {toasts.map(toast => (
                    <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
                ))}
            </AnimatePresence>
        </div>
    )
}

function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
    useEffect(() => {
        const t = setTimeout(() => onDismiss(toast.id), 3000)
        return () => clearTimeout(t)
    }, [toast.id])

    const styles = {
        success: { dot: "bg-emerald-400", glow: "shadow-[0_0_20px_rgba(16,185,129,0.2)]", border: "border-emerald-500/20" },
        info: { dot: "bg-blue-400", glow: "shadow-[0_0_20px_rgba(59,130,246,0.2)]", border: "border-blue-500/20" },
        warning: { dot: "bg-yellow-400", glow: "shadow-[0_0_20px_rgba(245,158,11,0.2)]", border: "border-yellow-500/20" },
    }

    const s = styles[toast.type]

    return (
        <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`pointer-events-auto flex items-center gap-3 
                        bg-[#0f172a]/95 backdrop-blur-xl
                        border ${s.border} rounded-xl px-4 py-3 ${s.glow}`}
        >
            <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot} animate-pulse`} />
            <span className="text-sm text-gray-200 whitespace-nowrap">{toast.message}</span>
        </motion.div>
    )
}