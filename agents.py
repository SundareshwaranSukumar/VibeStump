from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from utils import GEMINI_API_KEY

# --- Pydantic Schema for Gemini ---
class AnalysisResult(BaseModel):
    vibe_score: int = Field(description="Vibe score from -10 (devastated) to 10 (ecstatic)")
    tension_index: int = Field(description="Tension index from 0 (calm) to 10 (extreme tension)")
    meme_search_query: str = Field(description="A short search query to find a relevant GIF (e.g., 'excited fan', 'crying man')")
    fallback_mood: str = Field(description="Must be one of: happy, sad, tense, angry")

def analyze_commentary(commentary: str):
    """
    The Psychologist Agent: Analyzes commentary to determine emotional state.
    """
    if not GEMINI_API_KEY:
        # Return safe defaults if API key is missing to prevent breaking UI before user sets it up
        return AnalysisResult(vibe_score=0, tension_index=5, meme_search_query="cricket", fallback_mood="happy")
        
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model='gemini-2.5-flash', # Optimized for <3s latency
            contents=f"Analyze this live cricket commentary and determine the vibe score, tension index, a short GIF search query, and a fallback mood. Commentary: {commentary}",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AnalysisResult,
                temperature=0.7, # Slightly higher temperature for better meme queries
            ),
        )
        
        if hasattr(response, 'parsed') and response.parsed:
            return response.parsed
        else:
            import json
            result_dict = json.loads(response.text)
            return AnalysisResult(**result_dict)
            
    except Exception as e:
        print(f"Gemini API Error: {e}")
        # Return safe defaults if AI fails
        return AnalysisResult(vibe_score=0, tension_index=5, meme_search_query="cricket error", fallback_mood="sad")
