# StockAI – Equity Valuation & Forecasting Platform

A full end-to-end AI financial analysis platform built with a modern decoupled architecture using **FastAPI (Python)** for the backend and **Vite + React.js** for the frontend. Features a beautiful glassmorphic UI, both light and dark modes, and comprehensive financial models.

## ✨ Features

| Module | Description |
|---|---|
| **Data Acquisition** | Fetches income statements, balance sheets, cash flows, and prices via `yfinance`. |
| **Relational Database** | Stores all analysis data locally via robust SQLite models (`models.py`). |
| **DCF Valuation** | Estimates WACC, forecasts Free Cash Flow, calculates Terminal Value & Intrinsic Value per share. |
| **Relative Valuation** | Compares P/E, EV/EBITDA, P/B, P/S against sector benchmarks. |
| **ML Prediction** | Uses Linear Regression + Random Forest for customized multi-day price-action forecasting. |
| **Fundamental Analysis** | Computes a 4-pillar health score (Profitability, Liquidity, Leverage, Efficiency) and AI text summary. |
| **Export Engine** | Bundles 8 key financial CSVs into a `.zip` archive ready for Microsoft Power BI import. |
| **Modern UI/UX** | Built with Framer Motion, Lucide icons, Plotly charts, and an elegant Glassmorphism dual-sidebar layout. |

## 🏗️ Project Structure

```text
AI-Valuation-Platform/
├── backend/                       ← FastAPI Python Backend
│   ├── main.py                    ← API entry point (CORS, Routers setup)
│   ├── routers/                   ← API endpoints (analyze.py, export.py)
│   ├── services/                  ← ML and Financial logic engines
│   │   ├── data_fetch.py
│   │   ├── dcf_model.py
│   │   └── ...
│   ├── db/                        
│   │   ├── database.py            ← SQLite Connection
│   │   └── models.py              ← DB table init & CRUD operations
│   ├── requirements.txt           ← Python dependencies
│   └── stock_platform.db          ← Database generated upon running
│
├── frontend/                      ← React + Vite Frontend
│   ├── index.html
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx                ← Main React orchestrator
│   │   ├── index.css              ← Glassmorphism & Light/Dark Theme System
│   │   ├── api/                   ← Axios API client
│   │   ├── pages/                 ← LandingPage, AnalysisPage
│   │   └── components/            
│   │       ├── Layout/            ← Sidebar
│   │       ├── UI/                ← KPI Cards, Loader, Error Banners, TabSidebar
│   │       └── Charts/            ← Data visualization modules (Plotly)
```

## 🚀 Setup & Run Instructions

To run this application locally, you need to start **both** the FastAPI server and the React dev server in two separate terminal windows.

### 1. Start the Backend (FastAPI)
Open your first terminal window, navigate into the `backend/` directory, and run the following commands:
```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
.\venv\Scripts\activate      # On Windows
# source venv/bin/activate   # On Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn main:app --port 8000 --reload
```
*The API is now running at `http://localhost:8000`*

### 2. Start the Frontend (React + Vite)
Open a second terminal window, navigate into the `frontend/` directory, and run the following commands:
```bash
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```
*The Web App is now running at `http://localhost:5173`*

---

## 💻 How to Use

1. Open your browser and navigate to `http://localhost:5173`.
2. In the left **Config Sidebar**:
   - Enter a valid ticker symbol (e.g. `AAPL`, `TSLA`, `MSFT`).
   - Select your DCF Horizon (e.g., 5 Years).
   - Use the slider to set your Price Prediction Horizon (e.g., 30 Days).
3. Click **Run Analysis**. The main configuration sidebar will cleanly collapse.
4. Navigate through the inner **Analysis Sidebar** to explore Stock Price trends, DCF outputs, Relative Valuation, ML predictions, and Fundamental Health.
5. In the **Export Data** tab, click Download to retrieve your `.zip` payload for Power BI.

---

## 📊 Power BI Integration

The Export module allows one-click generation of a ZIP archive containing:
- `company_overview.csv`
- `financial_statements.csv`
- `stock_prices.csv`
- `valuation_results.csv`
- `relative_valuation.csv`
- `prediction_actuals.csv`
- `future_predictions.csv`
- `fundamental_analysis.csv`

**Quick Setup in Power BI:** Unzip the archive, use `Get Data -> Text/CSV`, load all the files, and establish relationships based on the common `company_id` or `ticker` column to generate massive visual dashboards instantly.

---

## 📌 Notes
- **Disclaimer**: This platform is for **educational purposes only**. It does not constitute financial advice.
- **Latency**: Data pulling speed depends entirely on Yahoo Finance connection latency.
- **Initialization**: The first time you execute a search, `stock_platform.db` is securely initialized, and ML models train dynamically on your requested ticker's data.
