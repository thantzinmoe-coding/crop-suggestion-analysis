import React, { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

export const pcodeMap = {
  en: {
    "MMR001": "Sagaing Region",
    "MMR002": "Bago Region",
    "MMR003": "Magway Region",
    "MMR004": "Mandalay Region",
    "MMR005": "Tanintharyi Region",
    "MMR006": "Ayeyarwady Region",
    "MMR007": "Kachin State",
    "MMR008": "Kayah State",
    "MMR009": "Kayin State",
    "MMR010": "Chin State",
    "MMR011": "Mon State",
    "MMR012": "Rakhine State",
    "MMR013": "Shan State (North)",
    "MMR014": "Yangon Region",
    "MMR015": "Nay Pyi Taw",
    "MMR016": "Shan State (South)",
    "MMR017": "Shan State (East)",
    "MMR018": "Bago Region (East)"
  },
  my: {
    "MMR001": "စစ်ကိုင်းတိုင်းဒေသကြီး",
    "MMR002": "ပဲခူးတိုင်းဒေသကြီး",
    "MMR003": "မကွေးတိုင်းဒေသကြီး",
    "MMR004": "မန္တလေးတိုင်းဒေသကြီး",
    "MMR005": "တနင်္သာရီတိုင်းဒေသကြီး",
    "MMR006": "ဧရာဝတီတိုင်းဒေသကြီး",
    "MMR007": "ကချင်ပြည်နယ်",
    "MMR008": "ကယားပြည်နယ်",
    "MMR009": "ကရင်ပြည်နယ်",
    "MMR010": "ချင်းပြည်နယ်",
    "MMR011": "မွန်ပြည်နယ်",
    "MMR012": "ရခိုင်ပြည်နယ်",
    "MMR013": "ရှမ်းပြည်နယ် (မြောက်ပိုင်း)",
    "MMR014": "ရန်ကုန်တိုင်းဒေသကြီး",
    "MMR015": "နေပြည်တော်",
    "MMR016": "ရှမ်းပြည်နယ် (တောင်ပိုင်း)",
    "MMR017": "ရှမ်းပြည်နယ် (အရှေ့ပိုင်း)",
    "MMR018": "ပဲခူးတိုင်းဒေသကြီး (အရှေ့ပိုင်း)"
  }
};

const translations = {
  en: {
    "nav.landing": "Landing Page",
    "sidebar.title": "Farm Intelligence",
    "sidebar.subtitle": "Clean monitoring and diagnosis for healthy crops.",
    "language.english": "English",
    "language.burmese": "Burmese",
    "app.analytics": "MyanGrow Analytics",

    // App/Sidebar
    "app.title": "AgriDash",
    "nav.ndvi": "NDVI Analysis",
    "nav.suggestion": "Crop Suggestion",
    "nav.chat": "AI Chat",

    // NDVI Analysis
    "ndvi.title": "NDVI Satellite Analysis",
    "ndvi.subtitle": "Monitor crop health from space! NDVI uses satellite images to measure how green and healthy plants are.",
    "ndvi.selectRegion": "Select Region:",
    "ndvi.latestVim": "Current Greenness (VIM)",
    "ndvi.avgVim": "Historical Greenness (5yr)",
    "ndvi.latestViq": "Quality vs Average (VIQ)",
    "ndvi.loading": "Loading satellite data...",
    
    // NDVI Explanations
    "ndvi.whatIsNdvi": "What do these numbers mean?",
    "ndvi.vimDesc": "VIM (Greenness Index): A score measuring the actual density and health of vegetation. Higher numbers mean greener, thicker crops.",
    "ndvi.viqDesc": "VIQ (Quality Percentile): Compares current health to historical averages. Above 50 means better than normal, below 50 means worse than normal.",

    // Crop Suggestion
    "crop.title": "AI Crop Suggestion",
    "crop.subtitle": "Auto-detect your location to get real satellite weather data and smart crop recommendations.",
    "crop.soilPh": "Soil pH Level",
    "crop.rainfall": "Rainfall (7-day, mm)",
    "crop.temp": "Average Temperature (°C)",
    "crop.analyzing": "Analyzing...",
    "crop.suggestBtn": "Get Suggestion",
    "crop.recommended": "Recommended Crop",
    "crop.analysis": "AI Analysis",
    "crop.fillForm": "Detect your location or enter conditions manually to receive a suggestion.",
    "crop.error": "Crop suggestions are not available in this frontend demo.",

    // Location & Weather
    "loc.detect": "📍 Detect My Location",
    "loc.detecting": "Detecting location...",
    "loc.fetchWeather": "Fetching satellite data...",
    "loc.permDenied": "Location permission denied. Please enable GPS or enter values manually.",
    "loc.error": "Could not detect location. Please enter values manually.",
    "loc.region": "Detected Region",
    "loc.coordinates": "Coordinates",
    "loc.currentTemp": "Current Temperature",
    "loc.rain7d": "Rainfall (7 days)",
    "loc.humidity": "Humidity",
    "loc.soilPh": "Est. Soil pH",
    "loc.source": "Data: NASA POWER Satellite",
    "loc.phNote": "Regional estimate — adjust if you have soil test results",
    "loc.advisories": "Smart Advisories",
    "loc.override": "You can adjust values before getting a suggestion",
    "loc.manualMode": "Enter Manually",
    "loc.autoMode": "Use Satellite Data",
    
    // AI Chat
    "chat.title": "AI Chat",
    "chat.powered": "Powered by Gemma 4 (Local LLM)",
    "chat.placeholder": "Ask about agriculture, crops, climate...",
    "chat.error": "Sorry, I encountered an error connecting to the local LLM.",
    "chat.welcome": "Hello! I am your AI Agricultural Assistant for Myanmar (Powered by Gemma 4). How can I help you today?",

    // Auth
    "auth.welcomeBack": "Welcome Back",
    "auth.createAccount": "Create Account",
    "auth.loginSubtitle": "Sign in to access your AgroGuard dashboard",
    "auth.registerSubtitle": "Join AgroGuard and start managing your farm",
    "auth.loginBtn": "Sign In",
    "auth.registerBtn": "Sign Up",
    "auth.fillFields": "Please fill in all fields",
    "auth.passwordMismatch": "Passwords do not match",
    "auth.email": "Email Address",
    "auth.password": "Password",
    "auth.confirmPassword": "Confirm Password",
  },
  my: {
    "nav.landing": "ပင်မစာမျက်နှာ",
    "sidebar.title": "လယ်ယာ အသိဉာဏ်စနစ်",
    "sidebar.subtitle": "ကျန်းမာသောသီးနှံများအတွက် စောင့်ကြည့်ခြင်းနှင့် ရောဂါရှာဖွေခြင်း။",
    "language.english": "English", "language.burmese": "မြန်မာ",
    "app.analytics": "MyanGrow စိုက်ပျိုးရေး သုံးသပ်ချက်",

    // App/Sidebar
    "app.title": "စိုက်ပျိုးရေးဒက်ရှ်ဘုတ်",
    "nav.ndvi": "NDVI ဂြိုလ်တုပုံရိပ်",
    "nav.suggestion": "သီးနှံအကြံပြုချက်",
    "nav.chat": "AI စကားပြောခန်း",

    // NDVI Analysis
    "ndvi.title": "NDVI ဂြိုလ်တု ခွဲခြမ်းစိတ်ဖြာခြင်း",
    "ndvi.subtitle": "အာကာသမှနေ၍ သီးနှံများ၏ ကျန်းမာရေးကို စောင့်ကြည့်ပါ! NDVI ဆိုတာ ဂြိုလ်တုပုံရိပ်များကို အသုံးပြုပြီး အပင်များ ဘယ်လောက် စိမ်းလန်းကျန်းမာနေသလဲဆိုတာကို တိုင်းတာပေးတာပါ။",
    "ndvi.selectRegion": "ဒေသရွေးချယ်ပါ:",
    "ndvi.latestVim": "လက်ရှိ စိမ်းလန်းမှု (VIM)",
    "ndvi.avgVim": "ယခင် စိမ်းလန်းမှု (၅ နှစ်)",
    "ndvi.latestViq": "ယခင်နှစ်များနှင့် နှိုင်းယှဉ်ချက် (VIQ)",
    "ndvi.loading": "ဂြိုလ်တုဒေတာ ရယူနေသည်...",

    // NDVI Explanations
    "ndvi.whatIsNdvi": "ဤဂဏန်းများက ဘာကိုဆိုလိုသနည်း?",
    "ndvi.vimDesc": "VIM (စိမ်းလန်းမှု အညွှန်းကိန်း): အပင်များ၏ သိပ်သည်းဆနှင့် ကျန်းမာရေးကို တိုင်းတာသော အမှတ်။ ဂဏန်းပိုများလေ သီးနှံများ ပိုမိုစိမ်းလန်းထူထပ်လေ ဖြစ်သည်။",
    "ndvi.viqDesc": "VIQ (အရည်အသွေး ရာခိုင်နှုန်း): လက်ရှိကျန်းမာရေးကို ယခင်နှစ်များ၏ ပျမ်းမျှအခြေအနေနှင့် နှိုင်းယှဉ်ပြသည်။ ၅၀ အထက်ဆိုလျှင် ပုံမှန်ထက် ပိုကောင်းပြီး၊ ၅၀ အောက်ဆိုလျှင် ပုံမှန်ထက် ဆိုးရွားသည်ဟု ဆိုလိုသည်။",

    // Crop Suggestion
    "crop.title": "AI သီးနှံအကြံပြုချက်",
    "crop.subtitle": "သင့်တည်နေရာကို ရှာဖွေပြီး ဂြိုလ်တု ရာသီဥတုဒေတာနှင့် စမတ် သီးနှံ အကြံပြုချက်ကို ရယူပါ။",
    "crop.soilPh": "မြေဆီလွှာ pH အဆင့်",
    "crop.rainfall": "မိုးရေချိန် (၇ ရက်, mm)",
    "crop.temp": "ပျမ်းမျှ အပူချိန် (°C)",
    "crop.analyzing": "ခွဲခြမ်းစိတ်ဖြာနေသည်...",
    "crop.suggestBtn": "အကြံပြုချက် ရယူရန်",
    "crop.recommended": "အကြံပြုထားသော သီးနှံ",
    "crop.analysis": "AI ခွဲခြမ်းစိတ်ဖြာချက်",
    "crop.fillForm": "သင့်တည်နေရာ ရှာဖွေပါ သို့မဟုတ် ကိုယ်တိုင် ထည့်သွင်းပြီး အကြံပြုချက် ရယူပါ။",
    "crop.error": "အကြံပြုချက် ရယူရန် မအောင်မြင်ပါ။ ML မော်ဒယ်နှင့် နောက်ကွယ်ပိုင်း အလုပ်လုပ်နေကြောင်း သေချာပါစေ။",

    // Location & Weather
    "loc.detect": "📍 ကျွန်ုပ်၏ တည်နေရာ ရှာဖွေပါ",
    "loc.detecting": "တည်နေရာ ရှာဖွေနေသည်...",
    "loc.fetchWeather": "ဂြိုလ်တုဒေတာ ရယူနေသည်...",
    "loc.permDenied": "တည်နေရာ ခွင့်ပြုချက် ပြန်လည်ငြင်းပယ်ထားသည်။ GPS ဖွင့်ပါ သို့မဟုတ် ကိုယ်တိုင် ထည့်သွင်းပါ။",
    "loc.error": "တည်နေရာ ရှာမတွေ့ပါ။ ကိုယ်တိုင် ထည့်သွင်းပါ။",
    "loc.region": "ရှာဖွေတွေ့ရှိသော ဒေသ",
    "loc.coordinates": "ကိုဩဒိနိတ်",
    "loc.currentTemp": "လက်ရှိ အပူချိန်",
    "loc.rain7d": "မိုးရေချိန် (၇ ရက်)",
    "loc.humidity": "စိုထိုင်းဆ",
    "loc.soilPh": "ခန့်မှန်း မြေ pH",
    "loc.source": "ဒေတာ: NASA POWER ဂြိုလ်တု",
    "loc.phNote": "ဒေသတွင်း ခန့်မှန်းချက် — မြေစစ်ဆေးမှု ရလဒ်ရှိပါက ပြင်ဆင်ပါ",
    "loc.advisories": "စမတ် အကြံပြုချက်များ",
    "loc.override": "အကြံပြုချက် မရယူမီ တန်ဖိုးများ ပြင်ဆင်နိုင်ပါသည်",
    "loc.manualMode": "ကိုယ်တိုင် ထည့်သွင်းရန်",
    "loc.autoMode": "ဂြိုလ်တုဒေတာ သုံးရန်",

    // AI Chat
    "chat.title": "AI စကားပြောခန်း",
    "chat.powered": "Gemma 4 (Local LLM) မှ ပံ့ပိုးသည်",
    "chat.placeholder": "စိုက်ပျိုးရေး၊ သီးနှံများ၊ ရာသီဥတုအကြောင်း မေးမြန်းပါ...",
    "chat.error": "ဆာဗာသို့ ချိတ်ဆက်၍ မရပါ။",
    "chat.welcome": "မင်္ဂလာပါ! ကျွန်ုပ်သည် သင့်အတွက် မြန်မာနိုင်ငံ စိုက်ပျိုးရေးဆိုင်ရာ AI အကူအညီပေးသူ (Gemma 4) ဖြစ်ပါသည်။ မည်သို့ ကူညီပေးရမလဲ?",

    // Auth
    "auth.welcomeBack": "ပြန်လည်ကြိုဆိုပါသည်",
    "auth.createAccount": "အကောင့်ဖန်တီးပါ",
    "auth.loginSubtitle": "သင့် AgroGuard ဒက်ရှ်ဘုတ်သို့ ဝင်ရောက်ရန် အကောင့်ဝင်ပါ",
    "auth.registerSubtitle": "AgroGuard တွင်ပါဝင်ပြီး သင့်လယ်ယာကို စီမံခန့်ခွဲပါ",
    "auth.loginBtn": "အကောင့်ဝင်ရန်",
    "auth.registerBtn": "အကောင့်ဖွင့်ရန်",
    "auth.fillFields": "ကျေးဇူးပြု၍ အချက်အလက်အားလုံးကို ဖြည့်စွက်ပါ",
    "auth.passwordMismatch": "စကားဝှက်များ မကိုက်ညီပါ",
    "auth.email": "အီးမေးလ် လိပ်စာ",
    "auth.password": "စကားဝှက်",
    "auth.confirmPassword": "စကားဝှက် အတည်ပြုပါ",
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  const t = (key) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'my' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}