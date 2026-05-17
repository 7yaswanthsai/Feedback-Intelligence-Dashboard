import { motion } from "framer-motion"

interface Props {
    quality: number
    consistency: number
    reliability: number
    trend: number
}

export default function ScoreBreakdown({
    quality,
    consistency,
    reliability,
    trend
}: Props) {

    const scores = [
        { label: "Quality", value: quality, color: "bg-blue-500" },
        { label: "Consistency", value: consistency, color: "bg-green-500" },
        { label: "Reliability", value: reliability, color: "bg-purple-500" },
        { label: "Trend", value: (trend + 1) / 2, color: "bg-yellow-500" } // normalize -1 to 1 → 0 to 1
    ]

    return (
        <div className="bg-[#111827] rounded-2xl p-6 border border-gray-800 space-y-6">
            <h3 className="text-lg font-semibold">Performance Breakdown</h3>

            {scores.map((score, index) => (
                <div key={index}>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">{score.label}</span>
                        <span className="text-gray-300">
                            {(score.value * 100).toFixed(0)}%
                        </span>
                    </div>

                    <div className="w-full bg-gray-800 rounded-full h-2">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${score.value * 100}%` }}
                            transition={{ duration: 0.8 }}
                            className={`h-2 rounded-full ${score.color}`}
                        />
                    </div>
                </div>
            ))}

        </div>
    )
}