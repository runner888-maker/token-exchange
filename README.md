# Token Exchange — POC

> AI Compute Routing + Token Abstraction Layer

A unified proxy that routes LLM requests across Anthropic and OpenAI, optimizes for cost/latency/quality, and abstracts provider tokens into **credits**.

---

## Architecture

```
Client App
    ↓  POST /v1/completion { prompt, priority }
Relay API  (FastAPI)
    ↓
Routing Engine  (cost | latency | quality)
    ↓               ↓
Anthropic API    OpenAI API
    ↓               ↓
Response Aggregation  (normalize + cost calc)
    ↓
Dashboard + Logs  (React)
```

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # add API keys, or leave empty for mock mode
uvicorn app.main:app --reload
# → http://localhost:8000
# → Swagger UI at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Routing Strategies

| Priority | Behavior | Default model |
|---|---|---|
| `cost` | Lowest avg $/token | `gpt-4o-mini` ($0.15/$0.60 per 1M) |
| `latency` | Fastest rolling avg latency | `gpt-4o-mini` (fast tier) |
| `quality` | Highest quality score | `claude-3-opus-20240229` (score 10) |

## Token → Credit Conversion

```
1 credit = $0.0001
$1.00    = 10,000 credits
```

Users interact with credits — provider token details are hidden behind the abstraction.

## Savings Calculation

Baseline = always using **Claude 3.5 Sonnet** ($3.00/$15.00 per 1M).  
Savings = `baseline_cost - actual_cost` per request.

---

## API

| Method | Path | Description |
|---|---|---|
| `POST` | `/v1/completion` | Route a prompt, get response + metadata |
| `GET` | `/v1/stats` | Aggregate usage stats |
| `GET` | `/v1/requests` | Recent request log (filterable) |
| `GET` | `/v1/providers` | Model pricing + live latency data |
| `GET` | `/health` | Health check |

Full spec: [`api-spec/openapi.yaml`](./api-spec/openapi.yaml)  
Interactive: `http://localhost:8000/docs`

---

## Project Structure

```
token-exchange/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── config.py            # Settings (pydantic-settings)
│   │   ├── routing/
│   │   │   ├── engine.py        # Routing logic + rolling latency
│   │   │   └── pricing.py       # Static pricing tables
│   │   ├── providers/
│   │   │   ├── anthropic_provider.py
│   │   │   └── openai_provider.py
│   │   ├── database/
│   │   │   ├── models.py        # SQLAlchemy models
│   │   │   └── db.py            # SQLite setup
│   │   └── routers/
│   │       ├── completion.py    # POST /v1/completion
│   │       └── stats.py         # GET /v1/stats, /requests, /providers
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.tsx              # Tabbed shell
│       └── components/
│           ├── Header.tsx
│           ├── StatsCards.tsx   # 6 KPI cards
│           ├── Charts.tsx       # Provider pie + priority bar
│           ├── RequestLog.tsx   # Request table
│           ├── SystemDiagram.tsx # Interactive architecture diagram
│           ├── ApiPlayground.tsx # Live API tester
│           └── ApiSpec.tsx      # Inline API reference
└── api-spec/
    └── openapi.yaml
```

## What's NOT in this POC

- Token resale / marketplace
- Blockchain / crypto tokens
- Multi-tenant auth
- Streaming responses
- Agent economy

Those are Phase 2+ ideas.
