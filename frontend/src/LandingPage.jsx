import {
  ArrowRight,
  Bot,
  Languages,
  LogOut,
  Radar,
  Sparkles,
  Sprout,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import AuthModal from './components/AuthModal.jsx'
import GreenVistaMark from './components/GreenVistaMark.jsx'
import { useAuth } from './contexts/AuthContext.jsx'
import { useLanguage } from './contexts/LanguageContext.jsx'

const capabilities = [
  {
    number: '01',
    icon: Radar,
    title: 'capabilityHealth',
    description: 'capabilityHealthDescription',
    link: '/ndvi-analysis',
  },
  {
    number: '02',
    icon: Sprout,
    title: 'capabilityCrops',
    description: 'capabilityCropsDescription',
    link: '/crop-suggestion',
  },
  {
    number: '03',
    icon: Bot,
    title: 'capabilityChat',
    description: 'capabilityChatDescription',
    link: '/ai-chat',
  },
]

const steps = [
  ['stepLocate', 'stepLocateDescription'],
  ['stepUnderstand', 'stepUnderstandDescription'],
  ['stepDecide', 'stepDecideDescription'],
]

const landingText = {
  en: {
    navPlatform: 'Platform', navProcess: 'How it works', navImpact: 'Our impact', navExplore: 'Explore field',
    kicker: 'Built for every field', heroTitle: 'Smarter Fields', heroTitleSecond: 'Better Harvests',
    heroCopy: 'Field insights, crop planning, and practical AI guidance for clearer decisions.',
    explore: 'Explore your field', start: 'Start growing', discover: 'Discover the platform',
    platformEyebrow: 'One connected platform', platformTitle: 'From a changing field to a confident next step.',
    platformCopy: 'Three focused tools turn complex agricultural signals into information people can understand and use.',
    exploreTool: 'Explore tool', processEyebrow: 'Simple by design', processTitle: 'Field intelligence without the complexity.',
    impactEyebrow: 'Grow with confidence', impactTitle: 'Good decisions begin with a clearer view.',
    impactCopy: 'Bring field signals, growing conditions, and agricultural knowledge into one approachable place.', launch: 'Launch GreenVista',
    capabilityHealth: 'See field health clearly.', capabilityHealthDescription: 'Turn regional NDVI signals into readable vegetation trends and early field-health context.',
    capabilityCrops: 'Choose crops with context.', capabilityCropsDescription: 'Compare suitable crops using local rainfall, temperature, soil conditions, and market value.',
    capabilityChat: 'Ask practical questions.', capabilityChatDescription: 'Get concise agricultural guidance in one calm workspace designed around Myanmar farming decisions.',
    stepLocate: 'Locate', stepLocateDescription: 'Use your position or enter field conditions manually.',
    stepUnderstand: 'Understand', stepUnderstandDescription: 'Review satellite weather, vegetation trends, and practical advisories.',
    stepDecide: 'Decide', stepDecideDescription: 'Compare crops and move forward with clearer context.',
  },
  my: {
    
  "navPlatform": "လုပ်ဆောင်ချက်များ",
  "navProcess": "အလုပ်လုပ်ပုံ",
  "navImpact": "ရရှိနိုင်မည့် အကျိုးကျေးဇူး",
  "navExplore": "စိုက်ခင်းကို လေ့လာရန်",
  "kicker": "စိုက်ခင်းတိုင်းအတွက် အထူးထုတ်လုပ်ထားသည်",
  "heroTitle": "နည်းပညာသုံး စိုက်ပျိုးပြီး",
  "heroTitleSecond": "အထွက်နှုန်း ပိုမိုရယူပါ",
  "heroCopy": "ပိုမိုတိကျသော ဆုံးဖြတ်ချက်များအတွက် စိုက်ခင်းအချက်အလက်များ၊ သီးနှံစီမံကိန်းနှင့် လက်တွေ့ကျသော AI လမ်းညွှန်ချက်များ။",
  "explore": "စိုက်ခင်းအခြေအနေကြည့်ရန်",
  "start": "စိုက်ပျိုးမှု စတင်ရန်",
  "discover": "စနစ် အသုံးပြုပုံများကို လေ့လာရန်",
  "platformEyebrow": "နေရာတစ်ခုတည်းမှာ ပေါင်းစည်းထားသော စနစ်",
  "platformTitle": "ပြောင်းလဲနေသော စိုက်ခင်းမှသည် ယုံကြည်စိတ်ချရသော ဆုံးဖြတ်ချက်များဆီသို့",
  "platformCopy": "ရှုပ်ထွေးသော စိုက်ပျိုးရေးဆိုင်ရာ အချက်အလက်များကို လူတိုင်းလွယ်ကူစွာ နားလည်အသုံးပြုနိုင်သည့် အချက်အလက်များအဖြစ် ကိရိယာ (၃) ခုဖြင့် ပြောင်းလဲပေးသည်။",
  "exploreTool": "ကိရိယာများကို စမ်းသုံးရန်",
  "processEyebrow": "ရိုးရှင်းလွယ်ကူသော ဒီဇိုင်း",
  "processTitle": "ရှုပ်ထွေးမှုမရှိဘဲ လွယ်ကူသော စိုက်ပျိုးရေး အချက်အလက်စနစ်။",
  "impactEyebrow": "ယုံကြည်မှုရှိရှိ စိုက်ပျိုးပါ",
  "impactTitle": "မှန်ကန်သော ဆုံးဖြတ်ချက်များသည် တိကျသော အချက်အလက်များမှ စတင်သည်",
  "impactCopy": "စိုက်ခင်း၏ အခြေအနေ၊ ရာသီဥတုနှင့် စိုက်ပျိုးရေး အသိပညာများကို တစ်နေရာတည်းမှာ ရယူလိုက်ပါ",
  "launch": "GreenVista အသုံးပြုမည်",
  "capabilityHealth": "စိုက်ခင်းအခြေအနေကို ရှင်းလင်းစွာ ကြည့်ရှုပါ။",
  "capabilityHealthDescription": "ဒေသတွင်း NDVI အချက်အလက်များကို ဖတ်ရှုရလွယ်ကူသော အပင်ဖြစ်ထွန်းမှု အခြေအနေနှင့် စိုက်ခင်းအခြေအနေ သုံးသပ်ချက်များအဖြစ် ပြောင်းလဲပေးသည်။",
  "capabilityCrops": "အခြေအနေနှင့် ကိုက်ညီသော သီးနှံများကို ရွေးချယ်ပါ",
  "capabilityCropsDescription": "ဒေသတွင်း မိုးရေချိန်၊ အပူချိန်၊ မြေဆီလွှာအခြေအနေနှင့် စျေးကွက်တန်ဖိုးများကို နှိုင်းယှဉ်၍ သင့်တော်သော သီးနှံများကို ရွေးချယ်ပါ။",
  "capabilityChat": "သိလိုသည်များကို တိုက်ရိုက်မေးမြန်းပါ",
  "capabilityChatDescription": "မြန်မာ့စိုက်ပျိုးရေးအတွက် သီးသန့်ထုတ်လုပ်ထားသော AI မှတစ်ဆင့် စိုက်ပျိုးရေး လမ်းညွှန်ချက်များကို တိုတောင်းရှင်းလင်းစွာ ရယူလိုက်ပါ",
  "stepLocate": "တည်နေရာ သတ်မှတ်ရန်",
  "stepLocateDescription": "မိမိတည်နေရာကို အသုံးပြုပါ သို့မဟုတ် စိုက်ခင်းအခြေအနေများကို ကိုယ်တိုင် ဖြည့်သွင်းပါ။",
  "stepUnderstand": "အခြေအနေကို လေ့လာပါ",
  "stepUnderstandDescription": "ဂြိုဟ်တု ရာသီဥတု၊ အပင်ဖြစ်ထွန်းမှုနှင့် လက်တွေ့ကျသော အကြံပြုချက်များကို စစ်ဆေးပါ။",
  "stepDecide": "ဆုံးဖြတ်ချက်ချရန်",
  "stepDecideDescription": "သီးနှံများကို အပြန်အလှန် နှိုင်းယှဉ်ပြီး စိတ်ချယုံကြည်စွာ စိုက်ပျိုးပါ",

  "capabilityHealth": "စိုက်ခင်းအခြေအနေကို ရှင်းလင်းစွာ ကြည့်ရှုပါ။",
  "capabilityHealthDescription": "ဒေသတွင်း NDVI အချက်အလက်များကို ဖတ်ရှုလွယ်သော အပင်အခြေအနေ လမ်းကြောင်းများအဖြစ် ပြောင်းလဲပေးပါသည်။",
  "capabilityCrops": "အခြေအနေများကို ထည့်သွင်းစဉ်းစား၍ သီးနှံရွေးချယ်ပါ။",
  "capabilityCropsDescription": "ဒေသတွင်း မိုးရေချိန်၊ အပူချိန်၊ မြေဆီလွှာအခြေအနေနှင့် စျေးကွက်တန်ဖိုးတို့ကို နှိုင်းယှဉ်ပြီး သင့်တော်သော သီးနှံများကို ရွေးချယ်ပါ။",
  "capabilityChat": "လက်တွေ့ကျသော မေးခွန်းများကို မေးမြန်းပါ။",
  "capabilityChatDescription": "မြန်မာနိုင်ငံရှိ စိုက်ပျိုးရေး ဆုံးဖြတ်ချက်များအတွက် ရိုးရှင်းပြီး တိုတောင်းသော AI လမ်းညွှန်ချက်များကို ရယူပါ။",
  },
}

function LandingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, logout } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const lt = (key) => landingText[language]?.[key] || landingText.en[key] || key
  const [authMode, setAuthMode] = useState(null)

  useEffect(() => {
    const mode = new URLSearchParams(location.search).get('auth')
    if (mode === 'signin' || mode === 'signup') setAuthMode(mode)
  }, [location])

  const openWorkspace = (mode = 'signup', path = '/crop-suggestion') => {
    if (currentUser) navigate(path)
    else setAuthMode(mode)
  }

  const closeAuth = () => {
    setAuthMode(null)
    if (location.search.includes('auth=')) navigate('/', { replace: true })
  }

  return (
    <main className={`agro-site ${language === 'my' ? 'language-my' : ''}`}>
      <a className="agro-skip-link" href="#platform">Skip to main content</a>
      <section className="agro-hero" aria-labelledby="hero-title">
        <img
          className="agro-hero-art"
          src="/images/agroguard-farmers-hero.webp"
          alt="Farmers transplanting young rice seedlings in a paddy field at sunrise"
          width="1672"
          height="941"
          fetchPriority="high"
        />
        <div className="agro-hero-shade" aria-hidden="true" />

        <nav className="agro-nav" aria-label="Primary navigation">
          <a className="agro-brand" href="#top" aria-label="GreenVista home">
            <span className="agro-brand-mark"><GreenVistaMark /></span>
            <span>GREEN<strong>VISTA</strong></span>
          </a>

          <div className="agro-nav-links">
            <a href="#platform">{lt('navPlatform')}</a>
            <a href="#process">{lt('navProcess')}</a>
            <a href="#impact">{lt('navImpact')}</a>
            <button className="agro-nav-explore" type="button" onClick={() => openWorkspace('signup', '/crop-suggestion')}>{lt('navExplore')}</button>
          </div>

          {currentUser ? (
            <div className="agro-nav-account">
              <div className="agro-home-language" aria-label="Language selector">
                <Languages size={18} aria-hidden="true" />
                <button type="button" className={language === 'en' ? 'active' : ''} aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button>
                <button type="button" className={language === 'my' ? 'active' : ''} aria-pressed={language === 'my'} onClick={() => setLanguage('my')}>MY</button>
              </div>
              <button className="agro-home-signout" type="button" onClick={logout}>
                <LogOut size={19} aria-hidden="true" />
                <span>{t('auth.logout')}</span>
              </button>
            </div>
          ) : (
            <div className="agro-nav-account">
              <div className="agro-home-language" aria-label="Language selector">
                <Languages size={18} aria-hidden="true" />
                <button type="button" className={language === 'en' ? 'active' : ''} aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button>
                <button type="button" className={language === 'my' ? 'active' : ''} aria-pressed={language === 'my'} onClick={() => setLanguage('my')}>MY</button>
              </div>
              <button className="agro-pill agro-pill-dark agro-nav-cta" type="button" onClick={() => openWorkspace('signin')}>{t('auth.loginBtn')}</button>
            </div>
          )}
        </nav>

        <div className="agro-hero-inner" id="top">
          <div className="agro-kicker"><Sparkles size={15} /> {lt('kicker')}</div>
          <h1 id="hero-title">{lt('heroTitle')}<br />{lt('heroTitleSecond')}</h1>
          <p className="agro-hero-copy">
            {lt('heroCopy')}
          </p>
          <div className="agro-hero-actions">
            <button className="agro-pill agro-pill-dark" type="button" onClick={() => openWorkspace('signup')}>
              {currentUser ? lt('explore') : lt('start')} <ArrowRight size={18} />
            </button>
            <a className="agro-text-link" href="#platform">{lt('discover')} <span aria-hidden="true">↘</span></a>
          </div>
        </div>
      </section>

      <section className="agro-section agro-platform" id="platform">
        <div className="agro-section-heading">
          <p className="agro-eyebrow">{lt('platformEyebrow')}</p>
          <h2>{lt('platformTitle')}</h2>
          <p>{lt('platformCopy')}</p>
        </div>

        <div className="agro-capability-grid">
          {capabilities.map(({ number, icon: Icon, title, description, link }) => (
            <article className="agro-capability" key={number}>
              <div className="agro-capability-top">
                <span>{number}</span>
                <span className="agro-icon"><Icon size={23} /></span>
              </div>
              <h3>{lt(title)}</h3>
              <p>{lt(description)}</p>
              <button type="button" onClick={() => openWorkspace('signup', link)}>
                {lt('exploreTool')} <ArrowRight size={16} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="agro-section agro-process" id="process">
        <figure className="agro-process-visual">
          <img
            src="/images/agroguard-field-intelligence.webp"
            alt="Aerial view of healthy rice fields and irrigation channels in morning light"
            loading="lazy"
            decoding="async"
          />
        </figure>

        <div className="agro-process-copy">
          <p className="agro-eyebrow">{lt('processEyebrow')}</p>
          <h2>
            <span>{lt('processTitle')}</span>
          </h2>
          <div className="agro-steps">
            {steps.map(([title, description], index) => (
              <div className="agro-step" key={title}>
                <span>0{index + 1}</span>
                <div><h3>{lt(title)}</h3><p>{lt(description)}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="agro-impact-wrap" id="impact">
        <div className="agro-impact">
          <div>
            <p className="agro-eyebrow">{lt('impactEyebrow')}</p>
            <h2>{lt('impactTitle')}</h2>
          </div>
          <div className="agro-impact-copy">
            <p>{lt('impactCopy')}</p>
            <button className="agro-pill agro-pill-light" type="button" onClick={() => openWorkspace('signup')}>
              {lt('launch')} <ArrowRight size={18} />
            </button>
          </div>
          <Sprout className="agro-impact-leaf" size={190} strokeWidth={0.8} aria-hidden="true" />
        </div>
      </section>

      {authMode && (
        <AuthModal initialMode={authMode} onClose={closeAuth} onSuccess={() => navigate('/crop-suggestion')} />
      )}
    </main>
  )
}

export default LandingPage
