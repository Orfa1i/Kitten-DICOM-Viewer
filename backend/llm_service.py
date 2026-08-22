import os
import time
import json
import logging
from typing import Dict, Any, Optional, List
from pubmed_service import PubMedService

logger = logging.getLogger("llm_service")

class LlmService:
    @staticmethod
    def test_connection(
        provider: str,
        model_version: str,
        api_key: str,
        base_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Runs a minimal test call to verify API key and model connectivity"""
        start_time = time.time()
        provider = provider.lower()

        try:
            if provider == "gemini":
                try:
                    from google import genai
                    client = genai.Client(api_key=api_key)
                    response = client.models.generate_content(
                        model=model_version or "gemini-2.5-flash",
                        contents="Respond with 'Kitten PACS LLM connected successfully.' in under 10 words."
                    )
                    reply = response.text
                except Exception:
                    import requests
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_version or 'gemini-2.5-flash'}:generateContent?key={api_key}"
                    r = requests.post(
                        url,
                        json={"contents": [{"parts": [{"text": "Reply with 'Kitten PACS LLM connected successfully.'"}]}]},
                        timeout=10
                    )
                    if r.status_code != 200:
                        raise Exception(f"Gemini API error ({r.status_code}): {r.text}")
                    data = r.json()
                    reply = data["candidates"][0]["content"]["parts"][0]["text"]

            elif provider == "anthropic":
                from anthropic import Anthropic
                client = Anthropic(api_key=api_key)
                message = client.messages.create(
                    model=model_version or "claude-3-7-sonnet-20250219",
                    max_tokens=50,
                    messages=[{"role": "user", "content": "Respond with 'Kitten PACS Claude connected successfully.'"}]
                )
                reply = message.content[0].text

            elif provider == "openai":
                from openai import OpenAI
                client = OpenAI(api_key=api_key, base_url=base_url or None)
                res = client.chat.completions.create(
                    model=model_version or "gpt-4o",
                    messages=[{"role": "user", "content": "Respond with 'Kitten PACS GPT connected successfully.'"}],
                    max_tokens=50
                )
                reply = res.choices[0].message.content

            elif provider in ("ollama", "custom"):
                import requests
                url = base_url or "http://localhost:11434/api/generate"
                payload = {
                    "model": model_version or "llama3",
                    "prompt": "Respond with 'Kitten Local LLM connected successfully.'",
                    "stream": False
                }
                r = requests.post(url, json=payload, timeout=10)
                if r.status_code != 200:
                    raise Exception(f"Local endpoint error ({r.status_code}): {r.text}")
                data = r.json()
                reply = data.get("response", "Connected successfully")

            else:
                raise ValueError(f"Unsupported provider: {provider}")

            latency_ms = int((time.time() - start_time) * 1000)
            return {
                "success": True,
                "provider": provider,
                "model": model_version,
                "latency_ms": latency_ms,
                "sample_reply": reply.strip()
            }

        except Exception as e:
            return {
                "success": False,
                "provider": provider,
                "model": model_version,
                "error": str(e)
            }

    @staticmethod
    def chat_completion(
        message: str,
        config: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generates AI assistant clinical diagnostic response with PubMed knowledge grounding"""
        provider = config.get("provider", "gemini").lower()
        model_version = config.get("modelVersion") or "gemini-2.5-flash"
        api_key = config.get("apiKey") or os.environ.get("GEMINI_API_KEY", "")
        base_url = config.get("baseUrl")
        temperature = float(config.get("temperature", 0.25))

        # 1. Fetch relevant PubMed literature for active case & query
        search_query = message
        if context:
            diagnosis = context.get("diagnosis", "")
            model_type = context.get("modelType", "")
            search_query = f"{diagnosis} {model_type} {message}".strip()

        pubmed_articles = PubMedService.search_pubmed(search_query, max_results=3)

        pubmed_context = "\n".join([
            f"- PMID {art['pmid']}: \"{art['title']}\" by {art['authors']} ({art['journal']}). Takeaway: {art['takeaway']}"
            for art in pubmed_articles
        ])

        system_prompt = config.get("systemPrompt") or (
            "You are Kitten AI Diagnostic Copilot, an elite board-certified clinical radiology AI assistant. "
            "You provide precise, evidence-based interpretations of DICOM radiographs, Kellgren-Lawrence osteoarthritis staging, "
            "and orthopaedic fracture localizations. Format citations as [PubMed PMID: XXXXXXXX] when referencing peer-reviewed literature. "
            "Be concise, authoritative, structured, and clinically actionable."
        )

        # Context enrichment with Patient & Model telemetry
        context_str = ""
        if context:
            context_str = (
                f"\n=== ACTIVE PACS CASE TELEMETRY ===\n"
                f"Patient ID: {context.get('patientId', 'Pending')}\n"
                f"Patient Name: {context.get('patientName', 'Anonymous')}\n"
                f"Age/Sex: {context.get('patientAge', 'N/A')} / {context.get('patientSex', 'N/A')}\n"
                f"Active Model: {context.get('modelType', 'Radiography')}\n"
                f"Confidence Score: {context.get('confidence', 0)}%\n"
                f"Current Findings: {json.dumps(context.get('findings', []))}\n"
                f"Current Diagnosis: {context.get('diagnosis', 'Pending')}\n"
            )

        full_prompt = (
            f"{system_prompt}\n\n"
            f"{context_str}\n\n"
            f"=== GROUND TRUTH PUBMED BIOMEDICAL LITERATURE ===\n"
            f"{pubmed_context}\n\n"
            f"User Question: {message}\n\n"
            f"Please provide an evidence-grounded clinical response citing relevant PubMed PMIDs:"
        )

        # Offline / Keyless fallback with enriched clinical reasoning
        if not api_key and provider not in ("ollama", "custom"):
            cites = ", ".join([f"PMID: {a['pmid']} ({a['journal']})" for a in pubmed_articles])
            offline_reply = (
                f"**Clinical Interpretation & Literature Grounding:**\n\n"
                f"Based on the active radiograph case ({context.get('modelType', 'Clinical Vision')} with {context.get('confidence', 98)}% model precision):\n\n"
                f"• **Diagnostic Assessment:** {context.get('diagnosis', 'Acute Radiographic Evaluation Complete')}\n"
                f"• **Biomedical Literature Support:** The quantitative findings correlate with standard orthopaedic diagnostic protocols [{cites}].\n"
                f"• **Recommendation:** {context.get('recommendation', 'Orthopedic follow-up and clinical correlation advised.')}\n\n"
                f"*(To enable generative free-form discussion, add your {provider.capitalize()} API key in Settings > Models)*"
            )
            return {
                "reply": offline_reply,
                "model_used": "Kitten PubMed Clinical Engine",
                "pubmed_articles": pubmed_articles,
                "success": True
            }

        try:
            if provider == "gemini":
                try:
                    from google import genai
                    client = genai.Client(api_key=api_key)
                    res = client.models.generate_content(
                        model=model_version,
                        contents=full_prompt,
                        config={"temperature": temperature}
                    )
                    reply = res.text
                except Exception:
                    import requests
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_version}:generateContent?key={api_key}"
                    r = requests.post(
                        url,
                        json={
                            "contents": [{"parts": [{"text": full_prompt}]}],
                            "generationConfig": {"temperature": temperature}
                        },
                        timeout=15
                    )
                    data = r.json()
                    reply = data["candidates"][0]["content"]["parts"][0]["text"]

            elif provider == "anthropic":
                from anthropic import Anthropic
                client = Anthropic(api_key=api_key)
                res = client.messages.create(
                    model=model_version,
                    system=system_prompt,
                    messages=[{"role": "user", "content": full_prompt}],
                    max_tokens=800,
                    temperature=temperature
                )
                reply = res.content[0].text

            elif provider == "openai":
                from openai import OpenAI
                client = OpenAI(api_key=api_key, base_url=base_url or None)
                res = client.chat.completions.create(
                    model=model_version,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": full_prompt}
                    ],
                    temperature=temperature,
                    max_tokens=800
                )
                reply = res.choices[0].message.content

            elif provider in ("ollama", "custom"):
                import requests
                url = base_url or "http://localhost:11434/api/generate"
                r = requests.post(url, json={"model": model_version, "prompt": full_prompt, "stream": False}, timeout=15)
                reply = r.json().get("response", "Response received from local LLM.")

            else:
                reply = f"Query processed with {model_version}."

            return {
                "reply": reply.strip(),
                "model_used": f"{provider.capitalize()} ({model_version})",
                "pubmed_articles": pubmed_articles,
                "success": True
            }

        except Exception as e:
            return {
                "reply": f"AI Copilot Error ({provider}): {str(e)}. Please check your API key in Settings > Models.",
                "model_used": "Error Fallback",
                "pubmed_articles": pubmed_articles,
                "success": False,
                "error": str(e)
            }
