"""
models.py
----------
Database initialization, CRUD helpers, and Pydantic models.
"""

import pandas as pd
from pydantic import BaseModel
from db.database import get_conn

class AnalyzeRequest(BaseModel):
    ticker: str
    forecast_years: int = 5
    forecast_days: int = 30

def initialize_database():
    """Create all tables if they don't exist."""
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS companies (
            company_id    INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker_symbol TEXT UNIQUE NOT NULL,
            company_name  TEXT,
            sector        TEXT,
            industry      TEXT,
            market_cap    REAL
        );

        CREATE TABLE IF NOT EXISTS financial_statements (
            statement_id      INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id        INTEGER,
            year              INTEGER,
            revenue           REAL,
            operating_income  REAL,
            net_income        REAL,
            total_assets      REAL,
            total_liabilities REAL,
            cash_flow         REAL,
            FOREIGN KEY (company_id) REFERENCES companies(company_id)
        );

        CREATE TABLE IF NOT EXISTS stock_prices (
            price_id    INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id  INTEGER,
            date        TEXT,
            open_price  REAL,
            close_price REAL,
            high_price  REAL,
            low_price   REAL,
            volume      REAL,
            FOREIGN KEY (company_id) REFERENCES companies(company_id)
        );

        CREATE TABLE IF NOT EXISTS valuation_results (
            valuation_id     INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id       INTEGER,
            intrinsic_value  REAL,
            terminal_value   REAL,
            discount_rate    REAL,
            margin_of_safety REAL,
            valuation_signal TEXT,
            FOREIGN KEY (company_id) REFERENCES companies(company_id)
        );

        CREATE TABLE IF NOT EXISTS prediction_results (
            prediction_id    INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id       INTEGER,
            prediction_date  TEXT,
            predicted_price  REAL,
            model_used       TEXT,
            confidence_score REAL,
            FOREIGN KEY (company_id) REFERENCES companies(company_id)
        );

        CREATE TABLE IF NOT EXISTS fundamental_analysis (
            analysis_id      INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id       INTEGER,
            roe              REAL,
            debt_to_equity   REAL,
            current_ratio    REAL,
            profit_margin    REAL,
            analysis_summary TEXT,
            FOREIGN KEY (company_id) REFERENCES companies(company_id)
        );
    """)
    conn.commit()
    conn.close()

def upsert_company(ticker, name, sector, industry, market_cap) -> int:
    conn = get_conn()
    conn.execute("""
        INSERT INTO companies (ticker_symbol, company_name, sector, industry, market_cap)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(ticker_symbol) DO UPDATE SET
            company_name = excluded.company_name,
            sector       = excluded.sector,
            industry     = excluded.industry,
            market_cap   = excluded.market_cap
    """, (ticker, name, sector, industry, market_cap))
    conn.commit()
    row = conn.execute("SELECT company_id FROM companies WHERE ticker_symbol = ?", (ticker,)).fetchone()
    conn.close()
    return row["company_id"]

def insert_financial_statements(company_id: int, df: pd.DataFrame):
    conn = get_conn()
    conn.execute("DELETE FROM financial_statements WHERE company_id = ?", (company_id,))
    for _, row in df.iterrows():
        conn.execute("""
            INSERT INTO financial_statements
                (company_id, year, revenue, operating_income, net_income,
                 total_assets, total_liabilities, cash_flow)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            company_id, int(row.get("year", 0)),
            _safe(row.get("revenue")), _safe(row.get("operating_income")),
            _safe(row.get("net_income")), _safe(row.get("total_assets")),
            _safe(row.get("total_liabilities")), _safe(row.get("cash_flow")),
        ))
    conn.commit()
    conn.close()

def insert_stock_prices(company_id: int, df: pd.DataFrame):
    conn = get_conn()
    conn.execute("DELETE FROM stock_prices WHERE company_id = ?", (company_id,))
    for _, row in df.iterrows():
        conn.execute("""
            INSERT INTO stock_prices
                (company_id, date, open_price, close_price, high_price, low_price, volume)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            company_id, str(row["date"]),
            _safe(row.get("open_price")), _safe(row.get("close_price")),
            _safe(row.get("high_price")), _safe(row.get("low_price")),
            _safe(row.get("volume")),
        ))
    conn.commit()
    conn.close()

def save_valuation_result(company_id: int, result: dict):
    conn = get_conn()
    conn.execute("DELETE FROM valuation_results WHERE company_id = ?", (company_id,))
    conn.execute("""
        INSERT INTO valuation_results
            (company_id, intrinsic_value, terminal_value,
             discount_rate, margin_of_safety, valuation_signal)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        company_id,
        _safe(result.get("intrinsic_value")),
        _safe(result.get("terminal_value")),
        _safe(result.get("discount_rate")),
        _safe(result.get("margin_of_safety")),
        result.get("valuation_signal"),
    ))
    conn.commit()
    conn.close()

def save_fundamental_analysis(company_id: int, metrics: dict, summary: str):
    conn = get_conn()
    conn.execute("DELETE FROM fundamental_analysis WHERE company_id = ?", (company_id,))
    conn.execute("""
        INSERT INTO fundamental_analysis
            (company_id, roe, debt_to_equity, current_ratio, profit_margin, analysis_summary)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        company_id,
        _safe(metrics.get("roe")),
        _safe(metrics.get("debt_to_equity")),
        _safe(metrics.get("current_ratio")),
        _safe(metrics.get("profit_margin")),
        summary,
    ))
    conn.commit()
    conn.close()

def _safe(val):
    if val is None:
        return None
    try:
        import math
        if math.isnan(float(val)):
            return None
        return float(val)
    except (TypeError, ValueError):
        return None
