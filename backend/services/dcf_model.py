"""
dcf_model.py  (ported from Original-Repo/dcf_model.py)
Full Discounted Cash Flow valuation engine.
"""

import numpy as np
import pandas as pd

RISK_FREE_RATE       = 0.045
MARKET_RETURN        = 0.10
TERMINAL_GROWTH_RATE = 0.025


def run_dcf(metrics: dict, forecast_years: int = 5) -> dict:
    base_fcf = _estimate_base_fcf(metrics)
    if base_fcf is None or (isinstance(base_fcf, float) and np.isnan(base_fcf)) or base_fcf <= 0:
        return {"error": "Insufficient free cash flow data for DCF valuation."}

    fcf_growth_rate = _estimate_fcf_growth(metrics)
    wacc            = _compute_wacc(metrics)

    projected_fcfs = []
    fcf = base_fcf
    for year in range(1, forecast_years + 1):
        fcf = fcf * (1 + fcf_growth_rate)
        projected_fcfs.append({"year": year, "fcf": fcf})

    final_fcf      = projected_fcfs[-1]["fcf"]
    terminal_value = (final_fcf * (1 + TERMINAL_GROWTH_RATE)) / (wacc - TERMINAL_GROWTH_RATE)

    pv_fcfs = sum(item["fcf"] / ((1 + wacc) ** item["year"]) for item in projected_fcfs)
    pv_terminal    = terminal_value / ((1 + wacc) ** forecast_years)
    total_intrinsic = pv_fcfs + pv_terminal

    shares  = metrics.get("shares_outstanding")
    net_debt = float(metrics.get("total_debt") or 0)

    equity_value = total_intrinsic - net_debt
    if shares and shares > 0:
        intrinsic_per_share = equity_value / shares
    else:
        intrinsic_per_share = None

    current_price    = metrics.get("current_price")
    margin_of_safety = None
    valuation_signal = "Insufficient Data"

    if intrinsic_per_share and current_price and current_price > 0:
        margin_of_safety = (intrinsic_per_share - current_price) / intrinsic_per_share * 100
        if margin_of_safety > 20:
            valuation_signal = "Undervalued"
        elif margin_of_safety < -20:
            valuation_signal = "Overvalued"
        else:
            valuation_signal = "Fairly Valued"

    return {
        "base_fcf":        base_fcf,
        "fcf_growth_rate": fcf_growth_rate,
        "wacc":            wacc,
        "projected_fcfs":  projected_fcfs,
        "terminal_value":  terminal_value,
        "pv_fcfs":         pv_fcfs,
        "pv_terminal":     pv_terminal,
        "total_intrinsic": total_intrinsic,
        "intrinsic_value": intrinsic_per_share,
        "current_price":   current_price,
        "margin_of_safety": margin_of_safety,
        "valuation_signal": valuation_signal,
        "discount_rate":   wacc,
        "forecast_years":  forecast_years,
    }


def _estimate_base_fcf(metrics: dict):
    fcf = metrics.get("latest_fcf")
    if fcf is not None and not (isinstance(fcf, float) and np.isnan(fcf)) and fcf > 0:
        return float(fcf)
    fin_df = metrics.get("financials_df")
    if fin_df is not None and not fin_df.empty:
        ni = fin_df["net_income"].dropna()
        if len(ni) > 0:
            return float(ni.iloc[-1])
    return None


def _estimate_fcf_growth(metrics: dict) -> float:
    cagr = metrics.get("revenue_cagr")
    if cagr is not None and not (isinstance(cagr, float) and np.isnan(cagr)) and cagr > 0:
        return max(min(cagr * 0.8, 0.25), 0.03)
    return 0.05


def _compute_wacc(metrics: dict) -> float:
    beta = metrics.get("beta", 1.0) or 1.0
    if beta <= 0:
        beta = 1.0
    cost_of_equity = RISK_FREE_RATE + beta * (MARKET_RETURN - RISK_FREE_RATE)
    cost_of_debt   = RISK_FREE_RATE + 0.02
    tax_rate       = 0.21
    wacc = 0.70 * cost_of_equity + 0.30 * cost_of_debt * (1 - tax_rate)
    return max(min(wacc, 0.20), 0.06)
