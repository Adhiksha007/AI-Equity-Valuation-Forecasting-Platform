import Plot from 'react-plotly.js'
import { AlertCircle } from 'lucide-react'

const LAYOUT_BASE = {
  template: 'plotly_dark',
  paper_bgcolor: 'transparent',
  plot_bgcolor:  'transparent',
  font: { family: 'IBM Plex Mono, monospace', color: '#7a8799', size: 11 },
  margin: { l: 50, r: 20, t: 40, b: 40 },
  legend: { orientation: 'h', yanchor: 'bottom', y: 1.02, x: 0 },
}

function MetricTable({ title, metrics }) {
  return (
    <div className="card">
      <p className="section-title" style={{ marginTop: 0 }}>{title}</p>
      <table className="data-table">
        <thead><tr><th>Metric</th><th>Value</th></tr></thead>
        <tbody>
          {[
            ['MAE',  `$${Number(metrics.mae).toFixed(2)}`],
            ['RMSE', `$${Number(metrics.rmse).toFixed(2)}`],
            ['R²',   Number(metrics.r2).toFixed(4)],
            ['MAPE', `${Number(metrics.mape).toFixed(2)}%`],
          ].map(([m, v]) => (
            <tr key={m}><td>{m}</td><td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{v}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PredictionTab({ prediction, forecastDays }) {
  if (!prediction || prediction.error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
        <AlertCircle size={16} /> Prediction unavailable: {prediction?.error ?? 'Unknown error'}
      </div>
    )
  }

  const { lr_metrics, rf_metrics, best_model, comparison_df, future_predictions,
          current_price, predicted_final, trend, trend_pct } = prediction

  const trendColor = trend === 'Bullish' ? 'var(--green)' : 'var(--red)'

  return (
    <div className="tab-content">
      <h3 style={{ marginBottom: 16 }}>Stock Price Prediction</h3>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Best Model',                  val: best_model },
          { label: 'Current Price',               val: `$${Number(current_price).toFixed(2)}` },
          { label: `Predicted (${forecastDays}d)`, val: `$${Number(predicted_final).toFixed(2)}`, delta: `${trend_pct > 0 ? '+' : ''}${Number(trend_pct).toFixed(2)}%`, deltaType: trend_pct >= 0 ? 'positive' : 'negative' },
          { label: 'Trend',                       val: trend, color: trendColor },
        ].map(({ label, val, delta, deltaType, color }) => (
          <div key={label} className="card" style={{ textAlign: 'center' }}>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value" style={{ color: color ?? 'var(--text-primary)', fontSize: '1rem' }}>{val}</div>
            {delta && <div className={`kpi-delta ${deltaType}`}>{delta}</div>}
          </div>
        ))}
      </div>

      {/* Accuracy tables */}
      <div className="col-2" style={{ marginBottom: 20 }}>
        <MetricTable title="Linear Regression" metrics={lr_metrics} />
        <MetricTable title="Random Forest"      metrics={rf_metrics} />
      </div>

      {/* Actual vs Predicted */}
      {comparison_df?.length > 0 && (
        <>
          <p className="section-title">Actual vs Predicted (Test Set)</p>
          <Plot
            data={[
              { x: comparison_df.map(r => r.date), y: comparison_df.map(r => r.actual),       name: 'Actual',           type: 'scatter', mode: 'lines', line: { color: '#e8edf3', width: 2 } },
              { x: comparison_df.map(r => r.date), y: comparison_df.map(r => r.lr_predicted), name: 'Linear Regression',type: 'scatter', mode: 'lines', line: { color: '#f59e0b', width: 1.5, dash: 'dot' } },
              { x: comparison_df.map(r => r.date), y: comparison_df.map(r => r.rf_predicted), name: 'Random Forest',    type: 'scatter', mode: 'lines', line: { color: '#22c55e', width: 1.5, dash: 'dash' } },
            ]}
            layout={{ ...LAYOUT_BASE, height: 360, yaxis: { title: 'Price (USD)', gridcolor: '#1e1e2e' }, xaxis: { gridcolor: '#1e1e2e' } }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </>
      )}

      {/* Future forecast */}
      {future_predictions && (
        <>
          <p className="section-title" style={{ marginTop: 24 }}>{forecastDays}-Day Future Forecast</p>
          <Plot
            data={[
              {
                x: Array.from({ length: future_predictions.lr?.length ?? 0 }, (_, i) => i + 1),
                y: future_predictions.lr ?? [],
                name: 'Linear Regression', type: 'scatter', mode: 'lines',
                line: { color: '#f59e0b', width: 2 },
              },
              {
                x: Array.from({ length: future_predictions.rf?.length ?? 0 }, (_, i) => i + 1),
                y: future_predictions.rf ?? [],
                name: 'Random Forest', type: 'scatter', mode: 'lines',
                line: { color: '#22c55e', width: 2 },
              },
            ]}
            layout={{
              ...LAYOUT_BASE, height: 320,
              xaxis: { title: 'Days Ahead', gridcolor: '#1e1e2e' },
              yaxis: { title: 'Predicted Price (USD)', gridcolor: '#1e1e2e' },
              shapes: [{
                type: 'line', x0: 0, x1: 1, xref: 'paper',
                y0: current_price, y1: current_price,
                line: { color: '#7a8799', dash: 'dash', width: 1 },
              }],
              annotations: [{
                x: 0.01, y: current_price, xref: 'paper', yref: 'y',
                text: 'Current Price', font: { color: '#7a8799', size: 10 },
                showarrow: false, xanchor: 'left',
              }],
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </>
      )}
    </div>
  )
}
