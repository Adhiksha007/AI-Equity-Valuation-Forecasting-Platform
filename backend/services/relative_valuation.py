"""
relative_valuation.py  (ported from Original-Repo/relative_valuation.py)
Peer comparison using sector benchmark multiples.
"""

import numpy as np
import pandas as pd


SECTOR_BENCHMARKS = {
    "Technology":             {"pe": 28.0, "ev_ebitda": 20.0, "pb": 7.0,  "ps": 6.0},
    "Healthcare":             {"pe": 22.0, "ev_ebitda": 14.0, "pb": 4.5,  "ps": 3.5},
    "Consumer Cyclical":      {"pe": 24.0, "ev_ebitda": 12.0, "pb": 5.0,  "ps": 2.0},
    "Consumer Defensive":     {"pe": 20.0, "ev_ebitda": 13.0, "pb": 5.0,  "ps": 1.8},
    "Financials":             {"pe": 14.0, "ev_ebitda": 11.0, "pb": 1.5,  "ps": 2.5},
    "Energy":                 {"pe": 12.0, "ev_ebitda": 7.0,  "pb": 1.8,  "ps": 1.2},
    "Industrials":            {"pe": 20.0, "ev_ebitda": 13.0, "pb": 4.0,  "ps": 2.0},
    "Communication Services": {"pe": 18.0, "ev_ebitda": 11.0, "pb": 3.0,  "ps": 2.5},
    "Real Estate":            {"pe": 35.0, "ev_ebitda": 20.0, "pb": 2.0,  "ps": 5.0},
    "Utilities":              {"pe": 16.0, "ev_ebitda": 10.0, "pb": 1.5,  "ps": 2.0},
    "Basic Materials":        {"pe": 15.0, "ev_ebitda": 9.0,  "pb": 2.0,  "ps": 1.5},
    "Default":                {"pe": 20.0, "ev_ebitda": 12.0, "pb": 3.0,  "ps": 2.5},
}


def run_relative_valuation(metrics: dict, sector: str = "Default") -> dict:
    company_multiples = _extract_multiples(metrics)
    peer_medians      = SECTOR_BENCHMARKS.get(sector, SECTOR_BENCHMARKS["Default"])
    implied_prices    = _compute_implied_prices(metrics, peer_medians)
    comparison_rows   = _build_comparison_rows(company_multiples, peer_medians, implied_prices)
    signals           = _generate_signals(company_multiples, peer_medians)

    return {
        "company_multiples": company_multiples,
        "peer_medians":      peer_medians,
        "implied_prices":    implied_prices,
        "comparison_table":  comparison_rows,
        "signals":           signals,
        "sector_used":       sector if sector in SECTOR_BENCHMARKS else "Default",
    }


def _extract_multiples(metrics: dict) -> dict:
    return {
        "pe":       metrics.get("pe_ratio"),
        "ev_ebitda":metrics.get("ev_ebitda"),
        "pb":       metrics.get("pb_ratio"),
        "ps":       metrics.get("price_to_sales"),
    }


def _compute_implied_prices(metrics: dict, peer_medians: dict) -> dict:
    current_price = metrics.get("current_price")
    implied = {}

    # P/E implied
    fin_df  = metrics.get("financials_df")
    shares  = metrics.get("shares_outstanding")
    if fin_df is not None and not fin_df.empty and shares and shares > 0:
        ni  = fin_df["net_income"].dropna()
        eps = float(ni.iloc[-1]) / shares if len(ni) > 0 else None
        if eps and eps > 0:
            implied["pe_implied"] = peer_medians["pe"] * eps
        else:
            implied["pe_implied"] = None
    else:
        implied["pe_implied"] = None

    # EV/EBITDA implied
    ebitda     = metrics.get("ebitda")
    total_debt = metrics.get("total_debt") or 0
    if ebitda and ebitda > 0 and shares and shares > 0:
        implied_ev = ebitda * peer_medians["ev_ebitda"]
        implied["ev_ebitda_implied"] = max((implied_ev - total_debt) / shares, 0)
    else:
        implied["ev_ebitda_implied"] = None

    # P/B implied
    pb_actual = metrics.get("pb_ratio")
    if pb_actual and pb_actual > 0 and current_price:
        book_per_share = current_price / pb_actual
        implied["pb_implied"] = peer_medians["pb"] * book_per_share
    else:
        implied["pb_implied"] = None

    # P/S implied
    ps_actual = metrics.get("price_to_sales")
    if ps_actual and ps_actual > 0 and current_price:
        sales_per_share = current_price / ps_actual
        implied["ps_implied"] = peer_medians["ps"] * sales_per_share
    else:
        implied["ps_implied"] = None

    return implied


def _build_comparison_rows(company_multiples, peer_medians, implied_prices) -> list:
    labels = {
        "pe":       ("P/E Ratio",  "pe_implied"),
        "ev_ebitda":("EV/EBITDA",  "ev_ebitda_implied"),
        "pb":       ("P/B Ratio",  "pb_implied"),
        "ps":       ("P/S Ratio",  "ps_implied"),
    }
    rows = []
    for key, (label, imp_key) in labels.items():
        cval = company_multiples.get(key)
        pval = peer_medians.get(key)
        ival = implied_prices.get(imp_key)

        if cval is not None and pval is not None:
            pct = (cval / pval - 1) * 100
            vs_peer = f"+{pct:.1f}%" if pct >= 0 else f"{pct:.1f}%"
        else:
            vs_peer = "N/A"

        rows.append({
            "multiple":      label,
            "company":       round(cval, 2) if cval is not None else None,
            "sector_median": round(pval, 2) if pval is not None else None,
            "vs_peers":      vs_peer,
            "implied_price": round(ival, 2) if ival is not None else None,
        })
    return rows


def _generate_signals(company_multiples, peer_medians) -> list:
    signals = []
    for key in ["pe", "ev_ebitda", "pb", "ps"]:
        comp = company_multiples.get(key)
        peer = peer_medians.get(key)
        if comp is not None and peer is not None:
            ratio = comp / peer
            label = key.upper()
            if ratio > 1.3:
                signals.append({"metric": label, "type": "overvalued",  "ratio": round(ratio, 2), "text": f"Trading at a premium ({ratio:.1f}x sector median)"})
            elif ratio < 0.7:
                signals.append({"metric": label, "type": "undervalued", "ratio": round(ratio, 2), "text": f"Trading at a discount ({ratio:.1f}x sector median)"})
            else:
                signals.append({"metric": label, "type": "neutral",     "ratio": round(ratio, 2), "text": f"In line with sector ({ratio:.1f}x sector median)"})
    return signals
