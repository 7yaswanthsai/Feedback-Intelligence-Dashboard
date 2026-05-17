import { useEffect, useRef, useState } from "react"

export function useCountUp(target: number, duration = 900): number {
    const [display, setDisplay] = useState(0)
    const rafRef = useRef<number | null>(null)
    const startRef = useRef<number | null>(null)
    const fromRef = useRef(0)

    useEffect(() => {
        fromRef.current = display
        startRef.current = null

        if (rafRef.current) cancelAnimationFrame(rafRef.current)

        // If target is a float (e.g. 4.27), use shorter duration
        const isFloat = target % 1 !== 0

        const step = (timestamp: number) => {
            if (!startRef.current) startRef.current = timestamp
            const elapsed = timestamp - startRef.current
            const progress = Math.min(elapsed / duration, 1)

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            const current = fromRef.current + (target - fromRef.current) * eased

            setDisplay(isFloat ? parseFloat(current.toFixed(2)) : Math.round(current))

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(step)
            }
        }

        rafRef.current = requestAnimationFrame(step)

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [target])

    return display
}