import { motion } from "framer-motion"

interface Props {
    icon?: string
    title: string
    message?: string
}

export default function EmptyState({ icon = "📭", title, message }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
        >
            <div className="text-4xl mb-4 opacity-60">{icon}</div>
            <div className="text-sm font-medium text-gray-400 mb-1">{title}</div>
            {message && <div className="text-xs text-gray-600 max-w-xs">{message}</div>}
        </motion.div>
    )
}