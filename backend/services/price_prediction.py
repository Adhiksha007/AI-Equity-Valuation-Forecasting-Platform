"""
price_prediction.py  (ported from Original-Repo/price_prediction.py)
Predicts future stock prices using Linear Regression and Random Forest.
"""

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import StandardScaler

FEATURE_COLS = [
    "ma_20", "ma_50", "ma_200",
    "return_1d", "volatility",
    "lag_1", "lag_3", "lag_5", "lag_10",
    "volume",
]
TARGET_COL = "close_price"


def run_prediction(prices_df: pd.DataFrame, forecast_days: int = 30) -> dict:
    df = prices_df.copy()

    available_features = [c for c in FEATURE_COLS if c in df.columns]
    if len(available_features) < 4:
        return {"error": "Insufficient feature data for prediction."}

    X = df[available_features].values
    y = df[TARGET_COL].values

    if len(X) < 50:
        return {"error": "Not enough historical data (need 50+ data points)."}

    split = int(len(X) * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    scaler     = StandardScaler()
    X_train_sc = scaler.fit_transform(X_train)
    X_test_sc  = scaler.transform(X_test)

    lr_model = LinearRegression()
    lr_model.fit(X_train_sc, y_train)

    rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
    rf_model.fit(X_train_sc, y_train)

    lr_preds = lr_model.predict(X_test_sc)
    rf_preds = rf_model.predict(X_test_sc)

    lr_metrics = _compute_metrics(y_test, lr_preds)
    rf_metrics = _compute_metrics(y_test, rf_preds)

    actual_dates  = df["date"].values[split:] if "date" in df.columns else list(range(len(y_test)))
    comparison_df = pd.DataFrame({
        "date":         [str(d) for d in actual_dates],
        "actual":       y_test.tolist(),
        "lr_predicted": lr_preds.tolist(),
        "rf_predicted": rf_preds.tolist(),
    })

    future_predictions = _forecast_future(df, available_features, scaler, lr_model, rf_model, forecast_days)

    best_model    = "Random Forest" if rf_metrics["r2"] > lr_metrics["r2"] else "Linear Regression"
    current_price = float(df[TARGET_COL].iloc[-1])
    best_future   = future_predictions["rf"] if best_model == "Random Forest" else future_predictions["lr"]
    final_pred    = float(best_future[-1]) if best_future else current_price
    trend_pct     = (final_pred - current_price) / current_price * 100
    trend         = "Bullish" if final_pred > current_price else "Bearish"

    return {
        "lr_metrics":         lr_metrics,
        "rf_metrics":         rf_metrics,
        "best_model":         best_model,
        "comparison_df":      comparison_df.to_dict("records"),
        "future_predictions": future_predictions,
        "current_price":      current_price,
        "predicted_final":    final_pred,
        "trend":              trend,
        "trend_pct":          trend_pct,
        "forecast_days":      forecast_days,
        "features_used":      available_features,
    }


def _compute_metrics(y_true, y_pred) -> dict:
    mae  = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
    r2   = float(r2_score(y_true, y_pred))
    mape = float(np.mean(np.abs((y_true - y_pred) / np.maximum(np.abs(y_true), 1e-8))) * 100)
    return {"mae": mae, "rmse": rmse, "r2": r2, "mape": mape}


def _forecast_future(df, features, scaler, lr_model, rf_model, forecast_days) -> dict:
    lr_future, rf_future = [], []
    last_row = df[features].iloc[-1].values.copy().astype(float)

    for _ in range(forecast_days):
        row_scaled = scaler.transform([last_row])
        lr_price   = float(lr_model.predict(row_scaled)[0])
        rf_price   = float(rf_model.predict(row_scaled)[0])
        lr_future.append(lr_price)
        rf_future.append(rf_price)
        _update_lags(last_row, list(features), rf_price)

    return {"lr": lr_future, "rf": rf_future}


def _update_lags(row: np.ndarray, feature_names: list, new_price: float):
    for lag_name in ["lag_1", "lag_3", "lag_5", "lag_10"]:
        if lag_name in feature_names:
            row[feature_names.index(lag_name)] = new_price
