import { motion } from "framer-motion"
import { RefreshCw, WifiOff } from "lucide-react"

interface Props {
    title?: string
    message?: string
    onRetry?: () => void
}

export default function ErrorState({
    title = "Failed to load data",
    message = "Could not connect to the backend. Make sure the server is running on port 8000.",
    onRetry
}: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6"
        >
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
                <WifiOff size={28} className="text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-400 max-w-sm leading-relaxed mb-6">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10
                               text-sm text-gray-300 hover:border-blue-500/40 hover:text-white transition-all duration-200"
                >
                    <RefreshCw size={14} /> Retry
                </button>
            )}
        </motion.div>
    )
}