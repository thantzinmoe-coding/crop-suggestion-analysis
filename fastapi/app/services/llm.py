from collections.abc import AsyncGenerator

from httpx import AsyncClient, HTTPStatusError, RequestError

from app.core.config import get_settings

SYSTEM_PROMPT_EN = """You are crop-Ai, an expert AI agricultural assistant for Myanmar (Burma).
Provide helpful, accurate, and concise advice about:
- Crop selection and farming best practices for Myanmar's climate zones
- Soil management and irrigation
- Weather impact on agriculture
- NDVI and satellite vegetation analysis

Keep responses EXTREMELY brief, practical, and actionable (maximum 2-3 short sentences).
Answer in English."""

SYSTEM_PROMPT_MY = """သင်သည် မြန်မာနိုင်ငံအတွက် စိုက်ပျိုးရေးဆိုင်ရာ ကျွမ်းကျင် AI အကူအညီပေးသူ crop-Ai ဖြစ်ပါသည်။
အောက်ပါကိစ္စများအတွက် အထောက်အကူဖြစ်စေမည့် တိကျမှန်ကန်ပြီး လက်တွေ့ကျသော အကြံဉာဏ်များကို ပေးပါ-
- မြန်မာနိုင်ငံ၏ ရာသီဥတုဇုန်များအတွက် သီးနှံရွေးချယ်မှုနှင့် စိုက်ပျိုးရေးအကောင်းဆုံးနည်းလမ်းများ
- မြေဆီလွှာစီမံခန့်ခွဲမှုနှင့် ဆည်မြောင်း
- စိုက်ပျိုးရေးအပေါ် ရာသီဥတုသက်ရောက်မှု
- NDVI နှင့် ဂြိုဟ်တုအပင်ကျန်းမာရေးခွဲခြမ်းစိတ်ဖြာခြင်း

မြန်မာလယ်သမားများအတွက် လက်တွေ့ကျပြီး အသုံးဝင်သော အကြံဉာဏ်များကို မြန်မာဘာသာဖြင့် အလွန်တိုတောင်းစွာ (ဝါကျ ၂ ကြောင်း သို့မဟုတ် ၃ ကြောင်းသာ) ဖြေကြားပါ။"""

CROP_EXPLANATION_PROMPT_EN = (
    "You are an expert agricultural advisor for Myanmar.\n"
    "Given soil and weather conditions, explain why {crop} is suitable.\n"
    "Include information about:\n"
    "- Why {crop} thrives in soil pH {soil_pH}, rainfall {rainfall_mm}mm, "
    "and temperature {temperature_c}°C\n"
    "- Expected yield potential\n"
    "- Any specific cultivation tips for Myanmar farmers\n"
    "- Market considerations\n\n"
    "Keep the explanation concise (2-3 paragraphs) and practical. Answer in English."
)

CROP_EXPLANATION_PROMPT_MY = (
    "သင်သည် မြန်မာနိုင်ငံအတွက် စိုက်ပျိုးရေးကျွမ်းကျင်အကြံပေးတစ်ဦးဖြစ်ပါသည်။\n"
    "အောက်ပါမြေဆီလွှာနှင့် ရာသီဥတုအခြေအနေများအရ {crop} သည် "
    "အဘယ်ကြောင့် စိုက်ပျိုးရန် သင့်တော်သော သီးနှံဖြစ်သည်ကို ရှင်းပြပါ-\n"
    "- မြေဆီလွှာ pH {soil_pH}၊ မိုးရေချိန် {rainfall_mm}မီလီမီတာ "
    "နှင့် အပူချိန် {temperature_c}°C တွင် {crop} သည် "
    "အဘယ်ကြောင့်ဖြစ်ထွန်းသနည်း\n"
    "- မျှော်မှန်းအထွက်နှုန်း\n"
    "- မြန်မာလယ်သမားများအတွက် စိုက်ပျိုးနည်းဆိုင်ရာ အကြံပြုချက်များ\n"
    "- ဈေးကွက်အခြေအနေ\n\n"
    "ကျစ်လစ်ပြီး လက်တွေ့ကျသော အကြံဉာဏ်များကို "
    "မြန်မာဘာသာဖြင့် ရှင်းပြပါ။"
)


def _build_messages(messages: list[dict], language: str) -> list[dict]:
    system_prompt = SYSTEM_PROMPT_MY if language == "my" else SYSTEM_PROMPT_EN
    return [{"role": "system", "content": system_prompt}, *messages]


async def stream_chat(
    messages: list[dict],
    language: str,
) -> AsyncGenerator[str, None]:
    settings = get_settings()
    api_key = settings.llm_api_key.get_secret_value() if settings.llm_api_key else None

    url = f"{settings.llm_endpoint.rstrip('/')}/chat/completions"
    headers = {
        "Content-Type": "application/json",
    }
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    payload = {
        "model": settings.llm_model,
        "messages": _build_messages(messages, language),
        "stream": True,
        "temperature": 0.5,
        "max_tokens": 512,
    }

    async with AsyncClient(timeout=60) as client:
        try:
            async with client.stream("POST", url, json=payload, headers=headers) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str.strip() == "[DONE]":
                            return
                        import json
                        try:
                            chunk = json.loads(data_str)
                            delta = chunk.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue
        except (HTTPStatusError, RequestError) as e:
            yield f"\n\n_Error communicating with LLM: {e}_"


def _fallback_chat_response(messages: list[dict], language: str) -> str:
    user_msg = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
    if language == "my":
        return f"ကျေးဇူးပြု၍ crop-Ai API ကို အသုံးပြုရန်အတွက် LLM API သော့ကို သတ်မှတ်ပါ။\n\nမေးခွန်း- {user_msg}"
    return (
        f"crop-Ai requires an LLM API key to function. "
        f"Please set the `CROP_AI_LLM_API_KEY` environment variable.\n\n"
        f"Your question was: {user_msg}"
    )


async def stream_crop_explanation(
    soil_pH: float,
    rainfall_mm: float,
    temperature_c: float,
    crop: str,
    language: str,
) -> AsyncGenerator[str, None]:
    settings = get_settings()
    api_key = settings.llm_api_key.get_secret_value() if settings.llm_api_key else None

    prompt_template = CROP_EXPLANATION_PROMPT_MY if language == "my" else CROP_EXPLANATION_PROMPT_EN
    user_prompt = prompt_template.format(
        crop=crop,
        soil_pH=soil_pH,
        rainfall_mm=rainfall_mm,
        temperature_c=temperature_c,
    )
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT_MY if language == "my" else SYSTEM_PROMPT_EN},
        {"role": "user", "content": user_prompt},
    ]

    url = f"{settings.llm_endpoint.rstrip('/')}/chat/completions"
    headers = {
        "Content-Type": "application/json",
    }
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    payload = {
        "model": settings.llm_model,
        "messages": messages,
        "stream": True,
        "temperature": 0.7,
        "max_tokens": 1024,
    }

    async with AsyncClient(timeout=60) as client:
        try:
            async with client.stream("POST", url, json=payload, headers=headers) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str.strip() == "[DONE]":
                            return
                        import json
                        try:
                            chunk = json.loads(data_str)
                            delta = chunk.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue
        except (HTTPStatusError, RequestError) as e:
            yield f"\n\n_Error communicating with LLM: {e}_"


def _fallback_crop_explanation(crop: str, language: str) -> str:
    if language == "my":
        return (
            f"{crop} သည် မြန်မာနိုင်ငံ၏ ရာသီဥတုအခြေအနေများအတွက် သင့်လျော်သော သီးနှံတစ်မျိုးဖြစ်ပါသည်။ "
            f"အသေးစိတ်ရှင်းလင်းချက်အတွက် LLM API သော့ကို သတ်မှတ်ပေးပါ။"
        )
    return (
        f"{crop} is a suitable crop for Myanmar's growing conditions. "
        f"Set the CROP_AI_LLM_API_KEY environment variable for a detailed AI-powered explanation."
    )


