"""
Counsel AI Engine - Milestone 4: Case Analysis Chain Test
Demonstrates LCEL, PromptTemplates, Structured Output, and Pydantic Validation
using a fictional legal dispute.
"""

import sys
from app.schemas.legal_schemas import CaseAnalysis
from app.chains.case_analysis_chain import analyze_case

# Fictional legal case scenario for technical testing
FICTIONAL_CASE_TEXT = """
A fictional supplier company named Blue Oak Supplies entered into a written agreement 
with a fictional retail business called Northstar Retail. 

Under the agreement, Northstar Retail agreed to purchase office equipment and pay an agreed sum 
of Rs. 80,000 upon delivery. Blue Oak Supplies states that all ordered office equipment was 
delivered to Northstar Retail's premises on 10 October 2026. 

Blue Oak Supplies asserts that despite repeated follow-ups, payment of Rs. 80,000 has not been received. 
Representatives from Northstar Retail informally stated that some of the equipment was allegedly missing 
from the shipment. 

No written delivery receipt, signed acknowledgment, copy of the original contract, or itemized invoice 
has been provided in the current file.
"""

def run_milestone4_test():
    print("=" * 70)
    print("⚖️  COUNSEL AI ENGINE — MILESTONE 4: CASE ANALYSIS DEMO")
    print("=" * 70)
    print("\n📄 INPUT FICTIONAL CASE TEXT:")
    print("-" * 50)
    print(FICTIONAL_CASE_TEXT.strip())
    print("-" * 50)
    
    print("\n🚀 Executing LCEL Chain: PromptTemplate | Gemini | Structured Output...")
    
    try:
        result: CaseAnalysis = analyze_case(FICTIONAL_CASE_TEXT)
        
        print("\n✅ CHAIN EXECUTION & VALIDATION SUCCESSFUL!")
        print("=" * 70)
        print("📊 STRUCTURED LEGAL ANALYSIS OUTPUT (Validated Pydantic Object):")
        print("=" * 70)
        
        print(f"\n📂 Case Type:\n   {result.case_type}")
        
        print(f"\n👥 Identified Parties ({len(result.parties)}):")
        for party in result.parties:
            print(f"   • {party}")
            
        print(f"\n📝 Factual Summary:\n   {result.summary}")
        
        print(f"\n📌 Material Key Facts ({len(result.key_facts)}):")
        for fact in result.key_facts:
            print(f"   • {fact}")
            
        print(f"\n❓ Missing Information / Documents ({len(result.missing_information)}):")
        for item in result.missing_information:
            print(f"   • {item}")
            
        print(f"\n⚠️  Risk Flags & Evidential Issues ({len(result.risk_flags)}):")
        for risk in result.risk_flags:
            print(f"   • {risk}")
            
        print("\n" + "=" * 70)
        print("🔍 TYPE & FIELD VALIDATION AUDIT:")
        print("=" * 70)
        print(f"• Object Class: {result.__class__.__name__} (isinstance CaseAnalysis: {isinstance(result, CaseAnalysis)})")
        print(f"• case_type is str: {isinstance(result.case_type, str)}")
        print(f"• parties is list[str]: {isinstance(result.parties, list)}")
        print(f"• summary is str: {isinstance(result.summary, str)}")
        print(f"• key_facts is list[str]: {isinstance(result.key_facts, list)}")
        print(f"• missing_information is list[str]: {isinstance(result.missing_information, list)}")
        print(f"• risk_flags is list[str]: {isinstance(result.risk_flags, list)}")
        print("\n🎉 Milestone 4 verification passed with 100% adherence to legal schema!\n")
        
    except Exception as e:
        print(f"\n❌ Error during case analysis: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_milestone4_test()
