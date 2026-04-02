"""
export.py  —  GET /api/export/{ticker}
Returns a ZIP archive of all 8 CSV export files (mirrors dashboard_export.py).
"""

import io
import csv
import json
import zipfile
import math
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from services.data_fetch import fetch_all_data
from services.data_processing import compute_derived_metrics, add_price_features
from services.dcf_model import run_dcf
from services.relative_valuation import run_relative_valuation
from services.price_prediction import run_prediction
from services.fundamental_analysis import run_fundamental_analysis

router = APIRouter()


def _safe(val):
    if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
        return ""
    if val is None:
        return ""
    return val


def _write_csv(rows: list, fieldnames: list) -> str:
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow({k: _safe(row.get(k, "")) for k in fieldnames})
    return buf.getvalue()


@router.get("/export/{ticker}")
async def export_ticker(ticker: str, forecast_years: int = 5, forecast_days: int = 30):
    ticker = ticker.upper().strip()

    raw   = fetch_all_data(ticker)
    info  = raw.get("info", {})
    if not info and raw["financials_df"].empty:
        raise HTTPException(404, f"No data for {ticker}")

    metrics           = compute_derived_metrics(raw["financials_df"], info)
    metrics["financials_df"] = raw["financials_df"]
    metrics["prices_df"]     = raw["prices_df"]
    pf                = add_price_features(raw["prices_df"]) if not raw["prices_df"].empty else None
    dcf               = run_dcf(metrics, forecast_years)
    relative          = run_relative_valuation(metrics, info.get("sector", "Default"))
    fundamental       = run_fundamental_analysis(metrics)
    prediction        = (run_prediction(pf, forecast_days) if pf is not None and not pf.empty
                         else {"error": "no data"})

    zbuf = io.BytesIO()
    with zipfile.ZipFile(zbuf, "w", zipfile.ZIP_DEFLATED) as z:

        # 1. company_overview.csv
        z.writestr("company_overview.csv", _write_csv([{
            "Ticker":           ticker,
            "Company Name":     info.get("longName", ticker),
            "Sector":           info.get("sector", ""),
            "Industry":         info.get("industry", ""),
            "Current Price":    metrics.get("current_price"),
            "Market Cap":       metrics.get("market_cap"),
            "P/E Ratio":        metrics.get("pe_ratio"),
            "P/B Ratio":        metrics.get("pb_ratio"),
            "EV/EBITDA":        metrics.get("ev_ebitda"),
            "Beta":             metrics.get("beta"),
            "Intrinsic Value":  dcf.get("intrinsic_value") if "error" not in dcf else "",
            "Margin of Safety": dcf.get("margin_of_safety") if "error" not in dcf else "",
            "Valuation Signal": dcf.get("valuation_signal") if "error" not in dcf else "",
            "Health Score":     fundamental.get("overall_score"),
            "Health Grade":     fundamental.get("grade"),
        }], ["Ticker","Company Name","Sector","Industry","Current Price","Market Cap",
             "P/E Ratio","P/B Ratio","EV/EBITDA","Beta","Intrinsic Value",
             "Margin of Safety","Valuation Signal","Health Score","Health Grade"]))

        # 2. financial_statements.csv
        fin_df = metrics.get("financials_df")
        if fin_df is not None and not fin_df.empty:
            cols = ["year","revenue","operating_income","net_income","total_assets","total_liabilities","cash_flow"]
            rows = [{"Ticker": ticker, **{c: row.get(c) for c in cols}} for row in fin_df.to_dict("records")]
            z.writestr("financial_statements.csv",
                       _write_csv(rows, ["Ticker"] + cols))

        # 3. stock_prices.csv
        prices_df = raw["prices_df"]
        if not prices_df.empty:
            cols = ["date","open_price","close_price","high_price","low_price","volume"]
            rows = [{"Ticker": ticker, **r} for r in prices_df.to_dict("records")]
            z.writestr("stock_prices.csv", _write_csv(rows, ["Ticker"] + cols))

        # 4. valuation_results.csv (DCF)
        if "error" not in dcf:
            z.writestr("valuation_results.csv", _write_csv([{
                "Ticker":           ticker,
                "WACC":             dcf.get("wacc"),
                "FCF Growth Rate":  dcf.get("fcf_growth_rate"),
                "Terminal Value":   dcf.get("terminal_value"),
                "Intrinsic Value":  dcf.get("intrinsic_value"),
                "Margin of Safety": dcf.get("margin_of_safety"),
                "Signal":           dcf.get("valuation_signal"),
            }], ["Ticker","WACC","FCF Growth Rate","Terminal Value",
                 "Intrinsic Value","Margin of Safety","Signal"]))

        # 5. relative_valuation.csv
        comp_rows = relative.get("comparison_table", [])
        if comp_rows:
            cols = ["multiple","company","sector_median","vs_peers","implied_price"]
            rows = [{"Ticker": ticker, **r} for r in comp_rows]
            z.writestr("relative_valuation.csv", _write_csv(rows, ["Ticker"] + cols))

        # 6. prediction_actuals.csv
        if "error" not in prediction:
            comp_df = prediction.get("comparison_df", [])
            if comp_df:
                cols = ["date","actual","lr_predicted","rf_predicted"]
                rows = [{"Ticker": ticker, **r} for r in comp_df]
                z.writestr("prediction_actuals.csv", _write_csv(rows, ["Ticker"] + cols))

        # 7. future_predictions.csv
        if "error" not in prediction:
            future = prediction.get("future_predictions", {})
            n = len(future.get("rf", []))
            if n:
                rows = [{"Ticker": ticker, "Day": i+1, "LR_Price": future["lr"][i], "RF_Price": future["rf"][i]}
                        for i in range(n)]
                z.writestr("future_predictions.csv",
                           _write_csv(rows, ["Ticker","Day","LR_Price","RF_Price"]))

        # 8. fundamental_analysis.csv
        m = fundamental.get("metrics", {})
        z.writestr("fundamental_analysis.csv", _write_csv([{
            "Ticker":           ticker,
            "ROE":              m.get("roe"),
            "Net Margin":       m.get("net_margin"),
            "Operating Margin": m.get("operating_margin"),
            "Current Ratio":    m.get("current_ratio"),
            "Debt to Equity":   m.get("debt_to_equity"),
            "Asset Turnover":   m.get("asset_turnover"),
            "Overall Score":    fundamental.get("overall_score"),
            "Grade":            fundamental.get("grade"),
            "Summary":          fundamental.get("summary"),
        }], ["Ticker","ROE","Net Margin","Operating Margin","Current Ratio",
             "Debt to Equity","Asset Turnover","Overall Score","Grade","Summary"]))

    zbuf.seek(0)
    return StreamingResponse(
        zbuf,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={ticker}_analysis.zip"},
    )
