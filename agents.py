from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from utils import GEMINI_API_KEY

# Ensure API Key is set
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# --- Pydantic Schemas ---
class AnalysisResult(BaseModel):
    vibe_score: int = Field(description="Vibe score from -10 (devastated) to 10 (ecstatic)")
    tension_index: int = Field(description="Tension index from 0 (calm) to 10 (extreme tension)")
    meme_search_query: str = Field(description="A short search query to find a relevant GIF")
    fallback_mood: str = Field(description="Must be one of: happy, sad, tense, angry, hype")
    is_critical_event: bool = Field(description="True if the commentary describes a massive event like a Wicket or a Six.")
    event_type: str = Field(description="If critical, specify 'WICKET' or 'SIX', else 'NONE'")

class HistorianResult(BaseModel):
    historical_insight: str = Field(description="A fascinating 1-2 sentence historical insight or comparison about this IPL event.")

def analyze_commentary(commentary: str) -> AnalysisResult:
    """
    The Psychologist Agent: Analyzes commentary to determine emotional state and flags critical events.
    """
    if not client:
        # Demo defaults if no key
        is_crit = "WICKET" in commentary or "SIX" in commentary
        etype = "WICKET" if "WICKET" in commentary else ("SIX" if "SIX" in commentary else "NONE")
        return AnalysisResult(vibe_score=5, tension_index=8, meme_search_query="cricket", fallback_mood="tense", is_critical_event=is_crit, event_type=etype)
        
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=f"Analyze this live cricket commentary. Determine vibe, tension, mood, and crucially, flag if a major event like a WICKET or a SIX occurred. Commentary: {commentary}",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AnalysisResult,
                temperature=0.7,
            ),
        )
        
        if hasattr(response, 'parsed') and response.parsed:
            return response.parsed
        else:
            import json
            result_dict = json.loads(response.text)
            return AnalysisResult(**result_dict)
            
    except Exception as e:
        print(f"Psychologist Error: {e}")
        return AnalysisResult(vibe_score=0, tension_index=5, meme_search_query="error", fallback_mood="sad", is_critical_event=False, event_type="NONE")

def generate_historical_insight(event_type: str, context_data: str) -> str:
    """
    The Historian Agent: Generates a fascinating historical insight based on a critical event.
    """
    if not client:
        return f"Historian (Offline): {context_data}"
        
    try:
        prompt = f"Act as a Cricket Historian. A {event_type} just occurred. Here is some database context: '{context_data}'. Write a 1-2 sentence engaging historical insight comparing this to legendary IPL moments."
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=HistorianResult,
                temperature=0.8,
            ),
        )
        
        if hasattr(response, 'parsed') and response.parsed:
            return response.parsed.historical_insight
        else:
            import json
            result_dict = json.loads(response.text)
            return result_dict.get('historical_insight', context_data)
            
    except Exception as e:
        print(f"Historian Error: {e}")
        return context_data
