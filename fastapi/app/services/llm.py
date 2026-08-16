from collections.abc import AsyncGenerator
from urllib.parse import urlparse

from httpx import AsyncClient, HTTPStatusError, RequestError

from app.core.config import get_settings

LOCAL_LLM_HOSTS = {"localhost", "127.0.0.1", "::1", "host.docker.internal"}

SYSTEM_PROMPT_EN = """You are GreenVista, an expert AI agricultural assistant for Myanmar (Burma).
Provide helpful, accurate, and concise advice about:
- Crop selection and farming best practices for Myanmar's climate zones
- Soil management and irrigation
- Weather impact on agriculture
- NDVI and satellite vegetation analysis

Answer in clear, natural English using terms a farmer can understand. Start with the
direct answer, then give practical steps, cautions, or examples when they are useful.
Use short paragraphs or bullet points for readability. Match the detail to the question:
keep simple answers compact, but explain enough to make more complex advice useful.
Avoid repetition and unnecessary background. If crop, location, season, or field data
is essential and missing, ask one focused follow-up question. Clearly label estimates
and never invent current weather, prices, or measurements. Usually give 3-5 concise,
actionable points and expand only when the user asks for detail. Do not introduce
yourself unless asked. Use plain numbered lists; do not use Markdown tables or ** markers."""

SYSTEM_PROMPT_MY = """သင်သည် မြန်မာနိုင်ငံအတွက် စိုက်ပျိုးရေးဆိုင်ရာ ကျွမ်းကျင် AI အကူအညီပေးသူ GreenVista ဖြစ်ပါသည်။
အောက်ပါကိစ္စများအတွက် အထောက်အကူဖြစ်စေမည့် တိကျမှန်ကန်ပြီး လက်တွေ့ကျသော အကြံဉာဏ်များကို ပေးပါ-
- မြန်မာနိုင်ငံ၏ ရာသီဥတုဇုန်များအတွက် သီးနှံရွေးချယ်မှုနှင့် စိုက်ပျိုးရေးအကောင်းဆုံးနည်းလမ်းများ
- မြေဆီလွှာစီမံခန့်ခွဲမှုနှင့် ဆည်မြောင်း
- စိုက်ပျိုးရေးအပေါ် ရာသီဥတုသက်ရောက်မှု
- NDVI နှင့် ဂြိုဟ်တုအပင်ကျန်းမာရေးခွဲခြမ်းစိတ်ဖြာခြင်း

မြန်မာတောင်သူများ နားလည်လွယ်သော သဘာဝကျသည့် မြန်မာစကားဖြင့် ဖြေပါ။ မလိုအပ်ဘဲ
အင်္ဂလိပ်စကားလုံးများ မရောပါနှင့်။ နည်းပညာအသုံးအနှုန်း လိုအပ်ပါက မြန်မာလို အဓိပ္ပာယ်ကို
တစ်ပါတည်း ရှင်းပြပါ။ အဖြေကို တိုက်ရိုက်စတင်ပြီး လက်တွေ့လုပ်ဆောင်ရမည့် အဆင့်များ၊
သတိပြုရန်အချက်များနှင့် ဥပမာများကို လိုအပ်သလို ထည့်ပါ။ ဖတ်ရလွယ်စေရန် စာပိုဒ်တိုများ
သို့မဟုတ် အမှတ်စဉ်များ သုံးနိုင်သည်။ ရိုးရှင်းသောမေးခွန်းကို တိုတိုတုတ်တုတ် ဖြေပြီး
ရှုပ်ထွေးသောမေးခွန်းကို နားလည်ပြီး အသုံးချနိုင်လောက်အောင် ရှင်းပြပါ။ ထပ်ခါတလဲလဲ
မရေးပါနှင့်။ သီးနှံ၊ နေရာဒေသ၊ ရာသီ သို့မဟုတ် လယ်ကွင်းဒေတာ မရှိလျှင် အရေးကြီးဆုံး
နောက်ဆက်တွဲမေးခွန်းတစ်ခုသာ မေးပါ။ ခန့်မှန်းချက်ကို ထင်ရှားစွာ ဖော်ပြပြီး လက်ရှိ
ရာသီဥတု၊ ဈေးနှုန်း သို့မဟုတ် တိုင်းတာချက်များကို မဖန်တီးပါနှင့်။ အများအားဖြင့်
တိုတိုရှင်းရှင်း လက်တွေ့လုပ်ဆောင်နိုင်သော အချက် ၃ ချက်မှ ၅ ချက်အထိ ပေးပြီး
အသုံးပြုသူက အသေးစိတ်တောင်းမှသာ ချဲ့ထွင်ရှင်းပြပါ။ မမေးဘဲ မိမိကိုယ်ကို မိတ်ဆက်ခြင်း
မလုပ်ပါနှင့်။ ရိုးရိုးအမှတ်စဉ်ကိုသာ သုံးပြီး Markdown ဇယားနှင့် ** သင်္ကေတများ မသုံးပါနှင့်။"""  # noqa: E501

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


def _request_headers(endpoint: str, api_key: str | None) -> dict[str, str]:
    headers = {"Content-Type": "application/json"}
    hostname = urlparse(endpoint).hostname
    if api_key and hostname not in LOCAL_LLM_HOSTS:
        headers["Authorization"] = f"Bearer {api_key}"
    return headers


def _uses_local_llm(endpoint: str) -> bool:
    return urlparse(endpoint).hostname in LOCAL_LLM_HOSTS


async def stream_chat(
    messages: list[dict],
    language: str,
) -> AsyncGenerator[str, None]:
    settings = get_settings()
    api_key = settings.llm_api_key.get_secret_value() if settings.llm_api_key else None

    url = f"{settings.llm_endpoint.rstrip('/')}/chat/completions"
    headers = _request_headers(settings.llm_endpoint, api_key)
    payload = {
        "model": settings.llm_model,
        "messages": _build_messages(messages, language),
        "stream": True,
        "temperature": 0.45,
        "max_tokens": 768,
    }
    if _uses_local_llm(settings.llm_endpoint):
        payload["reasoning_effort"] = "none"

    async with AsyncClient(timeout=180) as client:
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
        return f"ကျေးဇူးပြု၍ GreenVista API ကို အသုံးပြုရန်အတွက် LLM API သော့ကို သတ်မှတ်ပါ။\n\nမေးခွန်း- {user_msg}"
    return (
        f"GreenVista requires an LLM API key to function. "
        f"Please set the `AGROGUARD_LLM_API_KEY` environment variable.\n\n"
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
    headers = _request_headers(settings.llm_endpoint, api_key)
    payload = {
        "model": settings.llm_model,
        "messages": messages,
        "stream": True,
        "temperature": 0.7,
        "max_tokens": 1024,
    }
    if _uses_local_llm(settings.llm_endpoint):
        payload["reasoning_effort"] = "none"

    async with AsyncClient(timeout=180) as client:
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
        f"Set the AGROGUARD_LLM_API_KEY environment variable for a detailed AI-powered explanation."
    )


