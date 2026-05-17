# Feedback Intelligence Dashboard

Real-time mentor analytics platform with KPI scoring, sentiment analysis, AI-generated insights, and automated Google Sheets synchronization.

![Feedback Intelligence Dashboard](assets/image.png)
---

# Overview

Feedback Intelligence Dashboard is a full-stack real-time analytics platform designed to transform raw student feedback into actionable mentor performance intelligence.

The system automates:

* feedback ingestion
* KPI computation
* mentor analytics
* trend analysis
* sentiment intelligence
* and AI-generated executive insights

through a scalable analytics pipeline.

The platform was designed for educational institutions to monitor mentor performance, identify risk patterns, and generate data-driven insights across programs and cohorts.

---

# Key Features

## Real-Time Feedback Pipeline

* Google Forms → Google Sheets → PostgreSQL synchronization
* Automated background sync every 60 seconds
* Duplicate prevention and validation logic
* Real-time dashboard updates

## Mentor Performance Analytics

* Proprietary Mentor Performance Index (MPI)
* Quality, consistency, reliability, and trend scoring
* Mentor ranking and categorization
* Weekly trend detection

## AI Executive Intelligence

* Gemini AI-generated mentor summaries
* Student sentiment analysis
* Improvement recommendations
* Momentum and outlook analysis
* Strategic intervention suggestions

## Interactive Dashboard

* Institution-level analytics
* Program and cohort drilldowns
* Mentor comparison views
* Trend visualizations
* Risk quadrant analysis
* Sentiment distribution charts

## Enterprise Features

* CSV export support
* Command palette navigation
* Auto-refresh dashboards
* Dynamic filtering and drilldowns

---

# Tech Stack

## Backend

* FastAPI
* SQLAlchemy
* PostgreSQL
* APScheduler

## Frontend

* React
* TypeScript
* Tailwind CSS
* Recharts
* Framer Motion

## AI & APIs

* Google Gemini 2.5 Flash
* Google Sheets API
* gspread

---

# System Architecture

Google Forms → Google Sheets → Background Sync → PostgreSQL → KPI Engine → FastAPI → React Dashboard → AI Insights

---

# Mentor Performance Index (MPI)

The MPI system replaces simple average ratings with a multi-dimensional evaluation framework.

The scoring model combines:

* Quality
* Consistency
* Reliability
* Trend Analysis

to generate more statistically reliable mentor evaluations.

---

# Dashboard Features

## Institution Analytics

* Overall mentor health
* Performance distribution
* Sentiment overview
* Risk monitoring

## Mentor Intelligence

* Ranked mentor leaderboard
* KPI breakdowns
* AI-generated executive briefs
* Trend analysis

## Cohort & Program Views

* Drilldown analytics
* Comparative analysis
* Performance monitoring

## Visualization System

* Risk quadrant charts
* Weekly trend graphs
* Sentiment distribution
* Radar comparison charts

---

# Key Engineering Highlights

* Real-time analytics pipeline
* Automated Google Sheets ingestion
* Composite KPI scoring engine
* AI-generated executive intelligence
* Relational database architecture
* Auto-refresh dashboard system
* Trend and statistical analysis
* Scalable API-driven design

---

# Database Schema

Core relational entities:

* Institutions
* Programs
* Cohorts
* Mentors
* Students
* Sessions
* Feedback

The system uses normalized relational modeling with foreign key relationships and duplicate protection constraints.

---

# API Features

* Mentor KPI APIs
* Analytics filtering
* Trend APIs
* AI intelligence endpoints
* CSV export APIs
* Comment analysis endpoints

---

# Setup

## Backend Setup

```bash id="3x9sqa"
pip install -r requirements.txt
```

Configure environment variables:

```env id="4b5n8z"
DATABASE_URL=your_postgres_url
GOOGLE_API_KEY=your_gemini_key
```

---

## Frontend Setup

```bash id="w7h1mu"
npm install
npm run dev
```

---

# Future Scope

* Role-based authentication
* Multi-institution support
* Predictive mentor risk forecasting
* Real-time notifications
* Cloud deployment
* Advanced NLP feedback analysis

---

# Author

Yaswanth Sai
