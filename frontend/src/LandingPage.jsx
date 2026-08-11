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
    title: 'See field health clearly.',
    description: 'Turn regional NDVI signals into readable vegetation trends and early field-health context.',
    link: '/ndvi-analysis',
  },
  {
    number: '02',
    icon: Sprout,
    title: 'Choose crops with context.',
    description: 'Compare suitable crops using local rainfall, temperature, soil conditions, yield, and market value.',
    link: '/crop-suggestion',
  },
  {
    number: '03',
    icon: Bot,
    title: 'Ask practical questions.',
    description: 'Get concise agricultural guidance in one calm workspace designed around Myanmar farming decisions.',
    link: '/ai-chat',
  },
]

const steps = [
  ['Locate', 'Use your position or enter field conditions manually.'],
  ['Understand', 'Review satellite weather, vegetation trends, and practical advisories.'],
  ['Decide', 'Compare crops, estimate outcomes, and move forward with clearer context.'],
]

function LandingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, logout } = useAuth()
  const { language, setLanguage, t } = useLanguage()
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
    <main className="agro-site">
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
            <a href="#platform">Platform</a>
            <a href="#process">How it works</a>
            <a href="#impact">Our impact</a>
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
            <button className="agro-pill agro-pill-dark agro-nav-cta" type="button" onClick={() => openWorkspace('signin')}>Sign in</button>
          )}
        </nav>

        <div className="agro-hero-inner" id="top">
          <div className="agro-kicker"><Sparkles size={15} /> Built for every field</div>
          <h1 id="hero-title">Clearer fields.<br />Better harvests.</h1>
          <p className="agro-hero-copy">
            Field insights, crop planning, and practical AI guidance for clearer decisions.
          </p>
          <div className="agro-hero-actions">
            <button className="agro-pill agro-pill-dark" type="button" onClick={() => openWorkspace('signup')}>
              {currentUser ? 'Explore your field' : 'Start growing'} <ArrowRight size={18} />
            </button>
            <a className="agro-text-link" href="#platform">Discover the platform <span aria-hidden="true">↘</span></a>
          </div>
        </div>
      </section>

      <section className="agro-section agro-platform" id="platform">
        <div className="agro-section-heading">
          <p className="agro-eyebrow">One connected platform</p>
          <h2>From a changing field<br />to a confident next step.</h2>
          <p>Three focused tools turn complex agricultural signals into information people can understand and use.</p>
        </div>

        <div className="agro-capability-grid">
          {capabilities.map(({ number, icon: Icon, title, description, link }) => (
            <article className="agro-capability" key={number}>
              <div className="agro-capability-top">
                <span>{number}</span>
                <span className="agro-icon"><Icon size={23} /></span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <button type="button" onClick={() => openWorkspace('signup', link)}>
                Explore tool <ArrowRight size={16} />
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
          <p className="agro-eyebrow">Simple by design</p>
          <h2>
            <span>Field intelligence</span>
            <span>without the complexity.</span>
          </h2>
          <div className="agro-steps">
            {steps.map(([title, description], index) => (
              <div className="agro-step" key={title}>
                <span>0{index + 1}</span>
                <div><h3>{title}</h3><p>{description}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="agro-impact-wrap" id="impact">
        <div className="agro-impact">
          <div>
            <p className="agro-eyebrow">Grow with confidence</p>
            <h2>Good decisions begin with a clearer view.</h2>
          </div>
          <div className="agro-impact-copy">
            <p>Bring field signals, growing conditions, and agricultural knowledge into one approachable place.</p>
            <button className="agro-pill agro-pill-light" type="button" onClick={() => openWorkspace('signup')}>
              Launch GreenVista <ArrowRight size={18} />
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
