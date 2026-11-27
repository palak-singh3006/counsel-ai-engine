/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'counsel-documents';

const DEMO_EMAIL = process.env.SEED_ADVOCATE_EMAIL || 'advocate.demo@counsel.local';
const DEMO_PASSWORD = process.env.SEED_ADVOCATE_PASSWORD || 'CounselDemo2026!';
const DEMO_NAME = process.env.SEED_ADVOCATE_NAME || 'Advocate J.K. Shukla';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  realtime: {
    transport: WebSocket,
  },
});

function addDaysISO(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

async function ensureDemoUser() {
  const { data: listData, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;

  const existing = listData.users.find((u) => u.email?.toLowerCase() === DEMO_EMAIL.toLowerCase());
  if (existing) {
    console.log(`Using existing demo advocate user: ${existing.email} (${existing.id})`);
    return existing;
  }

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: DEMO_NAME,
      firm_name: 'JK Shukla & Associates',
      role: 'Managing Partner',
    },
  });
  if (createErr) throw createErr;

  console.log(`Created demo advocate user: ${created.user.email} (${created.user.id})`);
  return created.user;
}

async function seed() {
  console.log('Starting Counsel database seed...');
  const user = await ensureDemoUser();
  const userId = user.id;

  // 1. Advocate Profile
  await supabase.from('advocate_profiles').upsert({
    id: userId,
    full_name: DEMO_NAME,
    email: DEMO_EMAIL,
    phone: '+91 98390 42110',
    role: 'Managing Partner',
    firm_name: 'JK Shukla & Associates',
    bar_council_reg: 'UP/04128/1998',
    office_address: 'Chamber 42, High Court Bar Association Building, Gomti Nagar, Lucknow - 226010',
    jurisdiction: 'High Court of Judicature at Allahabad (Lucknow Bench), District & Commercial Courts',
  });

  // Check if cases already seeded for this user
  const { data: existingCases } = await supabase
    .from('cases')
    .select('id, case_number')
    .eq('user_id', userId);

  if (existingCases && existingCases.length > 0) {
    console.log(`Database already has ${existingCases.length} cases for ${DEMO_EMAIL}. Skipping duplicate seed.`);
    return;
  }

  // 2. Clients (Fictional demo data)
  const clientsSeed = [
    {
      user_id: userId,
      client_code: 'CL001',
      full_name: 'Rajesh Kumar Verma',
      client_type: 'Individual',
      phone: '+91 98765 43210',
      email: 'rajesh.verma.demo@example.com',
      address: 'A-12, Sector 62, Noida, UP',
      status: 'active',
    },
    {
      user_id: userId,
      client_code: 'CL002',
      full_name: 'Priya Sharma',
      client_type: 'Individual',
      phone: '+91 87654 32109',
      email: 'priya.sharma.demo@example.com',
      address: '45, Civil Lines, Lucknow, UP',
      status: 'active',
    },
    {
      user_id: userId,
      client_code: 'CL003',
      full_name: 'Blue Oak Supplies Pvt. Ltd.',
      client_type: 'Corporate',
      phone: '+91 11 2345 6789',
      email: 'legal@blueoaksupplies.example.com',
      address: 'DLF Cyber Hub, Gurugram, Haryana',
      status: 'active',
    },
    {
      user_id: userId,
      client_code: 'CL004',
      full_name: 'Sunita Devi',
      client_type: 'Individual',
      phone: '+91 76543 21098',
      email: 'sunita.devi.demo@example.com',
      address: '78, Hazratganj, Lucknow, UP',
      status: 'active',
    },
    {
      user_id: userId,
      client_code: 'CL005',
      full_name: 'Bharat Construction Co.',
      client_type: 'Corporate',
      phone: '+91 522 234 5678',
      email: 'counsel@bharatconstruction.example.com',
      address: 'Gomti Nagar, Lucknow, UP',
      status: 'active',
    },
    {
      user_id: userId,
      client_code: 'CL006',
      full_name: 'Anand Prakash Mishra',
      client_type: 'Individual',
      phone: '+91 65432 10987',
      email: 'anand.mishra.demo@example.com',
      address: 'Aliganj, Lucknow, UP',
      status: 'inactive',
    },
  ];

  const { data: insertedClients, error: clientsErr } = await supabase
    .from('clients')
    .insert(clientsSeed)
    .select();
  if (clientsErr) throw clientsErr;

  const clientByCode = Object.fromEntries(insertedClients.map((c) => [c.client_code, c]));
  console.log(`Inserted ${insertedClients.length} demo clients.`);

  // 3. Cases
  const casesSeed = [
    {
      user_id: userId,
      case_number: 'CS/2026/001',
      title: 'Verma vs. State of UP',
      client_id: clientByCode.CL001.id,
      case_type: 'Criminal',
      court_name: 'High Court, Lucknow',
      judge_name: 'Hon. Justice A.K. Singh',
      filing_date: addDaysISO(-95),
      status: 'active',
      assigned_advocate: DEMO_NAME,
      description: 'Criminal appeal under Section 374(2) CrPC against conviction under Sections 420, 468, 471 IPC.',
      next_hearing_date: addDaysISO(0),
    },
    {
      user_id: userId,
      case_number: 'CS/2026/002',
      title: 'Sharma Ancestral Property Partition',
      client_id: clientByCode.CL002.id,
      case_type: 'Civil',
      court_name: 'Civil Court, Lucknow',
      judge_name: 'Hon. Civil Judge (Sr. Div.) R. Gupta',
      filing_date: addDaysISO(-72),
      status: 'active',
      assigned_advocate: DEMO_NAME,
      description: 'Civil suit for partition and permanent injunction regarding ancestral residential property.',
      next_hearing_date: addDaysISO(2),
    },
    {
      user_id: userId,
      case_number: 'CS/2026/003',
      title: 'Blue Oak Supplies vs. Northstar Retail',
      client_id: clientByCode.CL003.id,
      case_type: 'Commercial',
      court_name: 'Commercial Court, Delhi',
      judge_name: 'Hon. District Judge (Commercial) V. Mehta',
      filing_date: addDaysISO(-45),
      status: 'active',
      assigned_advocate: DEMO_NAME,
      description: 'Commercial recovery suit under supply agreement for INR 80,000 unpaid office furniture invoice.',
      next_hearing_date: addDaysISO(5),
    },
    {
      user_id: userId,
      case_number: 'CS/2026/004',
      title: 'Sunita Devi vs. Ramesh Prasad',
      client_id: clientByCode.CL004.id,
      case_type: 'Family',
      court_name: 'Family Court, Lucknow',
      judge_name: 'Hon. Principal Judge M. Tiwari',
      filing_date: addDaysISO(-40),
      status: 'active',
      assigned_advocate: DEMO_NAME,
      description: 'Maintenance petition under Section 125 CrPC.',
      next_hearing_date: addDaysISO(0),
    },
    {
      user_id: userId,
      case_number: 'CS/2026/005',
      title: 'Bharat Construction Labour Dispute',
      client_id: clientByCode.CL005.id,
      case_type: 'Labour',
      court_name: 'Labour Court, Lucknow',
      judge_name: 'Hon. Presiding Officer S. Verma',
      filing_date: addDaysISO(-110),
      status: 'pending',
      assigned_advocate: DEMO_NAME,
      description: 'Dispute regarding termination of contract workers and statutory compliance.',
      next_hearing_date: addDaysISO(7),
    },
    {
      user_id: userId,
      case_number: 'CS/2026/006',
      title: 'Verma Tax Reassessment Appeal',
      client_id: clientByCode.CL001.id,
      case_type: 'Tax',
      court_name: 'ITAT, Lucknow',
      judge_name: 'Hon. Judicial Member P. Joshi',
      filing_date: addDaysISO(-60),
      status: 'pending',
      assigned_advocate: DEMO_NAME,
      description: 'Appeal against income tax reassessment notice under Section 148.',
      next_hearing_date: addDaysISO(12),
    },
    {
      user_id: userId,
      case_number: 'CS/2026/007',
      title: 'Mishra Cheque Bounce Matter',
      client_id: clientByCode.CL006.id,
      case_type: 'Criminal',
      court_name: 'Magistrate Court, Lucknow',
      judge_name: 'Hon. ACJM K. Pandey',
      filing_date: addDaysISO(-180),
      status: 'closed',
      assigned_advocate: DEMO_NAME,
      description: 'Complaint under Section 138 NI Act. Settled out of court via mediation.',
      next_hearing_date: null,
    },
  ];

  const { data: insertedCases, error: casesErr } = await supabase
    .from('cases')
    .insert(casesSeed)
    .select();
  if (casesErr) throw casesErr;

  const caseByNo = Object.fromEntries(insertedCases.map((c) => [c.case_number, c]));
  console.log(`Inserted ${insertedCases.length} demo cases.`);

  // 4. Hearings
  const hearingsSeed = [
    {
      user_id: userId,
      case_id: caseByNo['CS/2026/001'].id,
      hearing_date: addDaysISO(0),
      hearing_time: '10:30',
      court_name: 'High Court, Lucknow (Court No. 4)',
      judge_name: 'Hon. Justice A.K. Singh',
      hearing_type: 'Arguments',
      status: 'today',
      notes: 'Arguments on suspension of sentence application u/s 389 CrPC.',
    },
    {
      user_id: userId,
      case_id: caseByNo['CS/2026/004'].id,
      hearing_date: addDaysISO(0),
      hearing_time: '11:30',
      court_name: 'Family Court, Lucknow',
      judge_name: 'Hon. Principal Judge M. Tiwari',
      hearing_type: 'Evidence',
      status: 'today',
      notes: 'Cross-examination of respondent witness.',
    },
    {
      user_id: userId,
      case_id: caseByNo['CS/2026/002'].id,
      hearing_date: addDaysISO(2),
      hearing_time: '10:00',
      court_name: 'Civil Court, Lucknow',
      judge_name: 'Hon. Civil Judge R. Gupta',
      hearing_type: 'Arguments',
      status: 'upcoming',
      notes: 'Written submissions on preliminary injunction.',
    },
    {
      user_id: userId,
      case_id: caseByNo['CS/2026/003'].id,
      hearing_date: addDaysISO(5),
      hearing_time: '14:00',
      court_name: 'Commercial Court, Delhi',
      judge_name: 'Hon. District Judge V. Mehta',
      hearing_type: 'Admission',
      status: 'upcoming',
      notes: 'Admission & inspection of supply agreement and delivery claim.',
    },
    {
      user_id: userId,
      case_id: caseByNo['CS/2026/005'].id,
      hearing_date: addDaysISO(7),
      hearing_time: '11:00',
      court_name: 'Labour Court, Lucknow',
      judge_name: 'Hon. Presiding Officer S. Verma',
      hearing_type: 'Conciliation',
      status: 'upcoming',
      notes: 'Conciliation conference between management and union counsel.',
    },
    {
      user_id: userId,
      case_id: caseByNo['CS/2026/006'].id,
      hearing_date: addDaysISO(12),
      hearing_time: '10:30',
      court_name: 'ITAT, Lucknow',
      judge_name: 'Hon. Judicial Member P. Joshi',
      hearing_type: 'Hearing',
      status: 'upcoming',
      notes: 'Final hearing on jurisdiction under Section 148.',
    },
  ];

  const { data: insertedHearings, error: hearingsErr } = await supabase
    .from('hearings')
    .insert(hearingsSeed)
    .select();
  if (hearingsErr) throw hearingsErr;
  console.log(`Inserted ${insertedHearings.length} demo hearings.`);

  // 5. Payments (Completed, Partial, Pending, Overdue)
  const paymentsSeed = [
    {
      user_id: userId,
      case_id: caseByNo['CS/2026/001'].id,
      total_fee: 150000,
      amount_paid: 150000,
      payment_date: addDaysISO(-80),
      payment_method: 'Bank Transfer',
      status: 'paid',
      notes: 'Initial appellate retainer fee (Settled in full)',
    },
    {
      user_id: userId,
      case_id: caseByNo['CS/2026/001'].id,
      total_fee: 75000,
      amount_paid: 25000,
      payment_date: addDaysISO(-5),
      payment_method: 'UPI',
      status: 'partial',
      notes: 'Hearing appearance fee — partial installment received',
    },
    {
      user_id: userId,
      case_id: caseByNo['CS/2026/002'].id,
      total_fee: 100000,
      amount_paid: 100000,
      payment_date: addDaysISO(-55),
      payment_method: 'Cheque',
      status: 'paid',
      notes: 'Plaint drafting and filing fee',
    },
    {
      user_id: userId,
      case_id: caseByNo['CS/2026/003'].id,
      total_fee: 250000,
      amount_paid: 150000,
      payment_date: addDaysISO(-20),
      payment_method: 'Bank Transfer',
      status: 'partial',
      notes: 'Commercial suit retainer — ₹1,00,000 balance due on issues framing',
    },
    {
      user_id: userId,
      case_id: caseByNo['CS/2026/004'].id,
      total_fee: 40000,
      amount_paid: 0,
      payment_date: addDaysISO(-15),
      payment_method: 'Pending',
      status: 'overdue',
      notes: 'Evidence stage briefing & appearance fee',
    },
    {
      user_id: userId,
      case_id: caseByNo['CS/2026/005'].id,
      total_fee: 120000,
      amount_paid: 0,
      payment_date: addDaysISO(-3),
      payment_method: 'Pending',
      status: 'pending',
      notes: 'Conciliation & reply drafting invoice',
    },
    {
      user_id: userId,
      case_id: caseByNo['CS/2026/007'].id,
      total_fee: 60000,
      amount_paid: 60000,
      payment_date: addDaysISO(-130),
      payment_method: 'Cash',
      status: 'paid',
      notes: 'Final settlement and closure fee',
    },
  ];

  const { data: insertedPayments, error: paymentsErr } = await supabase
    .from('payments')
    .insert(paymentsSeed)
    .select();
  if (paymentsErr) throw paymentsErr;
  console.log(`Inserted ${insertedPayments.length} demo payment records.`);

  // 6. Upload sample documents into Supabase Storage & documents table
  const sampleDir = path.resolve(__dirname, '../../ai-engine/sample_documents');
  const sampleFiles = [
    {
      filename: 'agreement_contract.txt',
      name: 'Supply Agreement — Blue Oak vs Northstar',
      category: 'Contract',
      caseId: caseByNo['CS/2026/003'].id,
    },
    {
      filename: 'delivery_claim_notice.txt',
      name: 'Delivery Claim Legal Notice',
      category: 'Correspondence',
      caseId: caseByNo['CS/2026/003'].id,
    },
    {
      filename: 'informal_dispute_email.txt',
      name: 'Dispute Correspondence Email Trail',
      category: 'Evidence',
      caseId: caseByNo['CS/2026/003'].id,
    },
  ];

  let uploadedDocsCount = 0;
  for (const item of sampleFiles) {
    const filePath = path.join(sampleDir, item.filename);
    if (!fs.existsSync(filePath)) continue;

    const buffer = fs.readFileSync(filePath);
    const storagePath = `${userId}/${item.caseId}/${Date.now()}_${item.filename}`;
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: 'text/plain',
        upsert: true,
      });

    if (uploadErr) {
      console.warn(`Storage upload skipped for ${item.filename}:`, uploadErr.message);
      continue;
    }

    const { error: docDbErr } = await supabase.from('documents').insert({
      user_id: userId,
      case_id: item.caseId,
      document_name: item.name,
      document_type: 'TXT',
      category: item.category,
      storage_path: storagePath,
      file_size: buffer.length,
      mime_type: 'text/plain',
      upload_date: addDaysISO(-10),
      processing_status: 'uploaded',
    });

    if (!docDbErr) uploadedDocsCount += 1;
  }

  console.log(`Uploaded and indexed ${uploadedDocsCount} sample legal documents.`);
  console.log('Seed completed successfully.');
  console.log(`Demo credentials: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
