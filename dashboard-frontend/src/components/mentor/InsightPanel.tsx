export default function InsightPanel({ text }: { text: string }) {
    return (
        <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a]
                    rounded-2xl p-6 border border-blue-500/20
                    shadow-[0_0_40px_rgba(59,130,246,0.1)]">

            <h3 className="text-lg font-semibold mb-4 text-blue-400">
                Executive Insight
            </h3>

            <p className="text-gray-300 leading-relaxed">
                {text}
            </p>
        </div>
    )
}