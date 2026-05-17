# Final Submission Report
**Project Name**: Feedback Intelligence Dashboard
**Domain**: Data Analytics & AI-Powered Web Application

---

## 1. Problem Statement
Educational institutions and training bootcamps struggle to effectively measure, track, and act upon student feedback regarding instructors in real-time. Manual feedback analysis is time-consuming, prone to human bias, and fails to identify performance trends or qualitative insights quickly. As a result, at-risk mentors, failing cohorts, or fluctuating teaching standards are often identified too late, negatively impacting the student learning experience.

## 2. Objective
To build an automated, intelligent Feedback Analytics Dashboard that ingests student feedback natively, calculates statistically sound performance metrics, spots trends asynchronously, and leverages Generative AI to distill unstructured qualitative feedback into actionable executive insights. The goal is to transform raw feedback forms into a centralized portal for real-time decision-making.

## 3. Approach & Methodology
The system was designed using a microservices-inspired architecture divided into three core pillars:
1. **Automated Data Ingestion Pipeline**: A background scheduler routinely connects to Google Sheets (the form collection hub) to extract, deduplicate, and normalize new feedback entries into a relational database hierarchy (Institution -> Program -> Cohort -> Session -> Mentor -> Feedback).
2. **Statistical KPI Engine**: Rather than relying on simple averages, the engine calculates a **Mentor Performance Index (MPI)** factoring in:
   - *Quality*: Raw average ratings.
   - *Consistency*: Inverse of standard deviation.
   - *Reliability*: Volume of feedback penalizing low-data outliers.
   - *Trend Score*: Linear regression on recent weeks to identify momentum.
3. **AI-Powered Qualitative Analysis**: Processing the aggregated statistics alongside raw student comments through an LLM to generate narrative reports (Executive Intelligence Briefs) that highlight "Strength Signals" and "Improvement Signals."
4. **Interactive Visualization**: A comprehensive frontend dashboard to digest these complex data structures visually through charts, leaderboards, and deep-dive profiles.

## 4. Tools & Technologies Used
### **Backend**
*   **Python & FastAPI**: Chosen for its high performance, asynchronous capabilities out-of-the-box, and robust automatic REST API documentation.
*   **SQLAlchemy**: An Object Relational Mapper (ORM) used to cleanly map Python objects to database tables, handling complex SQL joins securely.
*   **gspread & Google Service Accounts**: For seamless, programmatic integration with Google Sheets data without requiring manual CSV uploads.
*   **Google Gemini (gemini-2.5-flash)**: Selected as the LLM to generate the Mentor Intelligence Briefs due to its speed, expansive context window, and structural output consistency compared to older models.

### **Frontend**
*   **React 19 & TypeScript**: Provides a robust, type-safe development experience that catches errors at compile time and structures complex UI component logic.
*   **Vite**: Used over Create React App or Webpack for its extremely fast Hot Module Replacement (HMR) and optimized build times.
*   **TailwindCSS v4**: Used for rapid, utility-first UI styling, ensuring the dashboard looks premium and responsive without massive CSS files.
*   **Framer Motion**: Integrated to provide dynamic micro-animations and smooth page transitions, enhancing the modern feel of the application.
*   **Recharts**: A highly customizable charting library used to render the complex KPI data (distributions, weekly trends, volumes) reliably across device sizes.

## 5. Dataset
The primary dataset is ingested from **"Futurense Student Feedback Responses"** via Google Forms/Sheets. 
*   **Features include:** Timestamp, Program Name, Cohort Name, Mentor Name, Week Number, Quantitative Session Ratings (1-5 scale), and unstructured Qualitative Comments ("How was the session?", "Any additional feedback").

## 6. Results & Output
*   **Automated Categorization**: Mentors are algorithmically categorized into performance tiers (e.g., *Top Performer*, *Stable*, *High Volatility*, *At Risk*).
*   **Executive Dashboards**: Provided a fully functional, real-time UI displaying Institutional KPI overviews, Mentor Leaderboards, and individual Mentor Deep-Dives.
*   **AI Briefs**: Successfully automated the generation of narrative "Executive Intelligence Briefs" per mentor, saving hours of manual review time while surfacing actionable insights previously buried in text data.

## 7. Challenges Faced
*   **Engineering a Fair Metric**: It was challenging to create a mathematical model that didn't unfairly penalize new mentors with less feedback while still rewarding veteran mentors with steady track records. The solution was the multi-variable MPI scoring model factoring Reliability and Z-scores.
*   **Ensuring LLM Output Consistency**: Unstructured student comments can be contradictory or sparse. A strict prompt engineering strategy was required to bind the Gemini AI strictly to the provided data, forcing it to categorize outputs safely into "Strengths" and "Improvements" without hallucinating facts.
*   **Data Integrity & Syncing**: Establishing a background process that continuously pulls from a live Google Sheet required careful deduplication logic (using timestamps and hierarchy checks) to prevent ghost data or database locking issues.
