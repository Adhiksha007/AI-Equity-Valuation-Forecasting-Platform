"""
data_processing.py  (ported from Original-Repo/data_processing.py)
Computes derived analytical metrics from raw financial data.
"""

import pandas as pd
import numpy as np


def compute_derived_metrics(financials_df: pd.DataFrame, info: dict) -> dict:
    metrics = {}
    if financials_df.empty:
        return metrics

    df = financials_df.copy().sort_values("year")

    # Revenue CAGR
    rev = df["revenue"].dropna()
    if len(rev) >= 2:
        start, end, n = rev.iloc[0], rev.iloc[-1], len(rev) - 1
        metrics["revenue_cagr"] = ((end / start) ** (1 / n) - 1) if start > 0 else np.nan
    else:
        metrics["revenue_cagr"] = np.nan

    df["revenue_growth_yoy"] = df["revenue"].pct_change()
    metrics["revenue_growth_yoy"] = df[["year", "revenue_growth_yoy"]].dropna().to_dict("records")

    # Margins
    df["operating_margin"] = df["operating_income"] / df["revenue"]
    df["net_margin"]       = df["net_income"] / df["revenue"]
    metrics["avg_operating_margin"]    = float(df["operating_margin"].mean()) if pd.notna(df["operating_margin"].mean()) else None
    metrics["latest_operating_margin"] = float(df["operating_margin"].iloc[-1]) if pd.notna(df["operating_margin"].iloc[-1]) else None
    metrics["latest_net_margin"]       = float(df["net_margin"].iloc[-1]) if pd.notna(df["net_margin"].iloc[-1]) else None
    metrics["avg_net_margin"]          = float(df["net_margin"].mean()) if pd.notna(df["net_margin"].mean()) else None

    # FCF
    metrics["latest_fcf"] = float(df["cash_flow"].iloc[-1]) if not df["cash_flow"].isna().all() else None
    metrics["fcf_series"] = df[["year", "cash_flow"]].dropna().to_dict("records")

    # ROE
    df["equity"]   = df["total_assets"] - df["total_liabilities"]
    df["roe"]      = df["net_income"] / df["equity"].replace(0, np.nan)
    metrics["latest_roe"] = float(df["roe"].iloc[-1]) if pd.notna(df["roe"].iloc[-1]) else None

    # Debt-to-equity
    df["debt_to_equity"] = df["total_liabilities"] / df["equity"].replace(0, np.nan)
    metrics["latest_debt_to_equity"] = float(df["debt_to_equity"].iloc[-1]) if pd.notna(df["debt_to_equity"].iloc[-1]) else None

    # Asset turnover
    df["asset_turnover"] = df["revenue"] / df["total_assets"].replace(0, np.nan)
    metrics["latest_asset_turnover"] = float(df["asset_turnover"].iloc[-1]) if pd.notna(df["asset_turnover"].iloc[-1]) else None

    # From info
    metrics["current_ratio"]      = info.get("currentRatio")
    metrics["beta"]               = info.get("beta", 1.0)
    metrics["shares_outstanding"] = info.get("sharesOutstanding")
    metrics["market_cap"]         = info.get("marketCap")
    metrics["current_price"]      = info.get("currentPrice") or info.get("regularMarketPrice")
    metrics["pe_ratio"]           = info.get("trailingPE")
    metrics["pb_ratio"]           = info.get("priceToBook")
    metrics["ev_ebitda"]          = info.get("enterpriseToEbitda")
    metrics["price_to_sales"]     = info.get("priceToSalesTrailing12Months")
    metrics["ebitda"]             = info.get("ebitda")
    metrics["total_debt"]         = info.get("totalDebt")
    metrics["enterprise_value"]   = info.get("enterpriseValue")

    # Attach enriched df for downstream use
    metrics["financials_df"] = df

    return metrics


def add_price_features(prices_df: pd.DataFrame) -> pd.DataFrame:
    """Add MA, returns, volatility, lag features for ML."""
    df = prices_df.copy().sort_values("date").reset_index(drop=True)

    df["return_1d"]  = df["close_price"].pct_change()
    df["ma_20"]      = df["close_price"].rolling(20).mean()
    df["ma_50"]      = df["close_price"].rolling(50).mean()
    df["ma_200"]     = df["close_price"].rolling(200).mean()
    df["volatility"] = df["return_1d"].rolling(20).std()

    for lag in [1, 3, 5, 10]:
        df[f"lag_{lag}"] = df["close_price"].shift(lag)

    return df.dropna().reset_index(drop=True)
