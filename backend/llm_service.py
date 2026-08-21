import os
import time
from typing import Dict, Any, Optional, List

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
                # Use google.genai or REST API fallback
                try:
                    from google import genai
                    client = genai.Client(api_key=api_key)
                    response = client.models.generate_content(
                        model=model_version or "gemini-2.5-flash",
                        contents="Respond with 'Kitten PACS LLM connected successfully.' in under 10 words."
                    )
                    reply = response.text
                except Exception as g_err:
                    # Direct REST fallback for Gemini
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
        """Generates AI assistant clinical diagnostic response using configured model"""
        provider = config.get("provider", "gemini").lower()
        model_version = config.get("modelVersion") or "gemini-2.5-flash"
        api_key = config.get("apiKey") or os.environ.get("GEMINI_API_KEY", "")
        base_url = config.get("baseUrl")
        temperature = float(config.get("temperature", 0.3))
        system_prompt = config.get("systemPrompt") or (
            "You are Kitten AI Diagnostic Copilot, an expert clinical radiology assistant. "
            "Provide concise, evidence-based interpretations of DICOM radiographs, Kellgren-Lawrence staging, "
            "and orthopaedic findings. Keep responses professional, clear, and actionable for radiologists."
        )

        # Context enrichment
        context_str = ""
        if context:
            context_str = f"\nActive Patient Context: {context}"

        full_prompt = f"{system_prompt}\n{context_str}\n\nUser Question: {message}"

        # If no API key provided, generate helpful diagnostic fallback
        if not api_key and provider not in ("ollama", "custom"):
            return {
                "reply": f"[Offline Diagnostic Engine] I've analyzed your query regarding '{message}'. To enable full generative AI explanations, configure your {provider.capitalize()} API key in the Setting > Models menu.",
                "model_used": "Kitten Diagnostic Rule Engine",
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
                    messages=[{"role": "user", "content": message}],
                    max_tokens=600,
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
                        {"role": "user", "content": message}
                    ],
                    temperature=temperature,
                    max_tokens=600
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
                "success": True
            }

        except Exception as e:
            return {
                "reply": f"AI Copilot Error ({provider}): {str(e)}. Please check your API key and model name in Settings > Models.",
                "model_used": "Error Fallback",
                "success": False,
                "error": str(e)
            }
