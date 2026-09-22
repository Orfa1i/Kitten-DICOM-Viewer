import os
import requests
import logging
from typing import Dict, List, Optional
from datetime import datetime
from bs4 import BeautifulSoup
import chromadb
from chromadb.config import Settings
import uuid

# Load openFDA key if available
OPENFDA_API_KEY = os.environ.get("OPENFDA_API_KEY", "")

# Initialize ChromaDB persistent client
CHROMA_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vector_store")
chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)

# Collections
try:
    dailymed_collection = chroma_client.get_or_create_collection(name="dailymed_spl")
    pubmed_collection = chroma_client.get_or_create_collection(name="pubmed_oa")
except Exception as e:
    logging.error(f"Error initializing ChromaDB collections: {e}")
    dailymed_collection = None
    pubmed_collection = None


class RxNormClient:
    """Live API integration for drug name normalization via NLM RxNav."""
    BASE_URL = "https://rxnav.nlm.nih.gov/REST"

    @classmethod
    def get_rxcui(cls, drug_name: str) -> Optional[Dict]:
        try:
            res = requests.get(f"{cls.BASE_URL}/rxcui.json?name={drug_name}", timeout=10)
            data = res.json()
            if "idGroup" in data and "rxnormId" in data["idGroup"]:
                return {"match_type": "exact", "rxcui": data["idGroup"]["rxnormId"][0]}
            
            res = requests.get(f"{cls.BASE_URL}/approximateTerm.json?term={drug_name}&maxEntries=1", timeout=10)
            data = res.json()
            if "approximateGroup" in data and "candidate" in data["approximateGroup"]:
                return {"match_type": "approximate", "rxcui": data["approximateGroup"]["candidate"][0]["rxcui"]}
        except Exception as e:
            logging.error(f"RxNorm API error: {e}")
        return None

class DailyMedPipeline:
    """RAG Indexing Pipeline for Official Prescribing Information."""
    BASE_URL = "https://dailymed.nlm.nih.gov/dailymed/services/v2"

    @classmethod
    def get_spl_setid_for_rxcui(cls, rxcui: str) -> Optional[str]:
        try:
            res = requests.get(f"{cls.BASE_URL}/spls.json?rxcui={rxcui}", timeout=10)
            data = res.json()
            if data.get("data") and len(data["data"]) > 0:
                return data["data"][0]["setid"]
        except Exception as e:
            logging.error(f"DailyMed SPL lookup error: {e}")
        return None

    @classmethod
    def index_spl(cls, setid: str):
        """
        1) Pull SPL XML per drug via API.
        2) Parse into labeled sections.
        3) Chunk by section.
        4) Store metadata and embeddings in ChromaDB.
        """
        if not dailymed_collection:
            logging.error("ChromaDB not initialized.")
            return

        try:
            res = requests.get(f"{cls.BASE_URL}/spls/{setid}.xml", timeout=15)
            if res.status_code != 200:
                logging.error(f"Failed to fetch XML for setid: {setid}")
                return

            xml_content = res.content
            soup = BeautifulSoup(xml_content, "xml")
            
            # Basic parsing of SPL sections
            # In an SPL XML, sections are usually under <component><section>
            # with <code displayName="..."/> determining the section type
            documents = []
            metadatas = []
            ids = []
            
            drug_name_node = soup.find("title")
            drug_name = drug_name_node.text.strip() if drug_name_node else "Unknown Drug"
            last_updated = datetime.now().isoformat()
            
            sections = soup.find_all("section")
            for section in sections:
                code_node = section.find("code")
                title_node = section.find("title")
                if not code_node or not title_node:
                    continue
                
                section_type = code_node.get("displayName", title_node.text)
                # We only want clinical sections generally
                text_content = section.get_text(separator=" ", strip=True)
                
                if len(text_content) < 20:
                    continue
                
                chunk_id = f"{setid}_{uuid.uuid4().hex[:8]}"
                documents.append(text_content)
                metadatas.append({
                    "drug_name": drug_name,
                    "setid": setid,
                    "section_type": section_type,
                    "last_updated": last_updated
                })
                ids.append(chunk_id)

            if documents:
                dailymed_collection.upsert(
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )
                logging.info(f"Indexed {len(documents)} sections for {drug_name} (setid: {setid})")
        
        except Exception as e:
            logging.error(f"Error indexing SPL for {setid}: {e}")

class OpenFDAPipeline:
    """Hybrid Integration: Live API + Periodic RAG for FDA data."""
    BASE_URL = "https://api.fda.gov/drug"

    @classmethod
    def live_safety_check(cls, drug_name: str) -> Dict:
        headers = {}
        if OPENFDA_API_KEY:
            headers["Authorization"] = f"Basic {OPENFDA_API_KEY}"
            
        try:
            res = requests.get(f"{cls.BASE_URL}/enforcement.json?search=product_description:\"{drug_name}\"&limit=5", headers=headers, timeout=10)
            if res.status_code == 200:
                return res.json()
            return {"error": f"Failed with status {res.status_code}"}
        except Exception as e:
            logging.error(f"openFDA API error: {e}")
            return {"error": str(e)}

class PubMedPipeline:
    """RAG Integration for PMC Open Access Subset."""
    BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

    @classmethod
    def fetch_and_index_abstracts(cls, mesh_term: str, max_results: int = 5):
        """
        1) Query by relevant MeSH terms.
        2) Fetch abstracts.
        3) Store in ChromaDB.
        """
        if not pubmed_collection:
            logging.error("ChromaDB not initialized.")
            return

        try:
            # 1. Search for PMIDs
            search_url = f"{cls.BASE_URL}/esearch.fcgi?db=pubmed&term={mesh_term}[MeSH Terms]&retmode=json&retmax={max_results}"
            s_res = requests.get(search_url, timeout=10).json()
            pmids = s_res.get("esearchresult", {}).get("idlist", [])
            
            if not pmids:
                return
            
            # 2. Fetch Abstracts
            fetch_url = f"{cls.BASE_URL}/efetch.fcgi?db=pubmed&id={','.join(pmids)}&retmode=xml"
            f_res = requests.get(fetch_url, timeout=15)
            soup = BeautifulSoup(f_res.content, "xml")
            
            articles = soup.find_all("PubmedArticle")
            documents = []
            metadatas = []
            ids = []
            
            for article in articles:
                pmid_node = article.find("PMID")
                pmid = pmid_node.text if pmid_node else uuid.uuid4().hex
                
                title_node = article.find("ArticleTitle")
                title = title_node.text if title_node else "No Title"
                
                abstract_node = article.find("AbstractText")
                abstract = abstract_node.text if abstract_node else ""
                
                if not abstract:
                    continue
                
                documents.append(f"Title: {title}\n\nAbstract: {abstract}")
                metadatas.append({
                    "PMID": pmid,
                    "license_status": "abstract-only",
                    "retrieval_date": datetime.now().isoformat()
                })
                ids.append(f"pmid_{pmid}")
                
            if documents:
                pubmed_collection.upsert(
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )
                logging.info(f"Indexed {len(documents)} PubMed abstracts for '{mesh_term}'")
                
        except Exception as e:
            logging.error(f"PubMed fetch error: {e}")

# Expose instances
rxnorm = RxNormClient()
dailymed_rag = DailyMedPipeline()
openfda = OpenFDAPipeline()
pubmed_rag = PubMedPipeline()
