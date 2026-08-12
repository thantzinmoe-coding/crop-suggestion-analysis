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
    "nav.home": "Home",
    "nav.fieldHealth": "Field health",
    "nav.cropPlanner": "Crop planner",
    "nav.aiGuide": "AI guide",
    "nav.workspace": "Workspace",
    "nav.farmIntelligence": "Farm intelligence",
    "nav.sidebarDescription": "Clear tools for healthier fields and better crop decisions.",
    "nav.navigate": "Navigate",
    "nav.close": "Close navigation",
    "nav.open": "Open navigation",
    "nav.mobileFooter": "Field intelligence for clearer farming decisions.",
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
    "ndvi.location": "NDVI LOCATION",
    "ndvi.stateRegion": "State or Region",
    "ndvi.districtDetail": "Optional district detail",
    "ndvi.allDistricts": "All districts (state overview)",
    "ndvi.loadingData": "Loading NDVI data...",
    
    // NDVI Explanations
    "ndvi.whatIsNdvi": "What do these numbers mean?",
    "ndvi.vimDesc": "VIM (Greenness Index): A score measuring the actual density and health of vegetation. Higher numbers mean greener, thicker crops.",
    "ndvi.viqDesc": "VIQ (Quality Percentile): Compares current health to historical averages. Above 50 means better than normal, below 50 means worse than normal.",

    // Crop Suggestion
    "crop.pageEyebrow": "Smart crop planning",
    "crop.benefitSatellite": "Satellite weather",
    "crop.benefitLocal": "Local conditions",
    "crop.benefitGuidance": "Practical guidance",
    "crop.fieldData": "Field data",
    "crop.chooseSource": "Choose your data source",
    "crop.currentLocation": "Use current field location",
    "crop.retrieveWeather": "Retrieve regional weather conditions from your coordinates.",
    "crop.ownMeasurements": "Use your own measurements",
    "crop.enterReadings": "Enter recent soil and weather readings in the next step.",
    "crop.growingConditions": "Growing conditions",
    "crop.reviewField": "Review your field",
    "crop.currentConditions": "Based on current conditions",
    "crop.growingProfile": "Growing profile",
    "crop.yearGrowth": "year growth period",
    "crop.waterNeed": "water-need units/day",
    "crop.latestMarketPrice": "Latest market price",
    "crop.suitable": "suitable",
    "crop.chooseCrop": "Choose a crop recommendation",
    "crop.option": "Option",
    "crop.marketValue": "Market value",
    "crop.productWeight": "Product weight (kg)",
    "crop.estimatedValue": "Estimated value",
    "common.close": "Close",
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
    "loc.detect": "Detect My Location",
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
    "auth.loginSubtitle": "Sign in to access your GreenVista dashboard",
    "auth.registerSubtitle": "Join GreenVista and start managing your farm",
    "auth.loginBtn": "Sign In",
    "auth.registerBtn": "Sign Up",
    "auth.logout": "Sign out",
    "auth.fillFields": "Please fill in all fields",
    "auth.passwordMismatch": "Passwords do not match",
    "auth.email": "Email Address",
    "auth.password": "Password",
    "auth.confirmPassword": "Confirm Password",
  },
  my: {
    "nav.landing": "ပင်မစာမျက်နှာ",
    "nav.home": "ပင်မစာမျက်နှာ",
    "nav.fieldHealth": "လယ်ကွင်းကျန်းမာရေး",
    "nav.cropPlanner": "သီးနှံစီမံကိန်း",
    "nav.aiGuide": "AI လမ်းညွှန်",
    "nav.workspace": "လုပ်ငန်းခွင်",
    "nav.farmIntelligence": "လယ်ယာအချက်အလက်",
    "nav.sidebarDescription": "ကျန်းမာသောလယ်ကွင်းများနှင့် ပိုမိုကောင်းမွန်သော သီးနှံဆုံးဖြတ်ချက်များအတွက် ရှင်းလင်းသောကိရိယာများ။",
    "nav.navigate": "သွားရန်",
    "nav.close": "လမ်းညွှန်မှု ပိတ်ရန်",
    "nav.open": "လမ်းညွှန်မှု ဖွင့်ရန်",
    "nav.mobileFooter": "ပိုမိုရှင်းလင်းသော စိုက်ပျိုးရေးဆုံးဖြတ်ချက်များအတွက် လယ်ယာအချက်အလက်။",
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
    "crop.pageEyebrow": "သီးနှံစီမံကိန်း",
    "crop.benefitSatellite": "ဂြိုဟ်တုရာသီဥတု",
    "crop.benefitLocal": "ဒေသအခြေအနေ",
    "crop.benefitGuidance": "လက်တွေ့လမ်းညွှန်ချက်",
    "crop.fieldData": "လယ်ကွင်းအချက်အလက်",
    "crop.chooseSource": "အချက်အလက်ရင်းမြစ် ရွေးချယ်ပါ",
    "crop.currentLocation": "လက်ရှိလယ်ကွင်းတည်နေရာကို အသုံးပြုရန်",
    "crop.retrieveWeather": "သင့်တည်နေရာမှ ဒေသဆိုင်ရာရာသီဥတုအခြေအနေကို ရယူပါ။",
    "crop.ownMeasurements": "သင့်ကိုယ်ပိုင်တိုင်းတာချက်များကို အသုံးပြုရန်",
    "crop.enterReadings": "နောက်တစ်ဆင့်တွင် မြေနှင့်ရာသီဥတု တိုင်းတာချက်များကို ထည့်ပါ။",
    "crop.growingConditions": "စိုက်ပျိုးမှုအခြေအနေများ",
    "crop.reviewField": "သင့်လယ်ကွင်းကို စစ်ဆေးပါ",
    "crop.currentConditions": "လက်ရှိအခြေအနေအပေါ် အခြေခံ၍",
    "crop.growingProfile": "စိုက်ပျိုးမှုအချက်အလက်",
    "crop.yearGrowth": "နှစ် ကြီးထွားကာလ",
    "crop.waterNeed": "တစ်နေ့ ရေလိုအပ်ချက်ယူနစ်",
    "crop.latestMarketPrice": "နောက်ဆုံးစျေးကွက်စျေးနှုန်း",
    "crop.chooseCrop": "သီးနှံရွေးချယ်ပါ",
    "crop.option": "ရွေးချယ်မှု",
    "crop.marketValue": "စျေးကွက်တန်ဖိုး",
    "crop.productWeight": "ထွက်ကုန်အလေးချိန် (ကီလိုဂရမ်)",
    "crop.estimatedValue": "ခန့်မှန်းတန်ဖိုး",
    "common.close": "ပိတ်ရန်",
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
    "loc.detect": "ကျွန်ုပ်၏ တည်နေရာ ရှာဖွေပါ",
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
    "auth.loginSubtitle": "သင့် GreenVista ဒက်ရှ်ဘုတ်သို့ ဝင်ရောက်ရန် အကောင့်ဝင်ပါ",
    "auth.registerSubtitle": "GreenVista တွင်ပါဝင်ပြီး သင့်လယ်ယာကို စီမံခန့်ခွဲပါ",
    "auth.loginBtn": "အကောင့်ဝင်ရန်",
    "auth.registerBtn": "အကောင့်ဖွင့်ရန်",
    "auth.logout": "ထွက်ရန်",
    "auth.fillFields": "ကျေးဇူးပြု၍ အချက်အလက်အားလုံးကို ဖြည့်စွက်ပါ",
    "auth.passwordMismatch": "စကားဝှက်များ မကိုက်ညီပါ",
    "auth.email": "အီးမေးလ် လိပ်စာ",
    "auth.password": "စကားဝှက်",
    "auth.confirmPassword": "စကားဝှက် အတည်ပြုပါ",
  }
};

const myOverrides = {
  "ndvi.location": "NDVI တည်နေရာ",
  "ndvi.stateRegion": "ပြည်နယ် သို့မဟုတ် တိုင်းဒေသကြီး",
  "ndvi.districtDetail": "ခရိုင်အသေးစိတ် (ရွေးချယ်နိုင်သည်)",
  "ndvi.allDistricts": "ခရိုင်အားလုံး (ပြည်နယ်အနှစ်ချုပ်)",
  "ndvi.loadingData": "NDVI အချက်အလက်များကို ရယူနေသည်...",
  "crop.suitable": "သင့်တော်မှု",
}

Object.assign(myOverrides, {
  "nav.home": "ပင်မစာမျက်နှာ",
  "nav.fieldHealth": "စိုက်ခင်းကျန်းမာရေး",
  "nav.cropPlanner": "သီးနှံစိုက်ပျိုးမှု စီမံကိန်း",
  "nav.aiGuide": "AI လမ်းညွှန်",
  "nav.workspace": "လုပ်ငန်းခွင်",
  "nav.farmIntelligence": "စိုက်ပျိုးရေး အချက်အလက်စနစ်",
  "nav.sidebarDescription": "ပိုမိုကောင်းမွန်သော သီးနှံနှင့် စိုက်ခင်းဆုံးဖြတ်ချက်များအတွက် တိကျသည့် ကိရိယာများ။",
  "nav.navigate": "လမ်းညွှန် ပုံဖော်ရန်",
  "nav.close": "လမ်းညွှန် ပိတ်ရန်",
  "nav.open": "လမ်းညွှန် ဖွင့်ရန်",
  "nav.mobileFooter": "ပိုမိုရှင်းလင်းသော စိုက်ပျိုးရေး ဆုံးဖြတ်ချက်များအတွက် စိုက်ခင်းအချက်အလက်။",
  "crop.pageEyebrow": "စမတ် သီးနှံစိုက်ပျိုးမှု စီမံကိန်း",
  "crop.benefitSatellite": "ဂြိုဟ်တု ရာသီဥတု အချက်အလက်",
  "crop.benefitLocal": "ဒေသတွင်း အခြေအနေများ",
  "crop.benefitGuidance": "လက်တွေ့ကျသော လမ်းညွှန်ချက်များ",
  "crop.fieldData": "စိုက်ခင်း အချက်အလက်",
  "crop.chooseSource": "အချက်အလက် ရယူမည့် နည်းလမ်းကို ရွေးချယ်ပါ",
  "crop.currentLocation": "လက်ရှိ စိုက်ခင်းတည်နေရာကို အသုံးပြုရန်",
  "crop.retrieveWeather": "သင်၏ တည်နေရာ အမှတ်စဉ်များမှ ဒေသတွင်း ရာသီဥတု အခြေအနေကို ရယူပါ။",
  "crop.ownMeasurements": "မိမိကိုယ်တိုင် တိုင်းတာထားသော အချက်အလက်များကို အသုံးပြုရန်",
  "crop.enterReadings": "နောက်တစ်ဆင့်တွင် လတ်တလော တိုင်းတာထားသော မြေဆီလွှာနှင့် ရာသီဥတု အချက်အလက်များကို ဖြည့်သွင်းပါ။",
  "crop.growingConditions": "စိုက်ပျိုးရေး အခြေအနေများ",
  "crop.reviewField": "စိုက်ခင်းကို ပြန်လည်စစ်ဆေးရန်",
  "crop.currentConditions": "လက်ရှိ အခြေအနေများပေါ် မူတည်၍",
  "crop.growingProfile": "စိုက်ပျိုးမှုဆိုင်ရာ အချက်အလက်",
  "crop.yearGrowth": "နှစ်အလိုက် စိုက်ပျိုးကာလ",
  "crop.waterNeed": "တစ်ရက်လျှင် လိုအပ်သော ရေပမာဏ (ယူနစ်)",
  "crop.latestMarketPrice": "နောက်ဆုံး ပေါက်စျေး",
  "crop.chooseCrop": "အကြံပြုထားသော သီးနှံကို ရွေးချယ်ပါ",
  "crop.option": "ရွေးချယ်စရာ",
  "crop.marketValue": "စျေးကွက်တန်ဖိုး",
  "crop.productWeight": "ထွက်ရှိမည့် အလေးချိန် (ကီလိုဂရမ်)",
  "crop.estimatedValue": "ခန့်မှန်းခြေ တန်ဖိုး",
  "crop.suitable": "သင့်တော်သော",
  "common.close": "ပိတ်ရန်",
  "ndvi.location": "NDVI တည်နေရာ",
  "ndvi.stateRegion": "ပြည်နယ် သို့မဟုတ် တိုင်းဒေသကြီး",
  "ndvi.districtDetail": "ခရိုင် အသေးစိတ် (စိတ်ကြိုက်)",
  "ndvi.allDistricts": "ခရိုင်အားလုံး (ပြည်နယ်/တိုင်း အကျဉ်းချုပ်)",
  "ndvi.loadingData": "NDVI အချက်အလက်များ ရယူနေပါသည်..."
});

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  const t = (key) => {
    return (language === 'my' ? myOverrides[key] : null) || translations[language][key] || translations['en'][key] || key;
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
