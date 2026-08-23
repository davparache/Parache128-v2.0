# Volume Momentum Signals — Hourly Options Helper

A TradingView Pine Script v5 indicator (`volume_momentum_hourly_options.pine`) that
generates CALL/PUT timing signals for short-dated options ("hourly contracts")
traded manually through Robinhood, using a 1-hour chart.

## Important: this is a TradingView tool, not a Robinhood bot

Pine Script only runs inside TradingView — Robinhood has no scripting or
algo-trading API. This indicator does **not** place trades. It plots signals
and fires TradingView alerts; you read the alert and place the CALL/PUT trade
yourself in the Robinhood app.

## How signals are generated

A signal only fires when several independent conditions line up at once
(a "confluence score" out of 6), so single noisy indicators like a volume
tick or one RSI cross don't trigger a trade on their own:

1. **Trend** — fast EMA (9) vs slow EMA (21) direction
2. **Higher-timeframe trend** — daily EMA(20) direction, keeps you aligned
   with the bigger move instead of fading it
3. **Volume spike** — current bar's volume vs its 20-bar average, times a
   configurable multiplier (default 1.5x)
4. **Momentum** — RSI(14) not overbought/oversold and turning in your
   direction
5. **VWAP bias** — price above/below the session VWAP
6. **Candle strength** — a strong-bodied candle (configurable body % of
   range) or a bullish/bearish engulfing pattern

`CALL` fires when the bullish score ≥ your threshold (default 4/6) and beats
the bearish score; `PUT` is the mirror case. A cooldown (default 3 bars)
prevents re-firing every bar while conditions stay stretched.

## Setup on TradingView

1. Open TradingView → Pine Editor → paste in
   `volume_momentum_hourly_options.pine` → **Add to chart**.
2. Set the chart timeframe to **1H** on a liquid underlying (SPY, QQQ,
   large-cap names) — thin names will rarely produce clean volume spikes.
3. Right-click the indicator → **Add Alert**, or use the two built-in
   `alertcondition`s ("CALL Signal" / "PUT Signal") to get a push/SMS/webhook
   alert the moment a signal fires.
4. Tune the inputs to taste:
   - Raise `Minimum Confluence Score` toward 5-6 for fewer, higher-conviction
     signals.
   - Raise `Volume Spike Multiplier` on very liquid names where average
     volume is already high.
   - Toggle off the higher-timeframe filter if you want to trade purely
     intraday reversals.

## Caveats

- This is a **decision-support/alerting tool**, not a backtested strategy —
  Pine can't simulate options premium, theta decay, spreads, or Robinhood's
  fills, so treat signals as underlying-price timing only, not a guarantee of
  options P&L.
- Short-dated options are extremely theta- and IV-sensitive; even a
  correctly-timed underlying move can lose money if entered too close to
  expiration or into an IV crush (e.g., right after earnings).
- Always paper-trade or manually verify signals for a while before sizing up.
