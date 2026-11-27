const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const request = require('supertest');

const createApp = require('../src/app');
const { normalizeAiResponse } = require('../src/services/aiMapperService');
const aiEngineService = require('../src/services/aiEngineService');

const TEST_USER = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'advocate.test@counsel.local',
  user_metadata: { full_name: 'Advocate Test' },
};

/**
 * Lightweight in-memory Supabase query builder fake implementing the exact
 * Supabase JS query chains used by our controllers so every route, validator,
 * calculation, error handler, and AI mapping path can be tested deterministically.
 */
function createInMemorySupabase() {
  const db = {
    advocate_profiles: [],
    clients: [],
    cases: [],
    hearings: [],
    documents: [],
    payments: [],
    ai_analyses: [],
    ai_reviews: [],
  };

  function makeBuilder(table) {
    const state = {
      table,
      op: 'select',
      filters: [],
      inFilters: [],
      gteFilters: [],
      lteFilters: [],
      orderBy: null,
      limitCount: null,
      payload: null,
      singleMode: null,
      headCount: false,
      onConflict: null,
    };

    const builder = {
      select(_cols, opts) {
        if (opts?.head && opts?.count === 'exact') state.headCount = true;
        return builder;
      },
      insert(rows) {
        state.op = 'insert';
        state.payload = Array.isArray(rows) ? rows : [rows];
        return builder;
      },
      update(patch) {
        state.op = 'update';
        state.payload = patch;
        return builder;
      },
      upsert(rows, opts) {
        state.op = 'upsert';
        state.payload = Array.isArray(rows) ? rows : [rows];
        state.onConflict = opts?.onConflict || 'id';
        return builder;
      },
      delete() {
        state.op = 'delete';
        return builder;
      },
      eq(col, val) {
        state.filters.push([col, val]);
        return builder;
      },
      in(col, vals) {
        state.inFilters.push([col, vals]);
        return builder;
      },
      gte(col, val) {
        state.gteFilters.push([col, val]);
        return builder;
      },
      lte(col, val) {
        state.lteFilters.push([col, val]);
        return builder;
      },
      order(col, opts) {
        state.orderBy = { col, ascending: opts?.ascending !== false };
        return builder;
      },
      limit(n) {
        state.limitCount = n;
        return builder;
      },
      single() {
        state.singleMode = 'single';
        return builder;
      },
      maybeSingle() {
        state.singleMode = 'maybeSingle';
        return builder;
      },
      then(resolve, reject) {
        try {
          const result = execute(state);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      },
    };
    return builder;
  }

  function hydrateJoins(table, row) {
    const copy = { ...row };
    if (table === 'cases') {
      const client = db.clients.find((c) => c.id === row.client_id);
      if (client) copy.clients = { id: client.id, full_name: client.full_name, client_code: client.client_code };
    }
    if (table === 'hearings' || table === 'documents' || table === 'payments') {
      const cs = db.cases.find((c) => c.id === row.case_id);
      if (cs) {
        const client = db.clients.find((cl) => cl.id === cs.client_id);
        copy.cases = {
          id: cs.id,
          case_number: cs.case_number,
          title: cs.title,
          clients: client ? { full_name: client.full_name } : null,
        };
      }
    }
    if (table === 'ai_analyses') {
      copy.ai_reviews = db.ai_reviews.filter((r) => r.analysis_id === row.id);
    }
    return copy;
  }

  function applyFilters(rows, state) {
    return rows.filter((row) => {
      for (const [col, val] of state.filters) {
        if (row[col] !== val) return false;
      }
      for (const [col, vals] of state.inFilters) {
        if (!vals.includes(row[col])) return false;
      }
      for (const [col, val] of state.gteFilters) {
        if (row[col] < val) return false;
      }
      for (const [col, val] of state.lteFilters) {
        if (row[col] > val) return false;
      }
      return true;
    });
  }

  function execute(state) {
    const rows = db[state.table];
    const now = new Date().toISOString();

    if (state.op === 'insert') {
      const inserted = state.payload.map((item) => {
        const row = {
          id: item.id || crypto.randomUUID(),
          created_at: now,
          updated_at: now,
          ...item,
        };
        if (state.table === 'payments') {
          row.pending_balance = Number((Number(row.total_fee) - Number(row.amount_paid || 0)).toFixed(2));
        }
        rows.push(row);
        return hydrateJoins(state.table, row);
      });
      return formatOut(inserted, state);
    }

    if (state.op === 'upsert') {
      const results = [];
      for (const item of state.payload) {
        const conflictKey = state.onConflict || 'id';
        const existingIdx = rows.findIndex((r) => r[conflictKey] === item[conflictKey]);
        if (existingIdx >= 0) {
          rows[existingIdx] = { ...rows[existingIdx], ...item, updated_at: now };
          results.push(hydrateJoins(state.table, rows[existingIdx]));
        } else {
          const row = { id: item.id || crypto.randomUUID(), created_at: now, updated_at: now, ...item };
          rows.push(row);
          results.push(hydrateJoins(state.table, row));
        }
      }
      return formatOut(results, state);
    }

    if (state.op === 'update') {
      const matched = applyFilters(rows, state);
      const updated = matched.map((row) => {
        Object.assign(row, state.payload, { updated_at: now });
        if (state.table === 'payments') {
          row.pending_balance = Number((Number(row.total_fee) - Number(row.amount_paid || 0)).toFixed(2));
        }
        return hydrateJoins(state.table, row);
      });
      return formatOut(updated, state);
    }

    if (state.op === 'delete') {
      const matched = applyFilters(rows, state);
      if (state.table === 'clients') {
        for (const cl of matched) {
          if (db.cases.some((c) => c.client_id === cl.id)) {
            return { data: null, error: { code: '23503', message: 'FK violation' } };
          }
        }
      }
      for (const m of matched) {
        const idx = rows.indexOf(m);
        if (idx >= 0) rows.splice(idx, 1);
      }
      return formatOut(matched, state);
    }

    // select
    let matched = applyFilters(rows, state).map((r) => hydrateJoins(state.table, r));
    if (state.orderBy) {
      const { col, ascending } = state.orderBy;
      matched.sort((a, b) => {
        if (a[col] === b[col]) return 0;
        return (a[col] < b[col] ? -1 : 1) * (ascending ? 1 : -1);
      });
    }
    if (state.limitCount) matched = matched.slice(0, state.limitCount);
    if (state.headCount) return { count: matched.length, data: null, error: null };
    return formatOut(matched, state);
  }

  function formatOut(list, state) {
    if (state.singleMode === 'single') {
      if (list.length === 0) return { data: null, error: { message: 'Not found' } };
      return { data: list[0], error: null };
    }
    if (state.singleMode === 'maybeSingle') {
      return { data: list[0] || null, error: null };
    }
    return { data: list, error: null };
  }

  return {
    db,
    client: {
      from: (table) => makeBuilder(table),
      auth: { signOut: async () => ({ error: null }) },
    },
  };
}

function setupTestApp() {
  const app = createApp();
  const mem = createInMemorySupabase();
  const storageFiles = new Map();

  app.locals.authVerifier = async (token) => {
    if (token !== 'valid-test-token') return null;
    return { user: TEST_USER, supabase: mem.client };
  };

  app.locals.storage = {
    async uploadDocumentFile({ userId, caseId, file }) {
      const storagePath = `${userId}/${caseId}/${file.originalname}`;
      storageFiles.set(storagePath, file.buffer);
      return { storagePath };
    },
    async createSignedDownloadUrl(storagePath) {
      return `https://storage.example.test/signed/${encodeURIComponent(storagePath)}`;
    },
    async downloadFileBuffer(storagePath) {
      if (!storageFiles.has(storagePath)) {
        throw new Error('File missing in storage');
      }
      return storageFiles.get(storagePath);
    },
    async deleteDocumentFile(storagePath) {
      storageFiles.delete(storagePath);
    },
  };

  const sampleAiResponse = {
    case_id: 'CS/2026/001',
    matter_title: 'Blue Oak Supplies vs Northstar Retail',
    processed_documents: ['contract.txt'],
    document_analyst: {
      case_title: 'Blue Oak Supplies vs Northstar Retail',
      matter_type: 'Commercial Contract Dispute',
      parties: ['Blue Oak Supplies Pvt Ltd', 'Northstar Retail Ventures'],
      summary: 'Agreement signed on 15 September 2026 for INR 80,000.',
      facts: ['Contract executed on 2026-09-15 for INR 80,000.'],
      claims_and_allegations: ['Buyer alleges shortage of 8 chairs.'],
      evidence_mentioned: ['Supply Agreement dated 2026-09-15'],
      payment_information: ['INR 80,000 within 15 days of delivery'],
      missing_documents: ['Signed delivery challan'],
      risks: ['Absence of signed receipt'],
      advocate_questions: ['Are gate pass logs available?'],
    },
    timeline: {
      chronological_events: [
        {
          date: '2026-09-15',
          event_description: 'Supply agreement executed',
          source_doc: 'contract.txt',
          page_number: 1,
          is_conflict: false,
          conflict_note: null,
        },
      ],
      undated_events: [],
      date_conflicts: [],
    },
    actions: {
      recommended_actions: [
        {
          title: 'Obtain Delivery Receipt',
          explanation: 'Collect signed consignment note from transport carrier.',
          priority: 'High',
          reason: 'Payment depends on verified delivery.',
          missing_evidence: 'Signed delivery challan',
          advocate_verification_needed: 'Confirm driver dispatch log',
        },
      ],
      immediate_next_steps: ['Obtain Delivery Receipt'],
    },
    review: {
      review_passed: true,
      confidence_score: 0.94,
      flags: [
        {
          severity: 'Warning',
          issue_type: 'Evidentiary Gap',
          description: 'No signed delivery receipt present.',
          recommendation: 'Request consignment note.',
        },
      ],
      grounding_summary: 'Strictly grounded in uploaded contract.txt.',
    },
    pipeline_status: {
      document_analyst: 'success',
      timeline_agent: 'success',
      action_agent: 'success',
      reviewer_agent: 'success',
    },
  };

  app.locals.aiEngine = {
    async checkAiEngineHealth() {
      return { status: 'healthy', service: 'Counsel AI Engine', model: 'gemini-3.5-flash-lite' };
    },
    async analyzeFiles() {
      return sampleAiResponse;
    },
    async analyzeText() {
      return sampleAiResponse;
    },
  };

  return { app, mem, storageFiles };
}

test('Health endpoint returns 200 and service status', async () => {
  const { app } = setupTestApp();
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.service, 'Counsel Main Backend');
});

test('Protected routes reject unauthenticated and invalid token requests', async () => {
  const { app } = setupTestApp();
  const noAuth = await request(app).get('/api/clients');
  assert.equal(noAuth.status, 401);
  assert.equal(noAuth.body.success, false);

  const badAuth = await request(app)
    .get('/api/clients')
    .set('Authorization', 'Bearer bad-token');
  assert.equal(badAuth.status, 401);
});

test('Full CRUD lifecycle for Clients, Cases, Hearings, Documents, Payments, Dashboard, and AI Workflow + Review', async () => {
  const { app } = setupTestApp();
  const auth = { Authorization: 'Bearer valid-test-token' };

  // 1. Create Client + Validation
  const badClient = await request(app).post('/api/clients').set(auth).send({ phone: '123' });
  assert.equal(badClient.status, 400);

  const clRes = await request(app)
    .post('/api/clients')
    .set(auth)
    .send({
      full_name: 'Blue Oak Supplies Pvt. Ltd.',
      client_type: 'Corporate',
      phone: '+91 98765 00001',
      email: 'legal@blueoak.example.com',
      address: 'Lucknow',
    });
  assert.equal(clRes.status, 201);
  const clientId = clRes.body.data.id;

  // 2. Create Case
  const csRes = await request(app)
    .post('/api/cases')
    .set(auth)
    .send({
      case_number: 'CS/2026/101',
      title: 'Blue Oak Supplies vs Northstar Retail',
      client_id: clientId,
      case_type: 'Commercial',
      court_name: 'Commercial Court, Delhi',
      status: 'active',
    });
  assert.equal(csRes.status, 201);
  const caseId = csRes.body.data.id;

  // Cannot delete client while cases exist
  const delBlocked = await request(app).delete(`/api/clients/${clientId}`).set(auth);
  assert.equal(delBlocked.status, 409);

  // 3. Hearings CRUD + Date Range Filter
  const today = new Date().toISOString().split('T')[0];
  const hRes = await request(app)
    .post('/api/hearings')
    .set(auth)
    .send({
      case_id: caseId,
      hearing_date: today,
      hearing_time: '11:00',
      court_name: 'Commercial Court, Delhi',
      notes: 'Arguments on interim relief',
    });
  assert.equal(hRes.status, 201);
  const hearingId = hRes.body.data.id;

  const hFilter = await request(app)
    .get(`/api/hearings?caseId=${caseId}&startDate=${today}&endDate=${today}`)
    .set(auth);
  assert.equal(hFilter.status, 200);
  assert.equal(hFilter.body.data.length, 1);

  // 4. Payments: Partial payment, negative balance guard, paid-with-balance guard
  const badPay = await request(app)
    .post('/api/payments')
    .set(auth)
    .send({ case_id: caseId, total_fee: 100000, amount_paid: 120000 });
  assert.equal(badPay.status, 400);
  assert.equal(badPay.body.error.code, 'OVERPAYMENT_NOT_ALLOWED');

  const badPaidStatus = await request(app)
    .post('/api/payments')
    .set(auth)
    .send({ case_id: caseId, total_fee: 100000, amount_paid: 40000, status: 'paid' });
  assert.equal(badPaidStatus.status, 400);
  assert.equal(badPaidStatus.body.error.code, 'OUTSTANDING_BALANCE_EXISTS');

  const payRes = await request(app)
    .post('/api/payments')
    .set(auth)
    .send({
      case_id: caseId,
      total_fee: 100000,
      amount_paid: 40000,
      payment_method: 'Bank Transfer',
      notes: 'Initial retainer',
    });
  assert.equal(payRes.status, 201);
  assert.equal(payRes.body.data.pending_balance, 60000);
  assert.equal(payRes.body.data.status, 'partial');
  const paymentId = payRes.body.data.id;

  const payUpd = await request(app)
    .put(`/api/payments/${paymentId}`)
    .set(auth)
    .send({ amount_paid: 100000, status: 'paid' });
  assert.equal(payUpd.status, 200);
  assert.equal(payUpd.body.data.pending_balance, 0);
  assert.equal(payUpd.body.data.status, 'paid');

  // 5. Documents Upload (valid TXT, reject EXE), Signed Download, Stream
  const badUpload = await request(app)
    .post('/api/documents/upload')
    .set(auth)
    .field('case_id', caseId)
    .attach('file', Buffer.from('binary'), 'malware.exe');
  assert.equal(badUpload.status, 400);

  const upRes = await request(app)
    .post('/api/documents/upload')
    .set(auth)
    .field('case_id', caseId)
    .field('document_name', 'Supply Agreement')
    .field('category', 'Contract')
    .attach('file', Buffer.from('Contract between Blue Oak and Northstar for INR 80,000.'), 'contract.txt');
  assert.equal(upRes.status, 201);
  const docId = upRes.body.data.id;

  const dlRes = await request(app).get(`/api/documents/${docId}/download`).set(auth);
  assert.equal(dlRes.status, 200);
  assert.ok(dlRes.body.data.downloadUrl.includes('https://'));

  // 6. Dashboard calculated statistics
  const dashRes = await request(app).get('/api/dashboard').set(auth);
  assert.equal(dashRes.status, 200);
  assert.equal(dashRes.body.data.totalClients, 1);
  assert.equal(dashRes.body.data.totalCases, 1);
  assert.equal(dashRes.body.data.activeCases, 1);
  assert.equal(dashRes.body.data.todaysHearings, 1);
  assert.equal(dashRes.body.data.totalAgreedFees, 100000);
  assert.equal(dashRes.body.data.totalAmountCollected, 100000);
  assert.equal(dashRes.body.data.outstandingBalance, 0);

  // 7. AI Workflow using uploaded document + Advocate Review & Certification Persistence
  const aiRes = await request(app)
    .post('/api/ai/agent-workflow')
    .set(auth)
    .send({ caseId, documentIds: [docId], task: 'Analyze contract breach' });
  assert.equal(aiRes.status, 200);
  assert.equal(aiRes.body.success, true);
  const analysisId = aiRes.body.data.analysisId;
  assert.equal(aiRes.body.data.reviewStatus, 'ai_generated');
  assert.equal(aiRes.body.data.materialFacts.length, 1);
  assert.equal(aiRes.body.data.timeline.length, 1);

  const certRes = await request(app)
    .post(`/api/ai/analysis/${analysisId}/certify`)
    .set(auth)
    .send({
      advocate_comments: 'Verified against original contract.',
      corrected_result: { summaryText: 'Certified summary by Advocate.' },
    });
  assert.equal(certRes.status, 200);
  assert.equal(certRes.body.data.reviewStatus, 'approved');
  assert.ok(certRes.body.data.review.certifiedAt);

  const reloadRes = await request(app).get(`/api/ai/analysis/${analysisId}`).set(auth);
  assert.equal(reloadRes.status, 200);
  assert.equal(reloadRes.body.data.reviewStatus, 'approved');
  assert.equal(reloadRes.body.data.review.advocateComments, 'Verified against original contract.');

  // Cleanup delete checks
  const delDoc = await request(app).delete(`/api/documents/${docId}`).set(auth);
  assert.equal(delDoc.status, 200);
  const delHearing = await request(app).delete(`/api/hearings/${hearingId}`).set(auth);
  assert.equal(delHearing.status, 200);
});

test('AI Workflow returns real error (never fabricated data) when AI Engine fails or times out', async () => {
  const { app } = setupTestApp();
  const auth = { Authorization: 'Bearer valid-test-token' };

  const clRes = await request(app)
    .post('/api/clients')
    .set(auth)
    .send({ full_name: 'Demo Client', phone: '9999999999' });
  const csRes = await request(app)
    .post('/api/cases')
    .set(auth)
    .send({ title: 'Demo Matter', client_id: clRes.body.data.id, court_name: 'High Court' });
  const caseId = csRes.body.data.id;

  // Missing caseId -> 400
  const missingCase = await request(app)
    .post('/api/ai/agent-workflow')
    .set(auth)
    .send({ documentText: 'Some text' });
  assert.equal(missingCase.status, 400);

  // Simulated AI Engine unavailable error
  app.locals.aiEngine = {
    async analyzeText() {
      const err = new Error('Counsel AI Engine service is currently unavailable.');
      err.statusCode = 503;
      err.code = 'AI_ENGINE_UNAVAILABLE';
      throw err;
    },
  };

  const unavailRes = await request(app)
    .post('/api/ai/agent-workflow')
    .set(auth)
    .send({ caseId, documentText: 'Contract text here' });
  assert.equal(unavailRes.status, 503);
  assert.equal(unavailRes.body.success, false);
});

test('aiEngineService rejects malformed responses and unconfigured URL', async () => {
  assert.throws(
    () => aiEngineService.validateAiEnginePayload({ unexpected: true }),
    /malformed response/i
  );

  await assert.rejects(
    () =>
      aiEngineService.analyzeText({
        caseId: '1',
        caseText: 'sample',
        baseUrl: 'http://localhost:9999',
        httpClient: {
          post: async () => ({ data: { invalid: 'shape' } }),
        },
      }),
    /malformed response/i
  );

  await assert.rejects(
    () =>
      aiEngineService.analyzeText({
        caseId: '1',
        caseText: 'sample',
        baseUrl: 'http://localhost:9999',
        httpClient: {
          post: async () => {
            const err = new Error('timeout of 5000ms exceeded');
            err.code = 'ECONNABORTED';
            throw err;
          },
        },
      }),
    /timed out/i
  );
});

test('aiMapperService maps only present fields and leaves missing fields null/empty', () => {
  const mapped = normalizeAiResponse({
    case_id: 'C1',
    matter_title: 'Test Case',
    processed_documents: ['doc.pdf'],
    document_analyst: {
      case_title: 'Test Case',
      matter_type: 'Civil',
      parties: ['Party A'],
      summary: 'Summary text',
      facts: ['Fact 1'],
      claims_and_allegations: [],
      evidence_mentioned: [],
      payment_information: [],
      missing_documents: [],
      risks: [],
      advocate_questions: [],
    },
    timeline: { chronological_events: [], undated_events: [], date_conflicts: [] },
    actions: { recommended_actions: [], immediate_next_steps: [] },
    review: null,
    pipeline_status: { document_analyst: 'success' },
  });

  assert.equal(mapped.summary.text, 'Summary text');
  assert.equal(mapped.confidence, null);
  assert.deepEqual(mapped.reviewFlags, []);
  assert.deepEqual(mapped.legalIssues, []);
});
