export interface MentorAnalytics {
    mentor_id: number
    mentor_name: string
    avg_rating: number
    feedback_count: number

    quality_score: number
    consistency_score: number
    reliability_score: number
    trend_score: number
    mpi_score: number
    confidence_score: number
    category: string
}