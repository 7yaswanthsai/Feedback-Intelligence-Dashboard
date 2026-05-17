import { motion } from "framer-motion"
import Lottie from "lottie-react"
import botAnimation from "../../assets/bot-loading.json"
import ReactMarkdown from "react-markdown"

export default function ExecutiveBrief({
    text,
    loading
}: {
    text: string
    loading: boolean
}) {

    return (
        <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b]
                    rounded-2xl p-8 border border-blue-500/20
                    shadow-[0_0_60px_rgba(59,130,246,0.08)]">

            <h3 className="text-xl font-semibold text-blue-400 mb-6">
                Executive Intelligence Brief
            </h3>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-32 opacity-80">
                        <Lottie animationData={botAnimation} loop />
                    </div>
                    <p className="text-gray-400 text-sm mt-4">
                        Generating AI intelligence analysis...
                    </p>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="whitespace-pre-line text-gray-300 leading-relaxed"
                >
                    <ReactMarkdown>{text}</ReactMarkdown>
                </motion.div>
            )}

        </div>
    )
}