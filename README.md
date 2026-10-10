# Synapse RAG

Enterprise Retrieval-Augmented Generation (RAG) platform for indexing internal knowledge assets and deploying grounded conversational assistants.

Built with Next.js 16 (App Router), React 19, TypeScript 5, PostgreSQL (`pgvector`), Prisma 7, and Vercel AI SDK.

---

## Architecture

### System Topology

```mermaid
flowchart TD
    subgraph ClientLayer [Client & Embedding Layer]
        A1[Web Dashboard - Next.js]
        A2[Dedicated Bot Page - /bot/:id]
        A3[Standalone Embed Widget - widget.js]
    end

    subgraph ApiBoundary [API & Application Layer]
        B1[Next.js App Router API Routes]
        B2[Authentication & RBAC - NextAuth.js v5]
        B3[SSRF-Protected Scraper & File Parsers]
    end

    subgraph RagCore [RAG & Intelligence Core]
        C1[Boundary-Aware Text Chunker]
        C2[Embedding Service - 1536-dim Vectors]
        C3[pgvector Cosine Distance Search]
        C4[Token Streamer & Source Attribution]
    end

    subgraph DataLayer [Persistence Layer]
        D1[(PostgreSQL 16 + pgvector)]
        D2[Prisma 7 ORM with pg Pool Adapter]
    end

    A1 --> B1
    A2 --> B1
    A3 --> B1
    B1 --> B2
    B1 --> B3
    B3 --> C1
    C1 --> C2
    C2 --> D1
    B1 --> C3
    C3 --> D1
    C3 --> C4
    C4 --> B1
    B1 --> D2
    D2 --> D1
```

### Ingestion & Query Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Client as User / Host Application
    participant API as Next.js API Routes
    participant Parser as Ingestion Pipeline
    participant Chunker as Boundary Chunker
    participant DB as PostgreSQL (pgvector)
    participant LLM as Aval AI / OpenAI Gateway

    Note over Client,DB: Phase 1: Ingestion & Vector Indexing
    Client->>API: Upload File (PDF/DOCX/TXT/MD) or Scrape URL
    API->>Parser: Extract plain text (unpdf / mammoth / cheerio)
    Parser->>Chunker: Split into overlapping windows (1000 chars, 200 overlap)
    Chunker->>API: Structured text chunks
    API->>DB: Store chunks & generate 1536-dim embeddings
    API-->>Client: Document indexed (status: READY)

    Note over Client,LLM: Phase 2: Vector Search & Grounded Streaming
    Client->>API: Query via POST /api/chat
    API->>API: Generate 1536-dim query embedding
    API->>DB: Cosine similarity search (<=> operator)
    DB-->>API: Top-K context chunks + source metadata
    API->>LLM: Stream prompt (grounded context + persona rules)
    LLM-->>API: Token stream with [Doc X] citations
    API-->>Client: Streamed text + X-Sources citation headers
```

---

## Core Capabilities

### Ingestion Engine & Document Parsing
- **PDF Extraction**: In-memory binary buffer extraction via `unpdf` without external binary dependencies.
- **DOCX Extraction**: Structural document parsing via `mammoth`.
- **Plain Text & Markdown**: UTF-8 validated text ingestion.
- **Web Scraping**: URL fetching via `cheerio` with automatic DOM sanitization (strips `<nav>`, `<script>`, `<style>`, `<footer>`).
- **SSRF Defense**: Strict pre-fetch validation blocking RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopbacks (`127.0.0.1`, `localhost`, `[::1]`), and cloud metadata endpoints (`169.254.169.254`).

### Vector Storage & Similarity Retrieval
- **Boundary-Aware Sliding Window**: Slices text into 1000-character segments with 200-character overlaps, targeting paragraph breaks (`\n\n`), sentence terminators (`.`, `!`, `?`, `؟`), and whitespace before hard boundaries.
- **PostgreSQL `pgvector`**: Performs cosine distance vector queries directly via SQL:
  ```sql
  SELECT c.id, c."documentId", c.content, (1 - (c.embedding <=> $1::vector)) AS similarity
  FROM "DocumentChunk" c
  JOIN "Document" d ON c."documentId" = d.id
  WHERE d."kbId" = $2 AND d.status = 'READY'
  ORDER BY c.embedding <=> $1::vector ASC
  LIMIT $3;
  ```
- **HNSW Indexing**: For high-scale production vector indexing, create an HNSW index on the chunk embedding table:
  ```sql
  CREATE INDEX IF NOT EXISTS "idx_document_chunk_embedding_hnsw" 
  ON "DocumentChunk" 
  USING hnsw (embedding vector_cosine_ops) 
  WITH (m = 16, ef_construction = 64);
  ```
- **Multi-Document Fair Representation**: Enforces document-level coverage so large single files do not monopolize context windows.
- **Citation Badges**: Returned answers include verified citations (`[Doc 1]`, `[Doc 2]`) linked to source metadata.

### Internationalization & Dynamic RTL Engine
- Automatic Unicode inspection identifies Persian, Arabic, and Hebrew character blocks.
- Switches input inputs, chat bubbles, and font stacks to `dir="rtl"` with Persian typography (`Vazirmatn`) in real time.

### Embeddable Web Widget (`public/widget.js`)
- Zero-dependency client launcher script for external website integration.
- Injects a responsive iframe modal linked to `/bot/:kbId?widget=true`.
- Supports configurable accent colors and smooth open/close transitions.

---

## Tech Stack

| Layer | Component | Notes |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.3 (App Router, Turbopack) | Server actions and route handlers |
| **Frontend** | React 19.2, TypeScript 5, Tailwind CSS v4 | Framer Motion animations, Lucide icons |
| **Database** | PostgreSQL 16+ with `pgvector` extension | Vector similarity search (`<=>`) |
| **ORM** | Prisma 7.10 with `@prisma/adapter-pg` | Connection pooling and typed queries |
| **AI / RAG** | Vercel AI SDK (`ai` v7, `@ai-sdk/openai`) | Streaming token delivery |
| **Auth** | NextAuth.js v5 (Auth.js) | JWT session strategy and bcrypt hashing |
| **Parsers** | `unpdf`, `mammoth`, `cheerio` | In-memory document extraction |
| **Testing** | Node.js Test Runner with `tsx` | 24 automated unit and integration tests |

---

## Data Model

```mermaid
erDiagram
    User ||--o{ KnowledgeBase : owns
    KnowledgeBase ||--o{ Document : contains
    Document ||--o{ DocumentChunk : splits_into

    User {
        string id PK
        string email UK
        string name
        string password
        enum role "USER | ADMIN | DEMO"
        boolean isDemo
        datetime createdAt
    }

    KnowledgeBase {
        string id PK
        string userId FK
        string name
        string description
        string prompt
        string colorCode
        boolean isPublic
        datetime createdAt
    }

    Document {
        string id PK
        string kbId FK
        string name
        enum type "PDF | DOCX | TXT | MD | URL"
        enum status "PROCESSING | READY | FAILED"
        string errorMessage
        int fileSize
        datetime createdAt
    }

    DocumentChunk {
        string id PK
        string documentId FK
        text content
        vector embedding "vector(1536)"
        int tokenCount
        int chunkIndex
        datetime createdAt
    }
```

---

## API Reference

### Authentication

#### `POST /api/auth/register`
Creates a standard user account.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "securepassword123"
  }
  ```
- **Responses**:
  - `201 Created`: User created successfully.
  - `400 Bad Request`: Validation failure (invalid email format or password < 6 chars).
  - `409 Conflict`: Email address already registered.

---

### Knowledge Bases

#### `GET /api/kb`
Retrieves all knowledge bases owned by the authenticated session user.
- **Authentication**: Required (JWT Session)
- **Response**: `200 OK`
  ```json
  [
    {
      "id": "cm7...",
      "name": "Customer Support Docs",
      "description": "Internal customer support knowledge base",
      "colorCode": "#06b6d4",
      "isPublic": true,
      "createdAt": "2026-03-01T12:00:00.000Z",
      "_count": { "documents": 4 }
    }
  ]
  ```

#### `POST /api/kb`
Creates a new knowledge base.
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "name": "DevOps Runbooks",
    "description": "Incident response protocols",
    "prompt": "You are an incident response assistant. Respond with concise operational steps.",
    "colorCode": "#8b5cf6",
    "isPublic": false
  }
  ```
- **Response**: `201 Created`

#### `GET /api/kb/:id`
Retrieves metadata and documents for a specific knowledge base.
- **Access**: Owner or public knowledge base.
- **Response**: `200 OK` (returns knowledge base object with list of documents).

#### `PATCH /api/kb/:id`
Updates knowledge base settings or persona prompt.
- **Authentication**: Owner only
- **Request Body**: Partial knowledge base schema (`name`, `description`, `prompt`, `colorCode`, `isPublic`).
- **Response**: `200 OK`

#### `DELETE /api/kb/:id`
Deletes a knowledge base and cascades deletion to all related documents and vector chunks.
- **Authentication**: Owner only
- **Response**: `200 OK`

---

### Document Ingestion

#### `POST /api/kb/:id/documents/upload`
Uploads and indexes one or more files.
- **Authentication**: Owner only
- **Content-Type**: `multipart/form-data`
- **Fields**: `files` (array of PDF, DOCX, TXT, or MD files, max 10MB per file).
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "count": 2,
    "documents": [
      { "id": "doc_1", "name": "sla.pdf", "status": "READY", "chunkCount": 8 }
    ]
  }
  ```

#### `POST /api/kb/:id/documents/scrape`
Scrapes and indexes a public web page.
- **Authentication**: Owner only
- **Request Body**:
  ```json
  {
    "url": "https://docs.example.com/api"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "document": { "id": "doc_2", "name": "docs.example.com/api", "status": "READY" }
  }
  ```
- **Error Codes**:
  - `400 Bad Request`: SSRF check failed (attempted loopback, RFC 1918, or cloud metadata access).

#### `GET /api/kb/:id/documents/:docId/chunks`
Returns all indexed text chunks and token metrics for a document.
- **Authentication**: Owner or public access.
- **Response**: `200 OK`

#### `DELETE /api/kb/:id/documents/:docId`
Deletes a document and purges its vector embeddings.
- **Authentication**: Owner only
- **Response**: `200 OK`

---

### Chat & Vector Retrieval

#### `POST /api/chat`
Submits a query, retrieves top similarity chunks via pgvector, and streams the response.
- **Access**: Public if knowledge base `isPublic = true`, otherwise owner only.
- **Request Body**:
  ```json
  {
    "kbId": "cm7...",
    "messages": [
      { "role": "user", "content": "What is the refund policy?" }
    ]
  }
  ```
- **Response**: Streaming token text (`text/plain; charset=utf-8`)
- **Response Headers**:
  - `X-Sources`: Base64-encoded JSON array of retrieved sources:
    ```json
    [
      { "documentName": "terms.pdf", "chunkIndex": 2, "similarity": 0.89 }
    ]
    ```

---

## Environment Configuration

Copy `.env.example` to create `.env`:

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string (`postgresql://user:pass@host:5432/dbname?schema=public`) |
| `AUTH_SECRET` | Yes | - | Random 32+ character string for JWT session signing |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` | Canonical application base URL |
| `AVAL_AI_API_KEY` | Optional | `""` | API key for Aval AI or OpenAI-compatible endpoint |
| `AVAL_AI_BASE_URL` | Optional | `https://api.avalai.ir/v1` | Base URL for LLM and embedding API endpoints |
| `AVAL_AI_MODEL` | Optional | `gpt-4o-mini` | Chat model identifier |
| `AVAL_AI_EMBEDDING_MODEL` | Optional | `text-embedding-3-small` | 1536-dimensional vector embedding model |

*Fallback Engine*: When `AVAL_AI_API_KEY` is not provided, the platform automatically activates its local grounded fallback engine, generating deterministic 1536-dimensional embeddings and serving verified document extractions without crashing.

---

## Local Development Setup

### 1. Prerequisites
- Node.js >= 20.x
- PostgreSQL 16+ with `pgvector` extension (or Docker)
- npm >= 10.x

### 2. Start PostgreSQL via Docker Compose
```bash
docker compose up -d postgres
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Push Database Schema & Generate Prisma Client
```bash
npx prisma db push
npx prisma generate
```

### 5. Seed Database
Creates demo account (`demo@synapserag.ai`), sample knowledge base, and vector records:
```bash
npm run db:seed
```

### 6. Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Quality Gates & Automated Tests

Run the test suite and static analysis checks:

```bash
# Execute unit and integration tests (24 tests across 10 test suites)
npm test

# Run ESLint (zero errors, zero warnings)
npm run lint

# TypeScript static type check
npx tsc --noEmit

# Production build verification
npm run build
```

### Test Suite Structure
- `tests/chunker.test.ts`: Slicing boundaries, character overlap, and sentence break detection.
- `tests/rtl.test.ts`: Unicode direction inspection for English, Persian, and Arabic text.
- `tests/parsers.test.ts`: SSRF defense verification (IPv4/IPv6 loopbacks, cloud metadata, RFC 1918) and UTF-8 decoding.
- `tests/validations.test.ts`: Zod schema validation for knowledge base inputs and user registration.

---

## Client Widget Integration

Embed the assistant into any external web application by including `public/widget.js`:

```html
<script 
  src="https://your-domain.com/widget.js" 
  data-kb-id="TARGET_KNOWLEDGE_BASE_ID" 
  data-color="#06b6d4" 
  defer>
</script>
```

### Configuration Attributes
- `data-kb-id` *(required)*: The target Knowledge Base ID.
- `data-color` *(optional)*: Hex color code for the widget trigger button and accents.

---

## Production Deployment

### Docker Deployment
Run the complete stack using Docker Compose:

```bash
docker compose up -d --build
```

### Production Checklist
- [ ] Generate a cryptographically secure `AUTH_SECRET` (at least 32 characters): `openssl rand -base64 32`.
- [ ] Confirm PostgreSQL has the `vector` extension loaded: `CREATE EXTENSION IF NOT EXISTS vector;`.
- [ ] Ensure `NODE_ENV=production`.
- [ ] Configure TLS/HTTPS termination at your reverse proxy (Nginx, Traefik, or Cloudflare).
- [ ] Verify database connection pool sizing in Prisma adapter.

---

## Security Model

1. **SSRF Guard**: Pre-validates URLs before HTTP requests to prevent access to private IP spaces and cloud metadata.
2. **Tenant Isolation**: Validates `userId` ownership on all write and delete operations.
3. **Password Hashing**: Uses `bcryptjs` with 10 salt rounds. Plaintext credentials are never persisted.
4. **Parameterized Queries**: All vector similarity calculations use parameterized SQL bindings; application entity queries use Prisma's parameterized engine.
5. **Session Integrity**: Stateless JWT tokens signed with `AUTH_SECRET` using HttpOnly cookies.

---

## License

Proprietary enterprise software. All rights reserved.
