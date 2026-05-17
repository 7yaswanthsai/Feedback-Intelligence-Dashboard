// ─── CSV Export ───────────────────────────────────────────────────────────────
export function downloadCSV(data: Record<string, any>[], filename: string) {
    if (!data.length) return

    const headers = Object.keys(data[0])
    const escape = (v: any) => {
        const s = String(v ?? "").replace(/"/g, '""')
        return s.includes(",") || s.includes("\n") || s.includes('"') ? `"${s}"` : s
    }

    const rows = [
        headers.join(","),
        ...data.map(row => headers.map(h => escape(row[h])).join(","))
    ]

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

// ─── Print-based PDF ──────────────────────────────────────────────────────────
export function printAsPDF(title: string) {
    const original = document.title
    document.title = title
    window.print()
    document.title = original
}