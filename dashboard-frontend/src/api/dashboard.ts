import api from "./client"

export async function fetchMentorKPI() {
    const response = await api.get("/mentors/kpi")
    return response.data
}