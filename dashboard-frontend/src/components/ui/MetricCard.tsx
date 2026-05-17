import { useCountUp } from "../../hooks/useCountUp"

interface Props {
    title: string
    value: string | number
}

export default function MetricCard({ title, value }: Props) {
    const isNumeric = typeof value === "number"
    const displayed = useCountUp(isNumeric ? value : 0)

    const isFloat = isNumeric && (value as number) % 1 !== 0
    const formatted = isNumeric
        ? (isFloat ? displayed.toFixed(2) : displayed.toLocaleString())
        : value

    return (
        <div className="bg-[#111827] rounded-xl border border-gray-800 p-6 shadow-lg">
            <div className="text-sm text-gray-400 mb-2">
                {title}
            </div>
            <div className="text-2xl font-semibold text-white tabular-nums">
                {formatted}
            </div>
        </div>
    )
}