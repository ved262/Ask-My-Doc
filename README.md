# AskMyDoc 🤖📄

> Upload any PDF and chat with it using AI.

AskMyDoc is a full-stack AI-powered application that lets users upload PDF documents and interact with them through a conversational chat interface powered by OpenAI GPT-4o-mini.

**Live Demo:** [ask-my-doc-azure.vercel.app](https://ask-my-doc-azure.vercel.app/)

---

## Features

- 📤 **Drag & drop PDF upload** — supports files up to 10MB
- 🤖 **AI-powered Q&A** — ask any question about your document
- 💬 **Multi-turn conversations** — context-aware responses using a sliding window of last 6 messages
- 📋 **Document sidebar** — manage and switch between multiple uploaded documents
- ⚡ **Optimistic UI** — messages appear instantly before server confirmation
- 🔄 **Collapsible sidebar** — more screen space when you need it

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | HTTP server and REST API |
| TypeScript | Type safety across the codebase |
| MongoDB Atlas + Mongoose | Document and chat history storage |
| OpenAI GPT-3.5-turbo | AI question answering |
| Multer | PDF file handling (memory storage) |
| pdf-parse | Text extraction from PDF buffers |

### Frontend
| Technology | Purpose |
|---|---|
| Angular 22 (Standalone) | SPA framework |
| Angular Material | UI component library |
| TypeScript | Type-safe API contracts |
| SCSS | Component styling |

### Infrastructure
| Service | Purpose |
|---|---|
| Render | Backend hosting |
| Vercel | Frontend hosting |
| MongoDB Atlas | Cloud database |

---

## Architecture

```
┌─────────────────┐         ┌──────────────────────┐         ┌─────────────┐
│   Angular 22    │ ──────► │  Express + TypeScript │ ──────► │ MongoDB     │
│   (Vercel)      │         │  (Render)             │         │ Atlas       │
└─────────────────┘         └──────────────────────┘         └─────────────┘
                                       │
                                       ▼
                             ┌──────────────────┐
                             │  OpenAI API      │
                             │  GPT-3.5-turbo   │
                             └──────────────────┘
```

**PDF Flow:**
```
Upload PDF → Multer (memory buffer) → pdf-parse (text extraction) 
→ MongoDB (store text + metadata) → OpenAI (Q&A with context)
```

---

## Project Structure

```
askmydoc/
├── askmydoc-backend/
│   ├── src/
│   │   ├── server.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── models/
│   │   │   └── Document.ts
│   │   ├── controllers/
│   │   │   ├── document.controller.ts
│   │   │   └── chat.controller.ts
│   │   └── routes/
│   │       ├── documents.route.ts
│   │       └── chat.route.ts
│   ├── package.json
│   └── tsconfig.json
│
└── askmydoc-frontend/
    └── src/
        └── app/
            ├── core/
            │   ├── models/
            │   │   └── document.model.ts
            │   └── services/
            │       └── document.service.ts
            ├── features/
            │   ├── upload/
            │   │   └── upload.component.ts/html/scss
            │   └── chat/
            │       └── chat.component.ts/html/scss
            ├── app.component.ts
            ├── app.config.ts
            └── app.routes.ts
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents/upload` | Upload PDF, extract text, save to MongoDB |
| `GET` | `/api/documents` | List all uploaded documents |
| `GET` | `/api/documents/:id` | Get one document with full chat history |
| `POST` | `/api/chat/:documentId` | Ask a question, get AI answer, persist to history |
| `GET` | `/health` | Server health check |

---

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- OpenAI API key

### Backend Setup

```bash
cd askmydoc-backend
npm install
cp .env.example .env
# Fill in your MONGODB_URI and OPENAI_API_KEY in .env
npm run dev
```

Backend runs at `http://localhost:3000`

### Frontend Setup

```bash
cd askmydoc-frontend
npm install
npm start
```

Frontend runs at `http://localhost:4200`

### Environment Variables

**Backend `.env`:**
```
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=development
```

---


## Limitations (v1)

- Text-based PDFs only — scanned PDFs are not supported
- No user authentication — all documents are publicly accessible
- PDF size limit of 10MB
- No streaming responses — full answer returned at once

---

## Roadmap (v2)

- [ ] RAG pipeline with LangChain.js + Pinecone vector DB
- [ ] Streaming responses via Server-Sent Events
- [ ] JWT authentication and user accounts
- [ ] Multi-document cross-search
- [ ] CI/CD with GitHub Actions
- [ ] Deployment on AWS

---
