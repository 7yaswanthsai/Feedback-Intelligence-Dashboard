import { useState, useEffect } from "react"

interface Props {
    onFilterChange: (filters: {
        program?: string
        cohort?: string
    }) => void
}

export default function FilterBar({ onFilterChange }: Props) {
    const [program, setProgram] = useState<string>("")
    const [cohort, setCohort] = useState<string>("")

    const programs = [
        "AI & ML",
        "Data Engineering",
        "MBA Analytics"
    ]

    const cohorts: Record<string, string[]> = {
        "AI & ML": ["AI & ML Cohort 1", "AI & ML Cohort 2"],
        "Data Engineering": ["Data Engineering Cohort 1", "Data Engineering Cohort 2"],
        "MBA Analytics": ["MBA Analytics Cohort 1", "MBA Analytics Cohort 2"]
    }

    useEffect(() => {
        onFilterChange({
            program: program || undefined,
            cohort: cohort || undefined
        })
    }, [program, cohort])

    return (
        <div className="bg-[#111827] p-6 rounded-xl border border-gray-800 flex gap-6 items-center">

            <select
                value={program}
                onChange={(e) => {
                    setProgram(e.target.value)
                    setCohort("")
                }}
                className="bg-gray-900 border border-gray-700 p-2 rounded-md"
            >
                <option value="">All Programs</option>
                {programs.map((p) => (
                    <option key={p} value={p}>{p}</option>
                ))}
            </select>

            <select
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
                disabled={!program}
                className="bg-gray-900 border border-gray-700 p-2 rounded-md"
            >
                <option value="">All Cohorts</option>
                {program && cohorts[program].map((c) => (
                    <option key={c} value={c}>{c}</option>
                ))}
            </select>

            <button
                onClick={() => {
                    setProgram("")
                    setCohort("")
                }}
                className="bg-gray-800 px-4 py-2 rounded-md hover:bg-gray-700 transition"
            >
                Reset
            </button>

        </div>
    )
}