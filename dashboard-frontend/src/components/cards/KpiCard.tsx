import { motion } from "framer-motion"
import { useCountUp } from "../../hooks/useCountUp"

interface Props {
    title: string
    value: number
    loading: boolean
}

export default function KpiCard({ title, value, loading }: Props) {
    const displayed = useCountUp(loading ? 0 : value)

    // Detect if value is a decimal (e.g. avg rating)
    const isFloat = value % 1 !== 0
    const formatted = isFloat ? displayed.toFixed(2) : displayed.toLocaleString()

    return (
        <motion.div
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="relative group rounded-2xl p-6
            bg-white/5 backdrop-blur-xl
            border border-white/10
            shadow-xl hover:shadow-2xl
            transition-all duration-300 overflow-hidden"
        >
            <div className="text-sm text-gray-400 mb-2">
                {title}
            </div>

            {loading ? (
                <div className="h-8 w-20 bg-gray-700 animate-pulse rounded-md" />
            ) : (
                <motion.div
                    key={value}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-3xl font-bold text-white tabular-nums"
                >
                    {formatted}
                </motion.div>
            )}

            <div className="absolute inset-0 opacity-0 group-hover:opacity-100
                            transition duration-500
                            bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_60%)]" />
        </motion.div>
    )
}