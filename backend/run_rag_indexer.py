import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from knowledge_sources import rxnorm, dailymed_rag, pubmed_rag

def run_indexing():
    print("--- Starting Knowledge Source RAG Indexing ---")
    
    # 1. DailyMed RAG Indexing
    print("\n[DailyMed] Indexing Tylenol (Acetaminophen)...")
    drug_name = "acetaminophen"
    rx_result = rxnorm.get_rxcui(drug_name)
    if rx_result and rx_result.get("rxcui"):
        rxcui = rx_result["rxcui"]
        print(f"  -> Found RxCUI for {drug_name}: {rxcui}")
        setid = dailymed_rag.get_spl_setid_for_rxcui(rxcui)
        if setid:
            print(f"  -> Found SPL setid: {setid}. Indexing XML sections...")
            dailymed_rag.index_spl(setid)
            print("  -> DailyMed indexing complete.")
        else:
            print("  -> Could not find SPL setid.")
    else:
        print(f"  -> Could not resolve RxCUI for {drug_name}")

    # 2. PubMed RAG Indexing
    print("\n[PubMed] Indexing abstracts for 'Osteoarthritis'...")
    pubmed_rag.fetch_and_index_abstracts("Osteoarthritis", max_results=5)
    print("  -> PubMed indexing complete.")
    
    print("\n--- RAG Indexing Finished ---")

if __name__ == "__main__":
    run_indexing()
