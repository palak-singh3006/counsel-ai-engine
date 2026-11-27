"""
Counsel AI Engine — Live Hackathon Master Demo.
Executes the full AI pipeline:
Ingestion -> Document Analyst -> Timeline -> Action Agent -> Reviewer Agent
Using real fictional case files for Blue Oak Supplies vs Northstar Retail.
"""

import os
import sys
from app.orchestrator import execute_counsel_pipeline
from app.schemas.legal_schemas import CaseIntelligenceResult

def run_hackathon_demo():
    print("=" * 80)
    print("⚖️   COUNSEL — SMART ADVOCATE OFFICE MANAGEMENT SYSTEM")
    print("🤖   AI CASE INTELLIGENCE ENGINE (LIVE DEMO)")
    print("=" * 80)

    # 1. Discover sample documents
    sample_dir = os.path.join(os.path.dirname(__file__), "sample_documents")
    docs = [
        os.path.join(sample_dir, "agreement_contract.txt"),
        os.path.join(sample_dir, "delivery_claim_notice.txt"),
        os.path.join(sample_dir, "informal_dispute_email.txt")
    ]

    print("\n📂 1. INGESTING CASE DOCUMENTS:")
    for doc_path in docs:
        print(f"   📄 Ingested: {os.path.basename(doc_path)} ({os.path.getsize(doc_path)} bytes)")

    print("\n🚀 2. EXECUTING ORCHESTRATED MULTI-AGENT PIPELINE...")
    print("   [Stage 1] Document Loader & Text Preprocessing")
    print("   [Stage 2] Document Analyst Agent (Fact & Claim Extraction)")
    print("   [Stage 3] Timeline Agent (Chronological Normalization)")
    print("   [Stage 4] Action Agent (Strategic Next Steps & Evidentiary Requests)")
    print("   [Stage 5] Reviewer Agent (Grounding & Anti-Hallucination Audit)")

    try:
        result: CaseIntelligenceResult = execute_counsel_pipeline(
            case_input=docs,
            case_id="MATTER-2026-BOS089",
            matter_title="Blue Oak Supplies v. Northstar Retail (Recovery of Dues)"
        )

        print("\n" + "=" * 80)
        print("📊 3. COMBINED CASE INTELLIGENCE RESULTS (Validated Schema)")
        print("=" * 80)

        print(f"\n📁 Matter: {result.matter_title} (ID: {result.case_id})")
        print(f"📌 Matter Type: {result.document_analyst.matter_type}")
        print(f"👥 Identified Parties: {', '.join(result.document_analyst.parties)}")

        print("\n📝 EXECUTIVE SUMMARY:")
        print(f"   {result.document_analyst.summary}")

        print("\n📌 MATERIAL CONFIRMED FACTS:")
        for fact in result.document_analyst.facts:
            print(f"   • {fact}")

        print("\n⚡ DISPUTED CLAIMS & ALLEGATIONS:")
        for claim in result.document_analyst.claims_and_allegations:
            print(f"   • {claim}")

        print("\n💰 PAYMENT & CONSIDERATION DETAILS:")
        for pay in result.document_analyst.payment_information:
            print(f"   • {pay}")

        print("\n❓ CRITICAL MISSING DOCUMENTS:")
        for doc in result.document_analyst.missing_documents:
            print(f"   ❌ {doc}")

        print("\n" + "-" * 80)
        print("⏱️  CHRONOLOGICAL CASE TIMELINE (TIMELINE AGENT)")
        print("-" * 80)
        for event in result.timeline.chronological_events:
            conflict_tag = " ⚠️ [DATE CONFLICT]" if event.is_conflict else ""
            print(f"   📅 {event.date}: {event.event_description}{conflict_tag}")
            if event.conflict_note:
                print(f"      ↳ Note: {event.conflict_note}")

        if result.timeline.date_conflicts:
            print("\n   ⚠️  Detected Inconsistencies:")
            for dc in result.timeline.date_conflicts:
                print(f"      • {dc}")

        print("\n" + "-" * 80)
        print("🎯 ADVOCATE ACTION PLAN & RECOMMENDATIONS (ACTION AGENT)")
        print("-" * 80)
        for act in result.actions.recommended_actions:
            p_badge = f"[{act.priority.upper()} PRIORITY]"
            print(f"\n   🔹 {p_badge} {act.title}")
            print(f"      Explanation: {act.explanation}")
            print(f"      Rationale:   {act.reason}")
            print(f"      Cures:       {act.missing_evidence}")
            print(f"      Advocate ID: {act.advocate_verification_needed}")

        print("\n   🚨 Immediate Next Steps for Advocate:")
        for ins in result.actions.immediate_next_steps:
            print(f"      👉 {ins}")

        if result.review:
            print("\n" + "-" * 80)
            print("🛡️  LEGAL SAFETY & GROUNDING AUDIT (REVIEWER AGENT)")
            print("-" * 80)
            pass_status = "PASSED ✅" if result.review.review_passed else "FAILED ❌"
            print(f"   Status:           {pass_status}")
            print(f"   Grounding Score:  {result.review.confidence_score * 100:.0f}%")
            print(f"   Audit Summary:    {result.review.grounding_summary}")
            if result.review.flags:
                print("   Reviewer Flags:")
                for flag in result.review.flags:
                    print(f"      • [{flag.severity}] {flag.issue_type}: {flag.description}")

        print("\n" + "=" * 80)
        print("⚙️  PIPELINE TELEMETRY & EXECUTION STATUS:")
        for component, status in result.pipeline_status.items():
            print(f"   • {component}: {status}")
        print("=" * 80)
        print("\n🎉 COUNSEL AI PIPELINE SUCCEEDED WITH FULL SCHEMA VALIDATION!\n")

    except Exception as e:
        print(f"\n❌ Pipeline execution encountered an error:\n{e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    run_hackathon_demo()
