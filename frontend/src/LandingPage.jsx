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
    title: 'landing.capabilityHealth',
    description: 'landing.capabilityHealthDescription',
    link: '/ndvi-analysis',
  },
  {
    number: '02',
    icon: Sprout,
    title: 'landing.capabilityCrops',
    description: 'landing.capabilityCropsDescription',
    link: '/crop-suggestion',
  },
  {
    number: '03',
    icon: Bot,
    title: 'landing.capabilityChat',
    description: 'landing.capabilityChatDescription',
    link: '/ai-chat',
  },
]

const steps = [
  ['landing.stepLocate', 'landing.stepLocateDescription'],
  ['landing.stepUnderstand', 'landing.stepUnderstandDescription'],
  ['landing.stepDecide', 'landing.stepDecideDescription'],
]

const landingText = {
  en: {
    navPlatform: 'Platform', navProcess: 'How it works', navImpact: 'Our impact', navExplore: 'Explore field',
    kicker: 'Built for every field', heroTitle: 'Clearer fields.', heroTitleSecond: 'Better harvests.',
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
    navPlatform: 'ပလက်ဖောင်း', navProcess: 'လုပ်ဆောင်ပုံ', navImpact: 'ကျွန်ုပ်တို့၏ အကျိုးသက်ရောက်မှု', navExplore: 'လယ်ကွင်းကို လေ့လာရန်',
    kicker: 'လယ်ကွင်းတိုင်းအတွက် ဖန်တီးထားသည်', heroTitle: 'လယ်ကွင်းကို ပိုမိုရှင်းလင်းစွာ သိရှိပါ။', heroTitleSecond: 'ပိုမိုကောင်းမွန်သော ရိတ်သိမ်းမှုများ။',
    heroCopy: 'ပိုမိုကောင်းမွန်သော ဆုံးဖြတ်ချက်များအတွက် လယ်ကွင်းအချက်အလက်၊ သီးနှံစီမံကိန်းနှင့် လက်တွေ့ကျသော AI လမ်းညွှန်ချက်များ။',
    explore: 'လယ်ကွင်းကို လေ့လာရန်', start: 'စတင်စိုက်ပျိုးရန်', discover: 'ပလက်ဖောင်းကို လေ့လာရန်',
    platformEyebrow: 'ချိတ်ဆက်ထားသော ပလက်ဖောင်းတစ်ခု', platformTitle: 'ပြောင်းလဲနေသော လယ်ကွင်းမှ ယုံကြည်စိတ်ချရသော နောက်တစ်ဆင့်သို့။',
    platformCopy: 'ရှုပ်ထွေးသော စိုက်ပျိုးရေးအချက်အလက်များကို နားလည်အသုံးချနိုင်သော အချက်အလက်များအဖြစ် ကိရိယာသုံးခုက ပြောင်းလဲပေးသည်။',
    exploreTool: 'ကိရိယာကို လေ့လာရန်', processEyebrow: 'ရိုးရှင်းစွာ ဖန်တီးထားသည်', processTitle: 'ရှုပ်ထွေးမှုမရှိသော လယ်ကွင်းအချက်အလက်။',
    impactEyebrow: 'ယုံကြည်စိတ်ချစွာ စိုက်ပျိုးပါ', impactTitle: 'ကောင်းမွန်သော ဆုံးဖြတ်ချက်များသည် ရှင်းလင်းသော မြင်ကွင်းမှ စတင်သည်။',
    impactCopy: 'လယ်ကွင်းအချက်အလက်၊ စိုက်ပျိုးမှုအခြေအနေများနှင့် စိုက်ပျိုးရေးဗဟုသုတများကို တစ်နေရာတည်းတွင် ရယူပါ။', launch: 'GreenVista ကို စတင်ရန်',
    capabilityHealth: 'လယ်ကွင်းကျန်းမာရေးကို ရှင်းလင်းစွာ ကြည့်ရှုပါ။', capabilityHealthDescription: 'ဒေသဆိုင်ရာ NDVI အချက်အလက်များကို နားလည်လွယ်သော အပင်ကျန်းမာရေးလမ်းကြောင်းများအဖြစ် ကြည့်ရှုပါ။',
    capabilityCrops: 'အချက်အလက်ဖြင့် သီးနှံရွေးချယ်ပါ။', capabilityCropsDescription: 'ဒေသဆိုင်ရာ မိုးရေချိန်၊ အပူချိန်၊ မြေအခြေအနေနှင့် စျေးကွက်တန်ဖိုးများကို နှိုင်းယှဉ်ပါ။',
    capabilityChat: 'လက်တွေ့ကျသော မေးခွန်းများ မေးပါ။', capabilityChatDescription: 'မြန်မာနိုင်ငံ၏ စိုက်ပျိုးရေးဆုံးဖြတ်ချက်များအတွက် တိုတောင်းပြီး အသုံးဝင်သော လမ်းညွှန်ချက်များ ရယူပါ။',
    stepLocate: 'တည်နေရာရှာရန်', stepLocateDescription: 'သင့်တည်နေရာကို အသုံးပြုပါ သို့မဟုတ် လယ်ကွင်းအခြေအနေများကို ကိုယ်တိုင်ထည့်ပါ။',
    stepUnderstand: 'နားလည်ရန်', stepUnderstandDescription: 'ဂြိုဟ်တုရာသီဥတု၊ အပင်အခြေအနေ လမ်းကြောင်းများနှင့် လက်တွေ့အကြံပြုချက်များကို ကြည့်ပါ။',
    stepDecide: 'ဆုံးဖြတ်ရန်', stepDecideDescription: 'သင့်တော်သော သီးနှံများကို နှိုင်းယှဉ်ပြီး ရှင်းလင်းစွာ ဆုံးဖြတ်ပါ။',
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
            <button className="agro-pill agro-pill-dark agro-nav-cta" type="button" onClick={() => openWorkspace('signin')}>{t('auth.loginBtn')}</button>
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
