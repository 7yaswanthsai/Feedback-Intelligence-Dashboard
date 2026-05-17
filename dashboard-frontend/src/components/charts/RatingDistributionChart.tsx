import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from "recharts"

export default function RatingDistributionGoogle({
    distribution,
    total
}: {
    distribution: Record<string, number>
    total: number
}) {

    const rows = [5, 4, 3, 2, 1]

    return (
        <div className="bg-[#111827] p-6 rounded-xl border border-gray-800">
            <h3 className="text-lg font-semibold mb-6">
                Student Rating Summary
            </h3>

            <div className="flex gap-10">

                {/* Average Rating */}
                <div className="text-center">
                    <div className="text-5xl font-bold text-white">
                        {(Object.entries(distribution)
                            .reduce((acc, [star, count]) => acc + Number(star) * count, 0)
                            / (total || 1)).toFixed(2)}
                    </div>

                    <div className="text-yellow-400 text-lg mt-2">
                        ★★★★★
                    </div>

                    <div className="text-gray-400 text-sm mt-2">
                        {total} Reviews
                    </div>
                </div>

                {/* Distribution Bars */}
                <div className="flex-1 space-y-3">
                    {rows.map(star => {
                        const count = distribution[String(star)] || 0
                        const percent = total ? (count / total) * 100 : 0

                        return (
                            <div key={star} className="flex items-center gap-3">
                                <span className="w-6 text-sm text-gray-300">
                                    {star}★
                                </span>

                                <div className="flex-1 bg-gray-700 h-2 rounded">
                                    <div
                                        className="bg-yellow-400 h-2 rounded"
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>

                                <span className="w-8 text-xs text-gray-400">
                                    {count}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}