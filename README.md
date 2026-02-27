# Community Health Chatbot

A full-stack AI-powered community health assistant with a RAG (Retrieval-Augmented Generation) pipeline, PDF knowledge base ingestion, semantic query clustering, and an admin analytics dashboard.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Browser (React + Vite)                         │
│                                                                         │
│   ┌───────────┐  ┌────────────────┐  ┌──────────────┐  ┌───────────┐    │
│   │LandingPage│  │   ChatPage     │  │AdminDashboard│  │ Analytics │    │
│   └───────────┘  └──────┬─────────┘  └──────┬───────┘  └─────┬─────┘    │
│                         │                   │                │          │
└─────────────────────────┼───────────────────┼────────────────┼─────────┘
                          │  HTTP / REST (axios, Vite proxy)   │
                          ▼                   ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Spring Boot 3.4.3  (port 8083)                      │
│                                                                         │
│  ┌──────────────────┐          ┌──────────────────────────────────────┐ │
│  │ PublicController │          │       AdminDashboardController       │ │
│  │  /api/chat/**    │          │                                      │ │
│  └────────┬─────────┘          │                                      │ │
│           │                    │                                      │ │
│           ▼                    └────────────────┬─────────────────────┘ │
│  ┌──────────────────┐                           │                       │
│  │   ChatService    │                           │                       │
│  └────────┬─────────┘              ┌────────────▼──────────────────┐    │
│           │                        │    AdminDashboardService      │    │
│           │                        └───────────────────────────────┘    │
│           │                                                             │
│  ┌────────▼────────────────────────────────────────────────────────┐    │
│  │                      AI Layer (LangChain4j 0.33.0)              │    │
│  │                                                                 │    │
│  │  EmbeddingModel                    ChatLanguageModel            │    │
│  │  all-MiniLM-L6-v2-q (quantized)    OllamaChatModel              │    │
│  │  384-dim vectors, CPU-only         deepseek-r1:7b               │    │
│  │  in-process, no server needed      localhost:11434              │    │
│  └────────────────────────────────┬────────────────────────────────┘    │
│                                   │                                     │
│  ┌────────────────────────────────▼────────────────────────────────┐    │
│  │                  Spring Data JPA  /  Hibernate                  │    │
│  │                  Repositories: Article · ChatSession            │    │
│  │                  ChatMessage · ClusterAnalysisResult            │    │
│  └────────────────────────────────┬────────────────────────────────┘    │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │          PostgreSQL          │
                     └──────────────────────────────┘
                                    ▲
                     ┌──────────────┴───────────────┐
                     │  Ollama  (port 11434)         │
                     │  Model: deepseek-r1:7b        │
                     │  Runs locally on CPU          │
                     └──────────────────────────────┘
```

---

## RAG Pipeline (per user message)

```
User message
     │
     ▼
 Embed with all-MiniLM-L6-v2-q  ──►  float[384]
     │
     ▼
 Cosine similarity against all kb_chunks
 (threshold ≥ 0.30 · top-3 results)
     │
     ▼
 Build grounded system prompt
 "Answer ONLY from the context below. No markdown. …"
 + retrieved chunks as context
     │
     ▼
 OllamaChatModel.generate()  ──►  deepseek-r1:7b
     │
     ▼
 Post-process: strip <think>…</think>
              strip **bold** *italic* - bullets # headings
     │
     ▼
 Persist to chat_message · return to frontend
```

---

## Tech Stack

### Backend

| Layer | Technology | Version |
|---|---|---|
| Runtime | Java | 17 |
| Framework | Spring Boot | 3.4.3 |
| Web | Spring Web (REST) | — |
| Security | Spring Security (HTTP Basic) | — |
| Persistence | Spring Data JPA + Hibernate | — |
| Database | PostgreSQL | ≥ 14 |
| JDBC Driver | postgresql (org.postgresql) | — |
| AI Framework | LangChain4j | 0.33.0 |
| Embeddings | all-MiniLM-L6-v2-q (quantized) | 0.33.0 |
| LLM Bridge | langchain4j-ollama | 0.33.0 |
| Local LLM Server | Ollama | latest |
| LLM Model | deepseek-r1:7b | — |
| Boilerplate reduction | Lombok | — |
| Env config | dotenv-java | 3.0.0 |
| Build tool | Maven | 3.x |
| Scheduling | Spring `@Scheduled` | — |

### PDF Extraction (Python subprocess)

| Library | Purpose |
|---|---|
| Python | 3.10 + |
| pypdf | Primary PDF text extraction (`extraction_mode="layout"`) |
| pdfminer.six | Fallback extractor for complex/scanned layouts |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18.2 | UI framework |
| Vite | 5.0 | Dev server + bundler |
| Tailwind CSS | 3.3 | Utility-first styling |
| PostCSS + Autoprefixer | — | CSS processing |
| axios | 1.6 | HTTP client |
| recharts | latest | Line / Area charts (Analytics tab) |
| lucide-react | 0.300 | Icons |
| framer-motion | 11.0 | Animations |
| react-router-dom | 6.20 | Client-side routing |
| clsx + tailwind-merge | — | Conditional class utilities |

---

## Features

### Public (unauthenticated)
- **Landing page** — project overview and entry point
- **Chat interface** — conversational health assistant powered by RAG + deepseek-r1:7b

### Admin Dashboard (HTTP Basic Auth)
| Tab | Description |
|---|---|
| **Dashboard** | Total conversations, active today, helpfulness score, top topics |
| **Knowledge Base** | Upload PDFs (auto-chunked + embedded), view/delete by document, manual article CRUD |
| **Chat Logs** | Browse all chat sessions and transcripts |
| **User Insights** | Semantic query clusters (auto-refreshed every 30 min via cron), stored in DB for instant reads |
| **Analytics** | Weekly / monthly / yearly query volume charts (area line graph), rule-based engagement insight |

---

## Project Structure

```
demo/
├── demo/                          # Spring Boot backend
│   └── src/main/java/.../
│       ├── HealthInfoApplication.java
│       ├── config/
│       │   ├── AIConfig.java       # EmbeddingModel + OllamaChatModel beans
│       │   ├── DataLoader.java
│       │   └── SecurityConfig.java # HTTP Basic auth
│       ├── controller/
│       │   ├── PublicController.java
│       │   └── AdminDashboardController.java
│       ├── model/
│       │   ├── Article.java        # kb_chunks table
│       │   ├── ChatMessage.java
│       │   ├── ChatSession.java
│       │   └── ClusterAnalysisResult.java
│       ├── repository/
│       │   ├── ArticleRepository.java
│       │   ├── ChatMessageRepository.java
│       │   ├── ChatSessionRepository.java
│       │   └── ClusterAnalysisResultRepository.java
│       └── service/
│           ├── AdminDashboardService.java  # PDF pipeline, clustering, analytics
│           └── ChatService.java            # RAG pipeline
│   └── src/main/resources/
│       └── application.properties
├── frontend/                      # React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── ChatPage.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.cjs
├── extract_pdf.py                 # Python PDF extractor (called as subprocess)
└── .env                           # Environment variables (not committed)
```

---

## Getting Started

### Prerequisites

- Java 17+
- Maven 3.x
- Node.js 18+
- PostgreSQL 14+
- Python 3.10+ with `pypdf` and `pdfminer.six`
- [Ollama](https://ollama.com) installed and running

### 1. Database

```sql
CREATE DATABASE health_chatbot;
```

Hibernate auto-creates all tables on first run (`ddl-auto=update`).

### 2. Ollama — pull the model

```bash
ollama pull deepseek-r1:7b
ollama serve          # starts on http://localhost:11434
```

### 3. Python dependencies

```bash
pip install pypdf pdfminer.six
```

### 4. Environment variables

Create a `.env` file in the project root:

```env
DB_URL=jdbc:postgresql://localhost:5432/health_chatbot
DB_USER=your_db_user
DB_PASSWORD=your_db_password
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-r1:7b
ADMIN_USERNAME=admin
ADMIN_PASSWORD=yourpassword
PORT=8083
```

### 5. Run the backend

```bash
cd demo
./mvnw spring-boot:run
```

### 6. Run the frontend

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

Vite proxies `/api/**` to `http://localhost:8083`.

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **all-MiniLM-L6-v2-q (quantized)** | CPU-only, runs in-process, no GPU required, 384-dim dense vectors |
| **deepseek-r1:7b via Ollama** | Lightweight enough to run on CPU without a GPU; free and local |
| **Paragraph-based chunking** | Avoids word fragments from character-level overlap; `maxChars=800`, `MIN_CHUNK=60` |
| **Cosine similarity threshold 0.30** | Balances recall vs. hallucination — queries with no relevant chunk fall back to a generic response |
| **Cluster analysis stored in DB** | Cron runs every 30 min in background; admin reads are instant (no LLM call on demand) |
| **Single LLM call for all cluster names** | Reduces N serial LLM calls to one batched prompt, parsed by line |
| **`embedAll()` for clustering** | One batched embedding pass instead of N individual calls |
| **Python subprocess for PDF** | `pypdf` with `extraction_mode="layout"` + `pdfminer.six` fallback handles complex layouts without a Java PDF library dependency |
