"""
analyze.py  —  POST /api/analyze
Orchestrates the full analysis pipeline for a given ticker.
"""

import math
from fastapi import APIRouter, HTTPException
from typing import Any

from db.models import AnalyzeRequest

from services.data_fetch import fetch_all_data
from services.data_processing import compute_derived_metrics, add_price_features
from services.dcf_model import run_dcf
from services.relative_valuation import run_relative_valuation
from services.price_prediction import run_prediction
from services.fundamental_analysis import run_fundamental_analysis
from db.models import (
    AnalyzeRequest,
    upsert_company,
    insert_financial_statements,
    insert_stock_prices,
    save_valuation_result,
    save_fundamental_analysis,
)

router = APIRouter()

def _sanitize(obj: Any) -> Any:
    """Recursively replace NaN/Inf with None for JSON serialisation."""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize(v) for v in obj]
    return obj


@router.post("/analyze")
async def analyze(req: AnalyzeRequest):
    ticker        = req.ticker.upper().strip()
    forecast_years = req.forecast_years
    forecast_days  = req.forecast_days

    # 1. Fetch data
    raw_data = fetch_all_data(ticker)
    info     = raw_data.get("info", {})

    if not info and raw_data["financials_df"].empty and raw_data["prices_df"].empty:
        raise HTTPException(status_code=404, detail=f"Could not fetch data for ticker '{ticker}'. Check the symbol.")

    # 2. Process
    metrics = compute_derived_metrics(raw_data["financials_df"], info)
    metrics["financials_df"] = raw_data["financials_df"]
    metrics["prices_df"]     = raw_data["prices_df"]

    prices_with_features = (
        add_price_features(raw_data["prices_df"])
        if not raw_data["prices_df"].empty
        else None
    )

    # 3. Valuation engines
    dcf_result       = run_dcf(metrics, forecast_years)
    sector           = info.get("sector", "Default")
    relative_result  = run_relative_valuation(metrics, sector)
    fundamental_result = run_fundamental_analysis(metrics)
    prediction_result = (
        run_prediction(prices_with_features, forecast_days)
        if prices_with_features is not None and not prices_with_features.empty
        else {"error": "No price data available for prediction."}
    )

    # 4. Persist to SQLite
    company_id = upsert_company(
        ticker,
        info.get("longName", ticker),
        info.get("sector", ""),
        info.get("industry", ""),
        metrics.get("market_cap"),
    )
    if not raw_data["financials_df"].empty:
        insert_financial_statements(company_id, raw_data["financials_df"])
    if not raw_data["prices_df"].empty:
        insert_stock_prices(company_id, raw_data["prices_df"])
    if "error" not in dcf_result:
        save_valuation_result(company_id, dcf_result)
    if "error" not in fundamental_result:
        save_fundamental_analysis(
            company_id,
            fundamental_result.get("metrics", {}),
            fundamental_result.get("summary", ""),
        )

    # 5. Build response
    fin_df     = metrics.get("financials_df")
    prices_df  = raw_data["prices_df"]
    prices_feat = prices_with_features

    response = {
        "ticker":       ticker,
        "company_name": info.get("longName", ticker),
        "sector":       info.get("sector", ""),
        "industry":     info.get("industry", ""),
        "exchange":     info.get("exchange", ""),

        "kpi": {
            "current_price":  metrics.get("current_price"),
            "market_cap":     metrics.get("market_cap"),
            "pe_ratio":       metrics.get("pe_ratio"),
            "beta":           metrics.get("beta"),
            "intrinsic_value":dcf_result.get("intrinsic_value") if "error" not in dcf_result else None,
            "margin_of_safety":dcf_result.get("margin_of_safety") if "error" not in dcf_result else None,
            "health_score":   fundamental_result.get("overall_score", 0),
            "health_grade":   fundamental_result.get("grade", ""),
        },

        # ── Tab 1: Stock Price ───────────────────────────────────────────
        "price_history": prices_df.to_dict("records") if not prices_df.empty else [],
        "price_features": prices_feat[
            ["date", "close_price", "ma_20", "ma_50", "ma_200"]
        ].to_dict("records") if prices_feat is not None and not prices_feat.empty else [],

        # ── Tab 2: DCF ──────────────────────────────────────────────────
        "dcf": dcf_result,

        # ── Tab 3: Relative Valuation ────────────────────────────────────
        "relative": {
            "sector_used":       relative_result["sector_used"],
            "company_multiples": relative_result["company_multiples"],
            "peer_medians":      relative_result["peer_medians"],
            "comparison_table":  relative_result["comparison_table"],
            "signals":           relative_result["signals"],
            "implied_prices":    relative_result["implied_prices"],
        },

        # ── Tab 4: ML Prediction ─────────────────────────────────────────
        "prediction": prediction_result,

        # ── Tab 5: Financials ────────────────────────────────────────────
        "financials": fin_df[
            ["year", "revenue", "operating_income", "net_income",
             "cash_flow", "total_assets", "total_liabilities"]
        ].to_dict("records") if fin_df is not None and not fin_df.empty else [],

        "financials_with_margins": fin_df[
            ["year", "revenue", "operating_income", "net_income",
             "cash_flow", "operating_margin", "net_margin"]
        ].to_dict("records") if fin_df is not None and "operating_margin" in fin_df.columns else [],

        # ── Tab 6: Fundamental Health ─────────────────────────────────────
        "fundamental": {
            "overall_score":    fundamental_result.get("overall_score"),
            "grade":            fundamental_result.get("grade"),
            "summary":          fundamental_result.get("summary"),
            "dimension_scores": fundamental_result.get("dimension_scores"),
            "metrics":          fundamental_result.get("metrics"),
        },
    }

    return _sanitize(response)
