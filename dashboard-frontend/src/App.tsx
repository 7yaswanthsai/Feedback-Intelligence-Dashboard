import Layout from "./components/layout/Layout"
import { Routes, Route, useLocation } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import InstitutionPage from "./pages/InstitutionPage"
import MentorPage from "./pages/MentorPage"
import MentorIntelligencePage from "./pages/MentorIntelligencePage"
import CohortAnalyticsPage from "./pages/CohortAnalyticsPage"
import SessionTrendsPage from "./pages/SessionTrendsPage"
import AIInsightsPage from "./pages/AiInsightPage.tsx"
import MentorComparePage from "./pages/MentorComparePage"

function App() {
  const location = useLocation()

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<InstitutionPage />} />
          <Route path="/mentor/:mentorId" element={<MentorPage />} />
          <Route path="/mentors" element={<MentorIntelligencePage />} />
          <Route path="/cohorts" element={<CohortAnalyticsPage />} />
          <Route path="/trends" element={<SessionTrendsPage />} />
          <Route path="/ai-insights" element={<AIInsightsPage />} />
          <Route path="/compare" element={<MentorComparePage />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  )
}

export default App