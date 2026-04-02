"""
fundamental_analysis.py  (ported from Original-Repo/fundamental_analysis.py)
4-pillar financial health scoring (Profitability, Liquidity, Leverage, Efficiency).
"""

import numpy as np

THRESHOLDS = {
    "roe":              {"excellent": 0.20, "good": 0.12, "poor": 0.05},
    "net_margin":       {"excellent": 0.20, "good": 0.08, "poor": 0.02},
    "operating_margin": {"excellent": 0.20, "good": 0.10, "poor": 0.03},
    "current_ratio":    {"excellent": 2.0,  "good": 1.5,  "poor": 1.0},
    "debt_to_equity":   {"excellent": 0.5,  "good": 1.0,  "poor": 2.0},
    "asset_turnover":   {"excellent": 1.0,  "good": 0.5,  "poor": 0.2},
}


def run_fundamental_analysis(metrics: dict) -> dict:
    scores = {
        "roe":              _score_high(metrics.get("latest_roe"),              THRESHOLDS["roe"]),
        "net_margin":       _score_high(metrics.get("latest_net_margin"),       THRESHOLDS["net_margin"]),
        "operating_margin": _score_high(metrics.get("latest_operating_margin"), THRESHOLDS["operating_margin"]),
        "current_ratio":    _score_high(metrics.get("current_ratio"),           THRESHOLDS["current_ratio"]),
        "debt_to_equity":   _score_low(metrics.get("latest_debt_to_equity"),    THRESHOLDS["debt_to_equity"]),
        "asset_turnover":   _score_high(metrics.get("latest_asset_turnover"),   THRESHOLDS["asset_turnover"]),
    }

    valid         = [v for v in scores.values() if v is not None]
    overall_score = float(np.mean(valid)) if valid else 0.0
    grade         = _get_grade(overall_score)
    summary       = _generate_summary(metrics, scores, overall_score)

    dimension_scores = {
        "Profitability": float(np.mean([scores.get("roe", 0), scores.get("net_margin", 0), scores.get("operating_margin", 0)])),
        "Liquidity":     float(scores.get("current_ratio", 0)),
        "Leverage":      float(scores.get("debt_to_equity", 0)),
        "Efficiency":    float(scores.get("asset_turnover", 0)),
    }

    return {
        "raw_scores":       scores,
        "dimension_scores": dimension_scores,
        "overall_score":    overall_score,
        "grade":            grade,
        "summary":          summary,
        "metrics": {
            "roe":              metrics.get("latest_roe"),
            "net_margin":       metrics.get("latest_net_margin"),
            "operating_margin": metrics.get("latest_operating_margin"),
            "current_ratio":    metrics.get("current_ratio"),
            "debt_to_equity":   metrics.get("latest_debt_to_equity"),
            "asset_turnover":   metrics.get("latest_asset_turnover"),
            "profit_margin":    metrics.get("latest_net_margin"),
        },
    }


def _score_high(value, thresholds) -> float:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return 50.0
    if value >= thresholds["excellent"]: return 100.0
    if value >= thresholds["good"]:      return 70.0
    if value >= thresholds["poor"]:      return 40.0
    return 15.0


def _score_low(value, thresholds) -> float:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return 50.0
    if value <= thresholds["excellent"]: return 100.0
    if value <= thresholds["good"]:      return 70.0
    if value <= thresholds["poor"]:      return 40.0
    return 15.0


def _get_grade(score: float) -> str:
    if score >= 85: return "A+"
    if score >= 75: return "A"
    if score >= 65: return "B+"
    if score >= 55: return "B"
    if score >= 45: return "C"
    if score >= 35: return "D"
    return "F"


def _fmt(val, as_pct=True, decimals=1) -> str:
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return "N/A"
    if as_pct:
        return f"{val * 100:.{decimals}f}%"
    return f"{val:.{decimals}f}x"


def _generate_summary(metrics, scores, overall_score) -> str:
    parts  = []
    grade  = _get_grade(overall_score)

    if overall_score >= 75:
        opening = "The company demonstrates strong overall financial health"
    elif overall_score >= 55:
        opening = "The company shows moderate financial health with mixed signals across key dimensions"
    else:
        opening = "The company faces challenges in several areas of financial performance"
    parts.append(opening + f" (Overall Score: {overall_score:.0f}/100, Grade: {grade}).")

    roe = metrics.get("latest_roe")
    nm  = metrics.get("latest_net_margin")
    if roe is not None and not (isinstance(roe, float) and np.isnan(roe)):
        if roe > 0.15:
            parts.append(f"Profitability is a strength, with ROE of {_fmt(roe)} and net margin of {_fmt(nm)}, reflecting efficient capital deployment.")
        elif roe > 0.05:
            parts.append(f"Profitability is adequate with ROE of {_fmt(roe)}, though there is room for improvement in margin expansion.")
        else:
            parts.append(f"Profitability is under pressure with low ROE of {_fmt(roe)}. Net margin stands at {_fmt(nm)}, which warrants monitoring.")

    cr = metrics.get("current_ratio")
    if cr is not None and not (isinstance(cr, float) and np.isnan(cr)):
        if cr >= 1.5:
            parts.append(f"Liquidity appears healthy with a current ratio of {_fmt(cr, as_pct=False)}, suggesting the company can comfortably meet short-term obligations.")
        elif cr >= 1.0:
            parts.append(f"Liquidity is adequate but tight, with a current ratio of {_fmt(cr, as_pct=False)}.")
        else:
            parts.append(f"Liquidity is a concern, with a current ratio below 1.0 ({_fmt(cr, as_pct=False)}), indicating potential short-term funding pressure.")

    de = metrics.get("latest_debt_to_equity")
    if de is not None and not (isinstance(de, float) and np.isnan(de)):
        if de < 0.5:
            parts.append(f"Leverage is conservative at {_fmt(de, as_pct=False)} debt-to-equity, providing a strong buffer against financial stress.")
        elif de < 1.5:
            parts.append(f"Leverage is moderate at {_fmt(de, as_pct=False)} debt-to-equity, which is manageable but should be monitored.")
        else:
            parts.append(f"Elevated leverage of {_fmt(de, as_pct=False)} debt-to-equity may introduce financial risk.")

    if overall_score >= 70:
        parts.append("Overall, the company presents a compelling fundamental profile worth further due diligence.")
    elif overall_score >= 50:
        parts.append("Investors should weigh both the strengths and the areas of concern before making investment decisions.")
    else:
        parts.append("Significant caution is warranted. Look for signs of improvement in profitability and balance sheet health.")

    return " ".join(parts)
