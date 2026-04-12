# Observability — What To Watch

## PostHog dashboards

1. **Activation funnel** — signup → onboarding_completed → first_message_sent → mentor_turn (turn_n >= 5 within 48h)
   - Red flag: < 35% activation rate

2. **Retention cohort** — D2, D7, D14, D30 return rates by signup week
   - Red flag: D7 < 10%

3. **Wedge validation** — `intro_request_clicked` / `mentor_turn` ratio
   - If > 3x by week 4, consider pivoting wedge toward investor intros

4. **Safety** — `mentor_turn_canned` breakdown by intent
   - Monitor for `crisis` events; respond directly to any

5. **Token cost** — sum(`output_tokens`) per day × $15/1M (Sonnet)
   - Red flag: single-founder daily cost > $2

## Sentry

- Alert on any error with rate-of-rise > 5× baseline in 15 min
- Monitor `chat_stream` error rate — should stay < 1% per day

## Manual dashboard setup (PostHog)

Create these insights in PostHog:
- Activation funnel: Funnel → events [signup, onboarding_completed, first_message_sent, mentor_turn ≥ 5]
- Retention: Retention → target event `first_message_sent`, returning event `mentor_turn`
- Wedge: Trends → events `intro_request_clicked` and `mentor_turn`, math → Total count
- Safety: Trends → event `mentor_turn_canned` breakdown by property `intent`
- Cost: Trends → event `mentor_turn` sum of property `output_tokens` × conversion factor
