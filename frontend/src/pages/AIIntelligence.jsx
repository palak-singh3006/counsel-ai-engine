import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Download,
  Share2,
  ShieldCheck,
  Scale,
  CheckSquare,
  Square,
  Info,
  AlertTriangle,
  Award,
  Users,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { cases } from '../data/mockData';

// Simulated Agent Roles
const agentRoster = [
  {
    id: 'orchestrator',
    name: 'Orchestrator Agent',
    role: 'Procedural Strategy & Workflow Planner',
    description: 'Deconstructs matter scope, schedules pipeline agents, and monitors evidentiary integrity.',
  },
  {
    id: 'analyst',
    name: 'Document Analyst Agent',
    role: 'Fact & Statutory Citation Extraction',
    description: 'Scans pleadings, affidavits, and police reports to extract material facts and legal precedents.',
  },
  {
    id: 'timeline',
    name: 'Timeline Agent',
    role: 'Chronological Evidence Reconstruction',
    description: 'Maps disputed incidents and procedural milestones with verifiable cross-references.',
  },
  {
    id: 'action',
    name: 'Action Agent',
    role: 'Strategy & Procedural Motions',
    description: 'Formulates defense grounds, counter-affidavit strategies, and imminent filing deadlines.',
  },
  {
    id: 'reviewer',
    name: 'Reviewer Agent',
    role: 'Statutory Verification & Sanity Check',
    description: 'Cross-verifies citations, audits evidentiary contradictions, and certifies final brief.',
  },
];

const sampleDocuments = [
  {
    label: 'Criminal Appeal Brief — Verma vs State of UP (IPC 420)',
    caseId: 'CS/2024/001',
    task: 'Analyze prosecution charge sheet, extract contradictions in witness testimony, construct arrest timeline, and suggest grounds for regular bail appeal.',
    text: `BEFORE THE HON'BLE HIGH COURT OF JUDICATURE AT ALLAHABAD, LUCKNOW BENCH
CRIMINAL APPEAL NO. 412 OF 2024
IN THE MATTER OF:
Rajesh Kumar Verma ... Appellant / Accused
VERSUS
State of Uttar Pradesh & Another ... Respondents

MEMORANDUM OF APPEAL UNDER SECTION 374(2) OF CR.P.C.

1. That the Appellant was convicted by learned Sessions Judge, Lucknow vide judgment dated 10.08.2024 under Sections 420, 468, and 471 of the Indian Penal Code, sentencing him to 4 years rigorous imprisonment.
2. The genesis of the prosecution case rests upon FIR No. 234/2024 registered at P.S. Hazratganj on 15.03.2024 by complainant M/s Apex Infra on allegations of forged performance guarantees valued at Rs. 45,00,000.
3. MATERIAL DEFECT IN PROSECUTION: The alleged bank guarantee dated 12.01.2023 was never sent for forensic examination to the Central Forensic Science Laboratory (CFSL). 
4. CONTRADICTION IN TIMELINE: PW-1 (Complainant) testified that the dishonored instrument was handed over in person on 18.01.2023 at Lucknow. However, passport stamps demonstrate the Appellant was physically present in Dubai, UAE from 14.01.2023 through 24.01.2023.
5. ARREST PROCEDURAL LAPSE: Appellant was taken into custody on 22.03.2024 without service of notice under Section 41A CrPC, violating mandates laid down by the Hon'ble Supreme Court in Arnesh Kumar vs State of Bihar (2014) 8 SCC 273.`,
  },
  {
    label: 'Commercial Contract Breach — Mehta Industries vs ABC Corp',
    caseId: 'CS/2024/007',
    task: 'Identify breach of supply covenant, calculate liquidated damages claim under Section 74 Contract Act, and outline interim injunction strategy.',
    text: `COMMERCIAL ARBITRATION NOTICE & CLAIMS SUMMARY
BETWEEN: Mehta Industries Private Limited (Claimant) AND ABC Corporation LLP (Respondent)

Subject: Formal Notice of Material Breach under Master Supply Agreement dated 14.02.2022.

1. Clause 8.2 of the Supply Agreement obligates Respondent to deliver 5,000 MT of industrial alloy by 30.04.2024.
2. Respondent failed to make delivery citing Force Majeure due to local labor unrest.
3. Claimant sent formal cure notices on 05.05.2024 and 20.05.2024 with no constructive reply.
4. Consequential losses: Claimant incurred urgent substitute procurement costs amounting to Rs. 1,42,00,000 with additional line stoppage penalties of Rs. 38,50,000.
5. In accordance with Clause 14 (Dispute Resolution), claimant invokes arbitration under the Arbitration and Conciliation Act, 1996 and seeks interim preservation order under Section 9.`,
  },
];

// Structured Analysis Results conforming to the complete multi-agent pipeline schema
const analysisDatabase = {
  'CS/2024/001': {
    case_summary:
      'Appellate challenge under Section 374(2) Cr.P.C. against judgment of conviction under Sections 420, 468, and 471 IPC passed by Sessions Court, Lucknow. Primary defense rests on irrefutable passport alibi during alleged delivery date, complete absence of forensic CFSL handwriting/ink analysis on disputed Rs. 45,00,000 guarantee, and non-compliance with Section 41A CrPC pre-arrest guidelines under Arnesh Kumar.',
    parties: [
      { role: 'Appellant / Accused', name: 'Rajesh Kumar Verma', counsel: 'JK Shukla, Senior Advocate' },
      { role: 'Respondent No. 1', name: 'State of Uttar Pradesh', counsel: 'Additional Government Advocate (Criminal)' },
      { role: 'Respondent No. 2 (Complainant)', name: 'M/s Apex Infra Tech Ltd. (represented by Dir. Sunil Chawla)', counsel: 'Private Complainant Counsel' },
    ],
    legal_issues: [
      {
        statute: 'Section 374(2) Cr.P.C. read with Section 389(1) Cr.P.C.',
        issue: 'Appellate jurisdiction to suspend substantive sentence of 4 years RI pending disposal of criminal appeal.',
        significance: 'Threshold procedural prayer for immediate release on bail.'
      },
      {
        statute: 'Sections 420, 468, 471 Indian Penal Code, 1860',
        issue: 'Whether conviction for forgery and cheating can stand in total absence of CFSL expert opinion on disputed signature.',
        significance: 'Core substantive ground; failure to prove execution of forged instrument beyond reasonable doubt.'
      },
      {
        statute: 'Section 41A Cr.P.C. & Arnesh Kumar vs State of Bihar (2014) 8 SCC 273',
        issue: 'Arrest effected without notice under Section 41A where maximum punishment prescribed is 7 years.',
        significance: 'Renders arrest unlawful and vitiates investigative bonafides.'
      },
    ],
    material_facts: [
      { id: 'F-01', fact: 'Conviction recorded by Sessions Court Lucknow for 4 years RI under Sections 420/468/471 IPC.', source: 'Para 1 of Trial Court Judgment', confidence: 'Certified' },
      { id: 'F-02', fact: 'FIR No. 234/2024 lodged on 15.03.2024 at P.S. Hazratganj on complaint of M/s Apex Infra.', source: 'FIR Copy & General Diary Entry', confidence: 'Certified' },
      { id: 'F-03', fact: 'Disputed performance guarantee dated 12.01.2023 was never submitted for CFSL handwriting or ink analysis.', source: 'PW-3 Investigating Officer Cross-Exam', confidence: 'High Impact' },
      { id: 'F-04', fact: 'Complainant testified physical instrument delivery occurred in Lucknow on 18.01.2023.', source: 'PW-1 Chief Examination, Pg 14', confidence: 'Contradiction' },
      { id: 'F-05', fact: 'Appellant immigration records confirm departure to Dubai on 14.01.2023 and return on 24.01.2023.', source: 'Passport Annexure A-4 & Air Ticket Rec', confidence: 'Irrefutable Alibi' },
      { id: 'F-06', fact: 'Appellant was arrested on 22.03.2024 without issuance of mandatory 41A CrPC pre-arrest notice.', source: 'Case Diary Vol II / Arrest Memo', confidence: 'Procedural Violation' },
      { id: 'F-07', fact: 'No recovery of pecuniary proceeds or forged stamp papers from Appellant’s residence or office.', source: 'Search & Seizure Panchnama', confidence: 'Certified' },
    ],
    timeline: [
      { date: '12 Jan 2023', event: 'Purported date of forged bank guarantee execution.', impact: 'Prosecution milestone' },
      { date: '14 Jan 2023', event: 'Appellant departs India from IGI Airport New Delhi for Dubai (Flight EK-511).', impact: 'Defense Alibi Anchor' },
      { date: '18 Jan 2023', event: 'Alleged physical meeting in Lucknow where PW-1 claims Appellant handed over instrument.', impact: 'Direct Material Contradiction' },
      { date: '24 Jan 2023', event: 'Appellant returns to New Delhi immigration checkpoint.', impact: 'Corroborates Absence' },
      { date: '15 Mar 2024', event: 'FIR No. 234/2024 lodged after an unexplained 14-month delay.', impact: 'Laches & Afterthought Defense' },
      { date: '22 Mar 2024', event: 'Arrest effected at Lucknow without compliance with Section 41A CrPC.', impact: 'Statutory Nullity' },
      { date: '10 Aug 2024', event: 'Trial Court judgment convicting Appellant without forensic report.', impact: 'Target of Appeal' },
    ],
    evidence: [
      { item: 'Passport & Immigration Records (Dubai travel 14.01.2023–24.01.2023)', type: 'Documentary Alibi', status: 'Verified (Annexure A-4)' },
      { item: 'Disputed Performance Guarantee (Rs. 45,00,000)', type: 'Forensic Instrument', status: 'Unexamined by CFSL (Prosecution Defect)' },
      { item: 'Deposition of PW-1 Sunil Chawla', type: 'Testimonial', status: 'Contradicted by Immigration Timeline' },
      { item: 'Investigating Officer Case Diary & Arrest Memo', type: 'Procedural Record', status: 'Demonstrates Section 41A Non-Compliance' },
    ],
    strategy_considerations: [
      { title: 'Sentence Suspension via Alibi', detail: 'Primary push under Section 389(1) CrPC: Demonstrate high probability of acquittal on basis of documentary alibi to secure immediate bail.' },
      { title: 'Absence of CFSL Report', detail: 'Argue trial court erred in convicting under Section 468/471 IPC without independent handwriting expert testimony (AIR 2008 SC 1541).' },
      { title: 'Laches in FIR Registration', detail: 'Highlight unexplained 14-month delay between alleged handover and lodging of FIR as strong evidence of commercial dispute colored as crime.' },
    ],
    recommended_actions: [
      { title: 'File Application under Section 389(1) CrPC for Suspension of Sentence', priority: 'High', deadline: 'Immediate', detail: 'Seek immediate bail pending appeal on grounds of unimpeachable passport alibi and absence of forensic corroboration.' },
      { title: 'Move Application under Section 391 CrPC for Additional Evidence', priority: 'High', deadline: 'Before Admission', detail: 'Formally place Bureau of Immigration travel records on record as appellate court evidence.' },
      { title: 'Raise Arnesh Kumar Contempt Ground', priority: 'Medium', deadline: 'Final Hearing', detail: 'Document police infraction of Section 41A CrPC in written submissions to impugn investigation bonafides.' },
      { title: 'Serve Advance Copy on Government Advocate (Criminal)', priority: 'High', deadline: 'Within 24 Hours', detail: 'Fulfill advance service compliance at High Court registry reporting desk.' },
    ],
    missing_information: [
      { item: 'CFSL Forensic Analysis', description: 'No handwriting or ink aging report was commissioned by the IO for the disputed bank guarantee.', impact: 'Prosecution lacuna; fatal to forgery charges under Section 468 IPC.' },
      { item: 'Electronic Flight Manifest Section 65B Certificate', description: 'While physical passport stamps are annexed, digital boarding records require Section 65B Certificate under Indian Evidence Act.', impact: 'Required for evidentiary admissibility of online printouts.' },
      { item: 'Explanation for 14-Month FIR Delay', description: 'Prosecution record offers zero contemporaneous email or legal notices explaining delay from Jan 2023 to Mar 2024.', impact: 'Supports defense plea of afterthought commercial pressure.' },
    ],
    review_flags: [
      { flag: 'Limitation Window', status: 'Compliant', note: 'Criminal appeal instituted within 60 days of Trial Court conviction judgment.' },
      { flag: 'Certified Copies', status: 'Annexed', note: 'Certified copy of trial court order sheet and judgment attached.' },
      { flag: 'Advocate Welfare Stamp', status: 'Verified', note: 'Vakalatnama stamped with required Welfare Fund adhesive stamps.' },
      { flag: 'Evidence Act S. 65B', status: 'Action Required', note: 'Affidavit under Section 65B needed for electronic travel itinerary prior to argument.' },
    ],
    confidence_or_uncertainty: {
      overall_confidence: 'High (88%)',
      verdict: 'Strong prima facie grounds for bail suspension under Section 389 CrPC; high likelihood of remand or acquittal.',
      key_vulnerability: 'Trial court made adverse inferences regarding business correspondence that must be rebutted during oral arguments.',
    },
    source_references: [
      'Sections 374(2), 389, 391, 41A of Code of Criminal Procedure, 1973',
      'Sections 420, 468, 471 of Indian Penal Code, 1860',
      'Arnesh Kumar vs State of Bihar (2014) 8 SCC 273',
      'State of Haryana vs Bhajan Lal 1992 Supp (1) SCC 335',
      'Sessions Trial No. 188/2024, Court of Sessions Judge, Lucknow',
    ],
  },
  'CS/2024/007': {
    case_summary:
      'Commercial contract dispute under Master Supply Agreement dated 14.02.2022. Respondent ABC Corp failed to deliver 5,000 MT of industrial alloy by 30.04.2024, improperly claiming Force Majeure due to local labor unrest. Claimant incurred Rs. 1,42,00,000 in substitute procurement and Rs. 38,50,000 in plant stoppage penalties. Seeking urgent interim protection under Section 9 of the Arbitration and Conciliation Act, 1996 and invocation of arbitral tribunal under Section 11.',
    parties: [
      { role: 'Claimant', name: 'Mehta Industries Private Limited', counsel: 'JK Shukla & Associates' },
      { role: 'Respondent', name: 'ABC Corporation LLP', counsel: 'Legal Cell, ABC Corp' },
    ],
    legal_issues: [
      {
        statute: 'Section 9 of Arbitration and Conciliation Act, 1996',
        issue: 'Entitlement to pre-arbitral interim injunction directing deposit or furnishing of bank guarantee against liquidated damages.',
        significance: 'Critical to prevent asset dissipation while arbitral tribunal is being constituted.'
      },
      {
        statute: 'Section 73 & 74 Indian Contract Act, 1872',
        issue: 'Whether labor strike qualifies as Force Majeure excusing non-performance under Clause 8.2 of Agreement.',
        significance: 'Judicial precedent (Energy Watchdog vs CERC) restricts Force Majeure to events entirely beyond reasonable control.'
      },
      {
        statute: 'Section 11(6) of Arbitration and Conciliation Act, 1996',
        issue: 'Appointment of sole arbitrator upon failure of parties to concur within 30-day statutory notice period.',
        significance: 'Statutory fallback to High Court for appointment of independent sole arbitrator.'
      },
    ],
    material_facts: [
      { id: 'F-01', fact: 'Master Supply Agreement executed on 14.02.2022 containing Clause 14 Arbitration mechanism.', source: 'Master Supply Agreement Ex-C1', confidence: 'Certified' },
      { id: 'F-02', fact: 'Respondent failed to supply agreed 5,000 MT alloy by 30.04.2024 deadline.', source: 'Delivery Schedule Annexure B', confidence: 'Certified' },
      { id: 'F-03', fact: 'Respondent claimed Force Majeure on 28.04.2024 citing internal plant wage labor strikes.', source: 'Respondent Letter dated 28.04.2024', confidence: 'Legally Untenable' },
      { id: 'F-04', fact: 'Claimant issued 15-day cure notices on 05.05.2024 and 20.05.2024 with zero delivery performance.', source: 'Cure Notice Dispatch Slips', confidence: 'Certified' },
      { id: 'F-05', fact: 'Urgent substitute procurement executed from third-party vendor at Rs. 1,42,00,000 premium.', source: 'Invoices & GST Challans Annexure D', confidence: 'Quantified Loss' },
      { id: 'F-06', fact: 'Production line downtime penalties of Rs. 38,50,000 debited by downstream automotive buyers.', source: 'Debit Notes & Audit Statements', confidence: 'Audited' },
    ],
    timeline: [
      { date: '14 Feb 2022', event: 'Master Supply Agreement executed with arbitration covenant.', impact: 'Contractual Baseline' },
      { date: '15 Jan 2024', event: 'Purchase Order No. MI-882 placed for 5,000 MT industrial alloy.', impact: 'Performance Trigger' },
      { date: '28 Apr 2024', event: 'Respondent sends unilateral Force Majeure communication.', impact: 'Anticipatory Breach' },
      { date: '30 Apr 2024', event: 'Contractual delivery date lapses without shipment.', impact: 'Material Breach Occurs' },
      { date: '05 May 2024', event: 'Claimant issues formal 15-day default cure notice.', impact: 'Cure Period Begins' },
      { date: '20 May 2024', event: 'Second cure demand and reservation of damages issued.', impact: 'Exhaustion of Amicable Steps' },
      { date: '12 Jun 2024', event: 'Formal Section 21 Notice Invoking Arbitration dispatched.', impact: 'Arbitration Commences' },
    ],
    evidence: [
      { item: 'Master Supply Agreement dated 14.02.2022', type: 'Contractual Document', status: 'Executed & Stamped' },
      { item: 'Substitute Purchase Orders & GST Invoices', type: 'Financial Evidence', status: 'Verified Ledger Entries' },
      { item: 'Downstream Customer Penalty Debit Notes', type: 'Consequential Damage', status: 'Reconciled (Rs. 38,50,000)' },
      { item: 'Notice Invoking Arbitration under Section 21', type: 'Statutory Notice', status: 'Served via Speed Post & Email' },
    ],
    strategy_considerations: [
      { title: 'Rebut Force Majeure Defense', detail: 'Rely on Energy Watchdog (2017) 14 SCC 80: Ordinary labor disputes or wage renegotiations do not constitute insurmountable Force Majeure excusing commercial performance.' },
      { title: 'Seek Pre-Arbitral Security under Section 9', detail: 'Move Commercial Court / High Court for direction to deposit 50% of claimed damages or furnish bank guarantee to prevent balance-sheet depletion.' },
      { title: 'Expedited Section 11 Filing', detail: 'Immediately upon lapse of 30 days from Section 21 notice, approach High Court for appointment of retired High Court judge as sole arbitrator.' },
    ],
    recommended_actions: [
      { title: 'File Section 9 Petition for Interim Security Deposit', priority: 'High', deadline: 'Within 7 Days', detail: 'Approach High Court Commercial Division seeking order directing Respondent to furnish security of Rs. 1.80 Crores.' },
      { title: 'Draft Section 11(6) Application for Arbitrator Appointment', priority: 'High', deadline: 'Upon Notice Lapse', detail: 'Prepare High Court petition nominating arbitral panel upon Respondent failure to agree on arbitrator.' },
      { title: 'Collate Expert Valuation of Secondary Downtime Loss', priority: 'Medium', deadline: 'Before Claim Statement', detail: 'Obtain statutory auditor certification for downstream factory stoppage overheads.' },
    ],
    missing_information: [
      { item: 'Respondent Financial Solvency Audit', description: 'Latest audited financial filings of ABC Corp LLP not yet pulled from MCA registry.', impact: 'Necessary to evaluate risk of asset stripping during Section 9 hearing.' },
      { item: 'Vendor Communication Records', description: 'WhatsApp and SMS transcripts between logistics heads regarding labor unrest need Section 65B certification.', impact: 'Required to disprove sudden unforeseeable nature of strike.' },
    ],
    review_flags: [
      { flag: 'Arbitration Clause Enforceability', status: 'Verified', note: 'Seat defined as Lucknow; sole arbitrator mechanism validly agreed.' },
      { flag: 'Stamp Duty Ad Valorem', status: 'Compliant', note: 'Master Agreement adequately stamped as per UP Stamp Act.' },
      { flag: 'Notice Under Section 21', status: 'Served', note: 'Postal tracking slips confirm delivery on 15.06.2024.' },
    ],
    confidence_or_uncertainty: {
      overall_confidence: 'Very High (92%)',
      verdict: 'Clear-cut commercial breach; Force Majeure clause does not cover preventable internal labor wage disputes.',
      key_vulnerability: 'Downstream consequential damage claims (Rs. 38.5L) require strict proof under Section 73 Contract Act.',
    },
    source_references: [
      'Sections 9, 11, and 21 of Arbitration and Conciliation Act, 1996',
      'Sections 73 and 74 of Indian Contract Act, 1872',
      'Energy Watchdog vs Central Electricity Regulatory Commission (2017) 14 SCC 80',
      'Commercial Court Act, 2015 (Pre-Institution Mediation & Section 9 jurisdiction)',
    ],
  },
};

export default function AIIntelligence() {
  const toast = useToast();
  const location = useLocation();

  // Navigation key sync for incoming state from Matters or Dashboard
  const [selectedCaseId, setSelectedCaseId] = useState(
    () => location.state?.selectedCaseId || 'CS/2024/001'
  );
  const [prevNavKey, setPrevNavKey] = useState(location.key);

  const initialSampleIndex =
    location.state?.selectedCaseId === 'CS/2024/007' ? 1 : 0;

  const [taskPrompt, setTaskPrompt] = useState(
    sampleDocuments[initialSampleIndex].task
  );
  const [documentContent, setDocumentContent] = useState(
    sampleDocuments[initialSampleIndex].text
  );
  const [activeTab, setActiveTab] = useState('summary');

  // Workflow states: 'idle' | 'running' | 'completed'
  const [workflowState, setWorkflowState] = useState('idle');
  const [agentProgress, setAgentProgress] = useState({
    orchestrator: 'idle',
    analyst: 'idle',
    timeline: 'idle',
    action: 'idle',
    reviewer: 'idle',
  });

  const [activeAgentIndex, setActiveAgentIndex] = useState(-1);
  const [checkedActions, setCheckedActions] = useState({});

  // Advocate Review / Certification State
  const [reviewStatus, setReviewStatus] = useState('pending_advocate_review');
  const [certifiedAt, setCertifiedAt] = useState(null);

  // Sync state if user navigates again with new router state
  if (location.key !== prevNavKey) {
    setPrevNavKey(location.key);
    if (location.state?.selectedCaseId) {
      const incomingId = location.state.selectedCaseId;
      setSelectedCaseId(incomingId);
      const matchedIdx = incomingId === 'CS/2024/007' ? 1 : 0;
      setTaskPrompt(sampleDocuments[matchedIdx].task);
      setDocumentContent(sampleDocuments[matchedIdx].text);
      setWorkflowState('idle');
      setAgentProgress({
        orchestrator: 'idle',
        analyst: 'idle',
        timeline: 'idle',
        action: 'idle',
        reviewer: 'idle',
      });
      setActiveAgentIndex(-1);
      setReviewStatus('pending_advocate_review');
    }
  }

  // Simulated timer ref
  const timerRef = useRef(null);

  const loadSample = (index) => {
    const s = sampleDocuments[index];
    setSelectedCaseId(s.caseId);
    setTaskPrompt(s.task);
    setDocumentContent(s.text);
    resetAnalysis();
    toast(`Loaded sample document: "${s.label}"`, 'info');
  };

  const resetAnalysis = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setWorkflowState('idle');
    setAgentProgress({
      orchestrator: 'idle',
      analyst: 'idle',
      timeline: 'idle',
      action: 'idle',
      reviewer: 'idle',
    });
    setActiveAgentIndex(-1);
    setReviewStatus('pending_advocate_review');
    setCertifiedAt(null);
  };

  const startAnalysis = () => {
    if (!documentContent.trim()) {
      toast('Please supply document text or attach a file', 'error');
      return;
    }

    setWorkflowState('running');
    setActiveAgentIndex(0);
    setReviewStatus('pending_advocate_review');
    setCertifiedAt(null);

    const steps = ['orchestrator', 'analyst', 'timeline', 'action', 'reviewer'];

    setAgentProgress({
      orchestrator: 'processing',
      analyst: 'idle',
      timeline: 'idle',
      action: 'idle',
      reviewer: 'idle',
    });

    const runStep = (idx) => {
      if (idx >= steps.length) {
        setWorkflowState('completed');
        setActiveAgentIndex(-1);
        toast('Agentic Intelligence Pipeline completed synthesis', 'success');
        return;
      }

      const agentKey = steps[idx];
      setActiveAgentIndex(idx);

      setAgentProgress((prev) => ({
        ...prev,
        [agentKey]: 'processing',
      }));

      timerRef.current = setTimeout(() => {
        setAgentProgress((prev) => ({
          ...prev,
          [agentKey]: 'done',
        }));
        runStep(idx + 1);
      }, 1000);
    };

    timerRef.current = setTimeout(() => {
      setAgentProgress((prev) => ({ ...prev, orchestrator: 'done' }));
      runStep(1);
    }, 900);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const toggleAction = (idx) => {
    setCheckedActions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleApproveBrief = () => {
    setReviewStatus('approved_by_advocate');
    setCertifiedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    toast('Brief marked as certified in session state (frontend demonstration)', 'success');
  };

  const handleReopenReview = () => {
    setReviewStatus('pending_advocate_review');
    setCertifiedAt(null);
    toast('Brief returned to pending review status (frontend demonstration)', 'info');
  };

  const handleExportBrief = () => {
    toast('Generating Case Intelligence Dossier (PDF/Docx sync in progress)', 'info');
  };

  const handleShareFindings = () => {
    toast('Copied secure workspace brief link to clipboard', 'success');
  };

  // Resolve structured findings based on current selectedCaseId
  const findings = analysisDatabase[selectedCaseId] || analysisDatabase['CS/2024/001'];

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-5)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title">AI Case Intelligence</h1>
            <span
              style={{
                fontSize: '0.643rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '3px',
                background: 'var(--brass-bg)',
                color: 'var(--brass-muted)',
                border: '1px solid rgba(184, 150, 62, 0.2)',
              }}
            >
              Demo Workbench
            </span>
          </div>
          <p className="page-subtitle">
            Multi-agent legal reasoning, evidentiary forensics, and case brief synthesis for advocate review
          </p>
        </div>

        <div className="page-actions">
          {workflowState === 'completed' && (
            <>
              <button className="btn btn-secondary" onClick={handleShareFindings}>
                <Share2 size={14} /> Share Brief
              </button>
              <button className="btn btn-primary" onClick={handleExportBrief}>
                <Download size={14} /> Export Dossier
              </button>
            </>
          )}
        </div>
      </div>

      {/* Demo Notice Banner */}
      <div
        style={{
          background: 'rgba(184, 150, 62, 0.07)',
          border: '1px solid rgba(184, 150, 62, 0.25)',
          borderRadius: '6px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Info size={16} style={{ color: 'var(--brass-muted)', flexShrink: 0 }} />
          <div style={{ fontSize: '0.857rem', color: 'var(--text-secondary)' }}>
            <strong>Demonstration Sandbox:</strong> Simulated multi-agent analysis for illustrative case studies. All outputs, citations, and metrics are fictional demo models and do not constitute actual legal advice.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {sampleDocuments.map((s, idx) => (
            <button
              key={idx}
              className="btn btn-secondary btn-sm"
              onClick={() => loadSample(idx)}
              style={{ fontSize: '0.75rem', padding: '3px 8px' }}
            >
              Load Sample {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workbench Grid: 38% Left Panel / 62% Right Panel */}
      <div className="ai-workbench-grid">
        {/* Left Column: Input & Configuration */}
        <div className="flex-col gap-4">
          {/* Input Document Container */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Evidentiary Record / Pleadings</span>
              <span className="text-caption">Pleading / Brief Input</span>
            </div>
            <div className="card-body">
              {/* Matter Selection */}
              <div className="form-group">
                <label className="form-label">Associate with Matter</label>
                <select
                  className="form-input"
                  value={selectedCaseId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedCaseId(id);
                    if (id === 'CS/2024/007') {
                      loadSample(1);
                    } else if (id === 'CS/2024/001') {
                      loadSample(0);
                    }
                  }}
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Directive */}
              <div className="form-group">
                <label className="form-label">Analysis Objective & Strategy Instructions</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Extract material facts, identify statutory non-compliances, and build chronology..."
                  value={taskPrompt}
                  onChange={(e) => setTaskPrompt(e.target.value)}
                />
              </div>

              {/* Document Text Area */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Document Text / Record</label>
                  <span className="text-caption">{documentContent.length} chars</span>
                </div>
                <textarea
                  className="form-textarea"
                  rows={8}
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.786rem',
                    lineHeight: '1.5',
                    background: 'var(--stone-bg)',
                  }}
                  value={documentContent}
                  onChange={(e) => setDocumentContent(e.target.value)}
                  placeholder="Paste charge sheet, judgment, or contract clauses here..."
                />
              </div>

              {/* Trigger Button */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  className="btn btn-accent w-full"
                  style={{ justifyContent: 'center', padding: '10px' }}
                  disabled={workflowState === 'running'}
                  onClick={startAnalysis}
                >
                  {workflowState === 'running' ? (
                    <>
                      <Clock size={15} className="animate-spin" /> Orchestrating Pipeline...
                    </>
                  ) : workflowState === 'completed' ? (
                    <>
                      <RotateCcw size={15} /> Re-run Intelligence Analysis
                    </>
                  ) : (
                    <>
                      <Play size={15} /> Execute Agent Analysis
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Autonomous Agent Workflow Status Panel */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Agentic Workflow Topology</span>
              <span className="text-caption">5 Active Agents</span>
            </div>
            <div className="card-body" style={{ padding: '12px 16px' }}>
              <div className="flex-col gap-3">
                {agentRoster.map((ag, idx) => {
                  const state = agentProgress[ag.id];
                  const isActive = activeAgentIndex === idx;

                  return (
                    <div
                      key={ag.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        background: isActive
                          ? 'var(--brass-bg)'
                          : state === 'done'
                          ? 'rgba(107, 143, 113, 0.05)'
                          : 'var(--stone-bg)',
                        border: `1px solid ${
                          isActive
                            ? 'var(--brass)'
                            : state === 'done'
                            ? 'rgba(107, 143, 113, 0.2)'
                            : 'var(--border-subtle)'
                        }`,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {state === 'done' ? (
                            <CheckCircle2 size={16} style={{ color: 'var(--sage-text)' }} />
                          ) : state === 'processing' ? (
                            <Clock size={16} style={{ color: 'var(--brass-muted)' }} />
                          ) : (
                            <div
                              style={{
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                border: '1.5px solid var(--stone-light)',
                              }}
                            />
                          )}
                          <div style={{ fontSize: '0.857rem', fontWeight: 600 }}>{ag.name}</div>
                        </div>

                        <span
                          style={{
                            fontSize: '0.643rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            background:
                              state === 'done'
                                ? 'var(--sage-bg)'
                                : state === 'processing'
                                ? 'var(--brass-bg)'
                                : 'transparent',
                            color:
                              state === 'done'
                                ? 'var(--sage-text)'
                                : state === 'processing'
                                ? 'var(--brass-muted)'
                                : 'var(--text-tertiary)',
                          }}
                        >
                          {state === 'done' ? 'Completed' : state === 'processing' ? 'Synthesizing...' : 'Queued'}
                        </span>
                      </div>
                      <div className="text-caption" style={{ marginTop: '4px', marginLeft: '24px' }}>
                        {ag.role}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Structured Findings & Case Intelligence Inspector */}
        <div>
          {workflowState === 'idle' ? (
            /* Standby State */
            <div
              className="card"
              style={{
                minHeight: '620px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '40px',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--brass-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brass)',
                  marginBottom: '16px',
                }}
              >
                <Brain size={28} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '8px' }}>
                Legal Intelligence Workbench
              </h3>
              <p className="text-body" style={{ maxWidth: '460px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Select a sample document above or paste evidentiary records on the left, then click <strong>Execute Agent Analysis</strong> to trigger the multi-agent legal reasoning chain.
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  maxWidth: '560px',
                  textAlign: 'left',
                }}
              >
                <div style={{ padding: '12px', background: 'var(--stone-bg)', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.786rem', color: 'var(--text-primary)' }}>
                    1. Fact & Law Extraction
                  </div>
                  <div className="text-caption" style={{ marginTop: '2px' }}>
                    Identifies missing forensic certificates & contradictions.
                  </div>
                </div>
                <div style={{ padding: '12px', background: 'var(--stone-bg)', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.786rem', color: 'var(--text-primary)' }}>
                    2. Chronology Map
                  </div>
                  <div className="text-caption" style={{ marginTop: '2px' }}>
                    Surfaces alibi timestamps & procedural laches automatically.
                  </div>
                </div>
                <div style={{ padding: '12px', background: 'var(--stone-bg)', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.786rem', color: 'var(--text-primary)' }}>
                    3. Advocate Sign-Off
                  </div>
                  <div className="text-caption" style={{ marginTop: '2px' }}>
                    Human-in-the-loop review, certification, and export.
                  </div>
                </div>
              </div>
            </div>
          ) : workflowState === 'running' ? (
            /* Live Pipeline Execution State */
            <div
              className="card"
              style={{
                minHeight: '620px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--midnight)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brass-light)',
                  marginBottom: '20px',
                }}
              >
                <Scale size={32} className="animate-pulse" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: '8px' }}>
                {activeAgentIndex >= 0 ? agentRoster[activeAgentIndex].name : 'Synthesizing Pipeline'}
              </h3>
              <p className="text-body" style={{ color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: '24px' }}>
                {activeAgentIndex >= 0
                  ? agentRoster[activeAgentIndex].description
                  : 'Validating legal precedents and auditing procedural record...'}
              </p>
              <div style={{ width: '240px', height: '4px', background: 'var(--stone-border)', borderRadius: '2px', overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', background: 'var(--brass)' }}
                  animate={{
                    width: `${((activeAgentIndex + 1) / agentRoster.length) * 100}%`,
                  }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          ) : (
            /* Completed Analysis Results Panel */
            <div className="card" style={{ minHeight: '620px' }}>
              {/* Advocate Review / Certification Header Bar */}
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  background:
                    reviewStatus === 'approved_by_advocate'
                      ? 'rgba(107, 143, 113, 0.08)'
                      : 'rgba(184, 150, 62, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {reviewStatus === 'approved_by_advocate' ? (
                    <Award size={20} style={{ color: 'var(--sage-text)', flexShrink: 0 }} />
                  ) : (
                    <AlertTriangle size={20} style={{ color: 'var(--brass-muted)', flexShrink: 0 }} />
                  )}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.688rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          padding: '2px 8px',
                          borderRadius: '3px',
                          background:
                            reviewStatus === 'approved_by_advocate'
                              ? 'var(--sage-bg)'
                              : 'var(--brass-bg)',
                          color:
                            reviewStatus === 'approved_by_advocate'
                              ? 'var(--sage-text)'
                              : 'var(--brass-muted)',
                        }}
                      >
                        {reviewStatus === 'approved_by_advocate'
                          ? 'Certified by Advocate'
                          : 'Pending Advocate Review'}
                      </span>
                      {certifiedAt && (
                        <span className="text-caption">Certified today at {certifiedAt}</span>
                      )}
                    </div>
                    <div className="text-caption" style={{ marginTop: '2px', color: 'var(--text-secondary)' }}>
                      {reviewStatus === 'approved_by_advocate'
                        ? 'Simulated Gate Passed: Marked as certified for demonstration purposes under signature of JK Shukla, Senior Advocate (not persisted to backend).'
                        : 'Simulated Review Gate: Human-in-the-loop review required before brief can be marked as certified in this demo.'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {reviewStatus === 'approved_by_advocate' ? (
                    <button className="btn btn-secondary btn-sm" onClick={handleReopenReview}>
                      Reopen for Revision
                    </button>
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={handleApproveBrief}>
                      <ShieldCheck size={14} /> Approve & Certify Brief
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="tabs" style={{ padding: '0 16px', background: 'var(--stone-bg)', overflowX: 'auto' }}>
                <button
                  className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
                  onClick={() => setActiveTab('summary')}
                >
                  Summary & Parties
                </button>
                <button
                  className={`tab ${activeTab === 'facts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('facts')}
                >
                  Material Facts ({findings.material_facts.length})
                </button>
                <button
                  className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
                  onClick={() => setActiveTab('timeline')}
                >
                  Chronology
                </button>
                <button
                  className={`tab ${activeTab === 'strategy' ? 'active' : ''}`}
                  onClick={() => setActiveTab('strategy')}
                >
                  Strategy & Issues ({findings.legal_issues.length})
                </button>
                <button
                  className={`tab ${activeTab === 'actions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('actions')}
                >
                  Recommended Actions ({findings.recommended_actions.length})
                </button>
                <button
                  className={`tab ${activeTab === 'review' ? 'active' : ''}`}
                  onClick={() => setActiveTab('review')}
                >
                  Audit & Missing Info ({findings.missing_information.length})
                </button>
              </div>

              <div className="card-body">
                {/* TAB 1: Summary & Parties */}
                {activeTab === 'summary' && (
                  <div>
                    {/* Case Summary Card */}
                    <div
                      style={{
                        padding: '16px',
                        background: 'var(--stone-bg)',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        marginBottom: '20px',
                      }}
                    >
                      <div className="text-label" style={{ marginBottom: '6px' }}>
                        Executive Case Summary
                      </div>
                      <p className="text-body" style={{ color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                        {findings.case_summary}
                      </p>
                    </div>

                    {/* Parties Section */}
                    <div style={{ marginBottom: '20px' }}>
                      <div className="text-label" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} /> Identified Parties to Matter
                      </div>
                      <div className="flex-col gap-2">
                        {findings.parties.map((p, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '10px 14px',
                              background: '#ffffff',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '6px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.857rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {p.name}
                              </div>
                              <div className="text-caption" style={{ color: 'var(--text-secondary)' }}>
                                Represented by: {p.counsel}
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: '0.643rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                padding: '2px 8px',
                                borderRadius: '3px',
                                background: 'var(--stone-bg)',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {p.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Evidentiary Exhibits List */}
                    <div>
                      <div className="text-label" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={14} /> Evidentiary Exhibits Catalog
                      </div>
                      <div className="flex-col gap-2">
                        {findings.evidence.map((ev, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '10px 14px',
                              background: '#ffffff',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '6px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.857rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                {ev.item}
                              </div>
                              <div className="text-caption" style={{ color: 'var(--text-secondary)' }}>
                                Type: {ev.type}
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: '0.643rem',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '3px',
                                background: ev.status.includes('Defect')
                                  ? 'var(--terracotta-bg)'
                                  : 'var(--sage-bg)',
                                color: ev.status.includes('Defect')
                                  ? 'var(--terracotta-text)'
                                  : 'var(--sage-text)',
                              }}
                            >
                              {ev.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Material Facts */}
                {activeTab === 'facts' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div className="text-label">Evidentiary Facts Extracted from Record</div>
                      <span className="text-caption">Cross-referenced against trial testimonies</span>
                    </div>

                    <div className="flex-col gap-3">
                      {findings.material_facts.map((f) => (
                        <div
                          key={f.id}
                          style={{
                            padding: '14px',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '6px',
                            background:
                              f.confidence === 'Contradiction' || f.confidence === 'Legally Untenable'
                                ? 'rgba(196, 105, 74, 0.04)'
                                : f.confidence === 'Irrefutable Alibi'
                                ? 'rgba(184, 150, 62, 0.04)'
                                : '#ffffff',
                            borderLeft:
                              f.confidence === 'Contradiction' || f.confidence === 'Legally Untenable'
                                ? '3px solid var(--terracotta)'
                                : f.confidence === 'Irrefutable Alibi'
                                ? '3px solid var(--brass)'
                                : '3px solid var(--sage)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: '8px' }}>
                            <div style={{ fontSize: '0.929rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                              {f.fact}
                            </div>
                            <span
                              style={{
                                fontSize: '0.643rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                padding: '2px 8px',
                                borderRadius: '3px',
                                whiteSpace: 'nowrap',
                                background:
                                  f.confidence === 'Contradiction' || f.confidence === 'Legally Untenable'
                                    ? 'var(--terracotta-bg)'
                                    : f.confidence === 'Irrefutable Alibi'
                                    ? 'var(--brass-bg)'
                                    : 'var(--sage-bg)',
                                color:
                                  f.confidence === 'Contradiction' || f.confidence === 'Legally Untenable'
                                    ? 'var(--terracotta-text)'
                                    : f.confidence === 'Irrefutable Alibi'
                                    ? 'var(--brass-muted)'
                                    : 'var(--sage-text)',
                              }}
                            >
                              {f.confidence}
                            </span>
                          </div>
                          <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
                            Source: <em>{f.source}</em>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: Chronological Timeline */}
                {activeTab === 'timeline' && (
                  <div>
                    <div className="text-label" style={{ marginBottom: '16px' }}>
                      Reconstructed Chronological Sequence of Disputed Incidents
                    </div>

                    <div style={{ position: 'relative', paddingLeft: '24px' }}>
                      {/* Vertical Connecting Line */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '7px',
                          top: '8px',
                          bottom: '8px',
                          width: '2px',
                          background: 'var(--border)',
                        }}
                      />

                      <div className="flex-col gap-6">
                        {findings.timeline.map((item, idx) => (
                          <div key={idx} style={{ position: 'relative' }}>
                            {/* Dot on line */}
                            <div
                              style={{
                                position: 'absolute',
                                left: '-24px',
                                top: '4px',
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                background:
                                  idx === 2
                                    ? 'var(--terracotta)'
                                    : idx === 1
                                    ? 'var(--brass)'
                                    : 'var(--midnight)',
                                border: '3px solid #ffffff',
                                boxShadow: '0 0 0 1px var(--border)',
                              }}
                            />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                <span style={{ fontSize: '0.857rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {item.date}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.643rem',
                                    fontWeight: 500,
                                    padding: '1px 6px',
                                    borderRadius: '3px',
                                    background: 'var(--stone-bg)',
                                    color: 'var(--text-secondary)',
                                  }}
                                >
                                  {item.impact}
                                </span>
                              </div>
                              <div className="text-small" style={{ color: 'var(--text-secondary)' }}>
                                {item.event}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: Strategy & Issues */}
                {activeTab === 'strategy' && (
                  <div>
                    {/* Legal Issues */}
                    <div style={{ marginBottom: '24px' }}>
                      <div className="text-label" style={{ marginBottom: '12px' }}>
                        Statutory Provisions & Points of Law
                      </div>
                      <div className="flex-col gap-3">
                        {findings.legal_issues.map((issue, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '12px 16px',
                              background: '#ffffff',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '6px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <Scale size={14} style={{ color: 'var(--brass)' }} />
                              <span style={{ fontWeight: 600, fontSize: '0.857rem', color: 'var(--text-primary)' }}>
                                {issue.statute}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.857rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                              {issue.issue}
                            </div>
                            <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
                              Strategic Impact: {issue.significance}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Strategic Considerations */}
                    <div>
                      <div className="text-label" style={{ marginBottom: '12px' }}>
                        Counsel Strategy & Precedential Framework
                      </div>
                      <div className="flex-col gap-3">
                        {findings.strategy_considerations.map((strat, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '12px 16px',
                              background: 'var(--stone-bg)',
                              borderRadius: '6px',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            <div style={{ fontWeight: 600, fontSize: '0.857rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                              {strat.title}
                            </div>
                            <div className="text-caption" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                              {strat.detail}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: Recommended Actions */}
                {activeTab === 'actions' && (
                  <div>
                    <div className="text-label" style={{ marginBottom: '16px' }}>
                      Strategic Actions & Procedural Applications Recommended
                    </div>

                    <div className="flex-col gap-3">
                      {findings.recommended_actions.map((act, idx) => {
                        const isDone = !!checkedActions[idx];
                        return (
                          <div
                            key={idx}
                            role="checkbox"
                            aria-checked={isDone}
                            tabIndex={0}
                            onClick={() => toggleAction(idx)}
                            onKeyDown={(e) => {
                              if (e.key === ' ' || e.key === 'Enter') {
                                e.preventDefault();
                                toggleAction(idx);
                              }
                            }}
                            style={{
                              padding: '14px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-subtle)',
                              background: isDone ? 'var(--stone-bg)' : '#ffffff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '12px',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{ marginTop: '2px' }}>
                              {isDone ? (
                                <CheckSquare size={16} style={{ color: 'var(--sage-text)' }} />
                              ) : (
                                <Square size={16} style={{ color: 'var(--stone-light)' }} />
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <div
                                  style={{
                                    fontSize: '0.929rem',
                                    fontWeight: 500,
                                    textDecoration: isDone ? 'line-through' : 'none',
                                    color: isDone ? 'var(--text-tertiary)' : 'var(--text-primary)',
                                  }}
                                >
                                  {act.title}
                                </div>
                                <span
                                  style={{
                                    fontSize: '0.643rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    padding: '2px 8px',
                                    borderRadius: '3px',
                                    background: act.priority === 'High' ? 'var(--terracotta-bg)' : 'var(--brass-bg)',
                                    color: act.priority === 'High' ? 'var(--terracotta-text)' : 'var(--brass-muted)',
                                  }}
                                >
                                  {act.deadline}
                                </span>
                              </div>
                              <div className="text-caption" style={{ color: 'var(--text-secondary)' }}>
                                {act.detail}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 6: Audit & Missing Info */}
                {activeTab === 'review' && (
                  <div>
                    {/* Missing Information / Discrepancies (Distinct from Verified Facts) */}
                    <div style={{ marginBottom: '24px' }}>
                      <div className="text-label" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <HelpCircle size={14} style={{ color: 'var(--terracotta)' }} /> Missing Evidentiary Records & Caveats
                      </div>
                      <div className="flex-col gap-3">
                        {findings.missing_information.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '12px 14px',
                              background: 'rgba(196, 105, 74, 0.05)',
                              border: '1px solid rgba(196, 105, 74, 0.2)',
                              borderRadius: '6px',
                            }}
                          >
                            <div style={{ fontWeight: 600, fontSize: '0.857rem', color: 'var(--terracotta-text)', marginBottom: '3px' }}>
                              {item.item}
                            </div>
                            <div style={{ fontSize: '0.857rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                              {item.description}
                            </div>
                            <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
                              Impact on Defense: {item.impact}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Review Flags & Statutory Compliance Checks */}
                    <div style={{ marginBottom: '24px' }}>
                      <div className="text-label" style={{ marginBottom: '12px' }}>
                        Registry Lodgment & Limitation Audit
                      </div>
                      <div className="flex-col gap-2">
                        {findings.review_flags.map((rf, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              background: '#ffffff',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '6px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {rf.status === 'Action Required' ? (
                                <AlertTriangle size={16} style={{ color: 'var(--brass-muted)', flexShrink: 0 }} />
                              ) : (
                                <CheckCircle2 size={16} style={{ color: 'var(--sage-text)', flexShrink: 0 }} />
                              )}
                              <div>
                                <div style={{ fontSize: '0.857rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                  {rf.flag}
                                </div>
                                <div className="text-caption" style={{ color: 'var(--text-secondary)' }}>
                                  {rf.note}
                                </div>
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: '0.643rem',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '3px',
                                background:
                                  rf.status === 'Action Required'
                                    ? 'var(--brass-bg)'
                                    : 'var(--sage-bg)',
                                color:
                                  rf.status === 'Action Required'
                                    ? 'var(--brass-muted)'
                                    : 'var(--sage-text)',
                              }}
                            >
                              {rf.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Confidence Assessment Box */}
                    <div
                      style={{
                        padding: '16px',
                        background: 'rgba(107, 143, 113, 0.08)',
                        border: '1px solid rgba(107, 143, 113, 0.25)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.929rem', color: 'var(--sage-text)' }}>
                          Simulated Model Confidence: {findings.confidence_or_uncertainty.overall_confidence}
                        </div>
                        <div className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Assessment: {findings.confidence_or_uncertainty.verdict}
                        </div>
                        <div className="text-caption" style={{ color: 'var(--terracotta-text)', marginTop: '4px' }}>
                          Caveat / Vulnerability: {findings.confidence_or_uncertainty.key_vulnerability}
                        </div>
                        <div className="text-caption" style={{ color: 'var(--text-tertiary)', marginTop: '4px', fontStyle: 'italic' }}>
                          * Heuristic model metric generated for frontend demonstration; does not replace judicial appraisal.
                        </div>
                      </div>
                      <ShieldCheck size={28} style={{ color: 'var(--sage-text)', flexShrink: 0 }} />
                    </div>

                    {/* Statutory Precedent Citations */}
                    <div style={{ marginTop: '20px' }}>
                      <div className="text-label" style={{ marginBottom: '8px' }}>
                        Illustrative Precedent Citations (Simulated Reference)
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.786rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {findings.source_references.map((ref, idx) => (
                          <li key={idx} style={{ marginBottom: '2px' }}>
                            <span style={{ fontFamily: 'monospace' }}>{ref}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
