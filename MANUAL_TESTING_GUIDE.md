# Synapse RAG — Quality Assurance & Manual Verification Playbook

This document defines the acceptance test suites and manual verification procedures for Synapse RAG. It covers end-to-end user workflows, API contracts, security controls, vector database operations, and user interface responsiveness.

---

## 1. Test Environment Setup & Initialization

### Prerequisites
- Node.js >= 20.x
- PostgreSQL instance with `pgvector` enabled (local Docker, Supabase, or Neon)
- Modern web browser (Chrome, Firefox, or Safari)

### Initialization Steps
1. Verify environment configuration:
   ```bash
   cp .env.example .env
   ```
2. Apply database migrations and generate Prisma client:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
3. Populate seed records (creates demo user, sample knowledge base, and vector chunks):
   ```bash
   npm run db:seed
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Confirm server accessibility at `http://localhost:3000`.

---

## 2. Smoke Test Checklist (5-Minute Verification)

Perform this fast sanity check before executing deep functional suites:

| Check | Procedure | Expected State | Pass / Fail |
| :--- | :--- | :--- | :--- |
| **Server Health** | Navigate to `http://localhost:3000` | Landing page renders with 0 console errors | [ ] |
| **Demo Auth** | Click "Try Demo Account (One Click)" on `/login` | Redirects to `/dashboard` with seeded knowledge base | [ ] |
| **Vector DB** | Run `SELECT COUNT(*) FROM "DocumentChunk";` | Returns >= 4 chunks from seed | [ ] |
| **Chat Stream** | Open Playground and send "Hello" | Assistant streams grounded response | [ ] |
| **Automated Tests** | Run `npm test` in terminal | 24 tests pass with exit code 0 | [ ] |

---

## 3. Functional Test Suites

### Test Suite 1: Authentication & Session Management

#### TC-AUTH-01: Demo Account One-Click Authentication
- **Priority**: P0 (Blocker)
- **Objective**: Verify passwordless authentication for evaluators.
- **Preconditions**: Seed script executed; user not authenticated.
- **Steps**:
  1. Navigate to `http://localhost:3000/login`.
  2. Click **Try Demo Account (One Click)**.
- **Expected Result**:
  - HTTP POST sent to `/api/auth/callback/credentials` with `isDemo: true`.
  - NextAuth JWT session created with role `DEMO`.
  - Immediate redirection to `/dashboard`.
  - Pre-seeded Knowledge Base ("Acme Cloud Support AI") displayed in the list.

#### TC-AUTH-02: User Registration & Credential Sign-in
- **Priority**: P0 (Blocker)
- **Objective**: Verify standard user account creation and password hashing with bcrypt.
- **Steps**:
  1. From `/dashboard`, click **Sign Out**.
  2. On `/login`, toggle to the registration form.
  3. Submit an email address and a password with at least 6 characters.
- **Expected Result**:
  - Server validates input against Zod `registerSchema`.
  - Record created in `User` table with bcrypt-hashed password (`$2a$10$...`).
  - Automatic session establishment and redirection to `/dashboard`.
  - Empty state displayed: "No Knowledge Bases yet".

#### TC-AUTH-03: Theme Persistence
- **Priority**: P2 (Normal)
- **Objective**: Verify light/dark theme switching without hydration mismatches.
- **Steps**:
  1. Click the theme toggle icon in the navigation bar.
  2. Reload the page (`Ctrl+R` or `F5`).
- **Expected Result**:
  - Root `<html>` element class toggles between `dark` and `light`.
  - Theme state persists across page reloads without UI flickering or cascading render warnings.

---

### Test Suite 2: Knowledge Base Management (CRUD)

#### TC-KB-01: Knowledge Base Creation
- **Priority**: P0 (Blocker)
- **Objective**: Verify creation of an isolated knowledge repository with custom persona settings.
- **Steps**:
  1. Navigate to `/dashboard`.
  2. Click **New Knowledge Base**.
  3. Enter Name: `Internal IT Knowledge Base`.
  4. Select a persona preset (e.g., "Technical Documentation Guide") and choose an accent color.
  5. Submit the modal.
- **Expected Result**:
  - POST request to `/api/kb` returns HTTP 201.
  - New card renders on dashboard with correct title, document counter (`0`), and accent badge.
  - Clicking the card navigates to `/dashboard/[kbId]`.

#### TC-KB-02: Settings Update & Tenant Isolation
- **Priority**: P1 (Critical)
- **Objective**: Verify update operations and strict ownership checks.
- **Steps**:
  1. Open the created Knowledge Base.
  2. Navigate to the **Assistant Settings** tab.
  3. Update System Prompt and change Visibility to **Private**.
  4. Click **Save Changes**.
- **Expected Result**:
  - PATCH request to `/api/kb/[id]` returns HTTP 200.
  - Changes persist upon refresh.
  - Non-owner accounts attempting to call PATCH or DELETE receive HTTP 403 Forbidden.

#### TC-KB-03: Knowledge Base Deletion & Cascade Clean-up
- **Priority**: P1 (Critical)
- **Objective**: Verify cascading deletion of associated documents and vector chunks.
- **Steps**:
  1. In the **Assistant Settings** tab, click **Delete Knowledge Base**.
  2. Confirm the browser prompt.
- **Expected Result**:
  - DELETE `/api/kb/[id]` executes successfully.
  - Foreign key constraints cascade: corresponding records in `Document` and `DocumentChunk` are purged.
  - User redirected to `/dashboard`.

---

### Test Suite 3: Document Ingestion & Parser Pipeline

#### TC-INGEST-01: Multi-Format File Upload
- **Priority**: P0 (Blocker)
- **Objective**: Test ingestion of PDF, DOCX, TXT, and Markdown files.
- **Steps**:
  1. In `/dashboard/[kbId]`, select the **Data Sources** tab.
  2. Under **Upload Documents**, select or drag files of varying formats:
     - Sample PDF file
     - Sample DOCX file
     - Sample TXT / Markdown file
  3. Click **Upload & Process**.
- **Expected Result**:
  - Multipart form data uploaded to `/api/kb/[id]/documents/upload`.
  - Initial `Document` record created with status `PROCESSING`.
  - Text extracted correctly via `unpdf` (PDF), `mammoth` (DOCX), or UTF-8 parser.
  - Text split into chunks with status updated to `READY`.

#### TC-INGEST-02: Web Crawling & SSRF Protection
- **Priority**: P0 (Blocker)
- **Objective**: Test URL ingestion and verify enforcement of SSRF boundaries.
- **Steps**:
  1. Select **Crawl Web URL** in the Data Sources tab.
  2. Submit a valid public URL: `https://example.com`.
  3. Submit an internal IP address: `http://127.0.0.1:8080` or `http://[::1]:3000`.
  4. Submit cloud metadata endpoint: `http://169.254.169.254/latest/meta-data`.
- **Expected Result**:
  - Valid public URL: Fetched, boilerplate HTML stripped via `cheerio`, and indexed as a document.
  - Internal / Loopback / Metadata URLs: Blocked immediately with a client error before network execution.

#### TC-INGEST-03: Chunk Inspection
- **Priority**: P2 (Normal)
- **Objective**: Inspect chunk boundaries and character overlap.
- **Steps**:
  1. On a document marked `READY`, click **Inspect Chunks**.
- **Expected Result**:
  - Modal opens listing all chunks in sequential order.
  - Displays token estimation and character content.
  - Overlap between consecutive chunks preserves context continuity.

---

### Test Suite 4: Vector Search & pgvector Storage

#### TC-VEC-01: Vector Storage Verification
- **Priority**: P1 (Critical)
- **Objective**: Verify embedding insertion into PostgreSQL `pgvector`.
- **Steps**:
  1. Connect to PostgreSQL using `psql` or a database GUI client:
     ```sql
     SELECT id, "documentId", "chunkIndex", "tokenCount", (embedding IS NOT NULL) AS has_vector 
     FROM "DocumentChunk" 
     LIMIT 5;
     ```
- **Expected Result**:
  - `has_vector` evaluates to `true`.
  - Dimensionality matches 1536 (or deterministic fallback vector dimension).

#### TC-VEC-02: Multi-Document Fair Coverage Retrieval
- **Priority**: P1 (Critical)
- **Objective**: Ensure chunks from all ready documents in the knowledge base are represented during retrieval.
- **Steps**:
  1. In a knowledge base with at least two distinct documents, run a broad query.
- **Expected Result**:
  - Retrieval engine includes top-scoring chunks from each document rather than exhausting the limit on a single long file.

---

### Test Suite 5: RAG Query Engine & Bidirectional (RTL/LTR) Chat

#### TC-RAG-01: Streaming Responses & Source Attribution
- **Priority**: P0 (Blocker)
- **Objective**: Verify real-time token streaming and citation mapping.
- **Steps**:
  1. Navigate to the **Playground** tab.
  2. Submit a question answered by the uploaded documents.
- **Expected Result**:
  - Tokens stream into the assistant chat bubble with minimal latency.
  - In-text citation badges (`[Doc 1]`, `[Doc 2]`) appear within the response.
  - Response header `X-Sources` provides base64-encoded citation metadata.

#### TC-RAG-02: Dynamic RTL & Multilingual Detection
- **Priority**: P1 (Critical)
- **Objective**: Verify dynamic text direction detection for Persian and Arabic queries.
- **Steps**:
  1. Type an English query: `Summarize the service level agreement.`
  2. Observe the input field and response bubble direction.
  3. Type a Persian or Arabic query: `شرایط پشتیبانی و خدمات چیست؟`
  4. Observe the input field and response bubble direction.
- **Expected Result**:
  - English query: Left-to-right alignment (`dir="ltr"`).
  - Persian/Arabic query: Input field immediately switches to right-to-left (`dir="rtl"`) with the Persian font family (`Vazirmatn`). Assistant response renders with RTL alignment.

#### TC-RAG-03: Source Citation Modal
- **Priority**: P2 (Normal)
- **Objective**: Verify citation inspection modal.
- **Steps**:
  1. Click on a citation badge (`[Doc 1]`) at the bottom of an assistant message.
- **Expected Result**:
  - Modal displays the exact text snippet retrieved from the vector index.
  - Shows source document name, document type (PDF, DOCX, URL, etc.), and similarity score.

#### TC-RAG-04: Out-of-Domain Query Boundaries
- **Priority**: P1 (Critical)
- **Objective**: Verify that the assistant adheres to grounding constraints and does not hallucinate.
- **Steps**:
  1. Ask an unrelated question not covered in the knowledge base.
- **Expected Result**:
  - Assistant responds that the answer cannot be found in the provided documentation.
  - No speculative or ungrounded claims are made.

---

### Test Suite 6: Public Deployment & Embeddable Widget

#### TC-EMBED-01: Public Assistant Access & Privacy Enforcement
- **Priority**: P0 (Blocker)
- **Objective**: Verify access control on the public bot URL.
- **Steps**:
  1. In **Embed & Share**, copy the **Public Assistant Link** (`/bot/[kbId]`).
  2. Open the link in a private/incognito browser window (unauthenticated).
  3. Return to settings, toggle visibility to **Private**, and refresh the incognito tab.
- **Expected Result**:
  - When Public: Full-screen chat interface renders without dashboard navigation, allowing guest interaction.
  - When Private: Displays "Assistant Unavailable" banner; requests to `/api/chat` for private bots without owner credentials return HTTP 403.

#### TC-EMBED-02: Cross-Origin Iframe Widget Integration
- **Priority**: P1 (Critical)
- **Objective**: Verify embedding via `public/widget.js`.
- **Steps**:
  1. Create a local test HTML file (`test-widget.html`):
     ```html
     <!DOCTYPE html>
     <html lang="en">
     <head>
       <meta charset="UTF-8">
       <title>Widget Integration Test</title>
     </head>
     <body style="font-family: sans-serif; padding: 40px; background: #f8fafc;">
       <h1>Host Application Test Page</h1>
       <p>Testing iframe embed widget integration.</p>

       <script 
         src="http://localhost:3000/widget.js" 
         data-kb-id="TARGET_KB_ID" 
         defer>
       </script>
     </body>
     </html>
     ```
     *(Replace `TARGET_KB_ID` with an active Knowledge Base ID)*
  2. Open `test-widget.html` in a web browser.
  3. Click the floating launcher button in the bottom-right corner.
- **Expected Result**:
  - Floating launcher button appears cleanly with shadow and transition.
  - Clicking the launcher opens the iframe chat panel smoothly.
  - Guest user can chat with the assistant and receive streamed responses with citations inside the host page.

---

## 4. Automated Regression Verification

Prior to release, execute the automated regression test pipeline:

```bash
# 1. Type safety check
npx tsc --noEmit

# 2. Static analysis and linting
npm run lint

# 3. Unit and integration tests
npm test

# 4. Production build verification
npm run build
```

All commands must exit with code `0`.

---

## 5. Defect Severity Matrix

When reporting defects during test execution, classify issues using the following rubric:

| Severity | Definition | Examples | SLA to Resolve |
| :--- | :--- | :--- | :--- |
| **P0 - Blocker** | System-wide failure, data loss, security compromise, or critical path blocked with no workaround. | Crash on login; database data loss; SSRF bypass. | Immediate hotfix |
| **P1 - Critical** | Major feature broken; core workflow degraded but temporary workaround exists. | Ingestion fails for DOCX files; streaming chat times out. | Within 24 hours |
| **P2 - Major** | Non-critical functionality impaired; visual glitches impacting usability. | Theme toggle flickering; citation badge alignment bug. | Next sprint / release |
| **P3 - Minor** | Cosmetic flaws, typos, or minor styling inconsistencies. | Minor margin mismatch in settings tab; typo in placeholder. | Backlog |
