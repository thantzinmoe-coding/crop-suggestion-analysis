import { Bot, Home, Languages, LogOut, Menu, MessageSquareText, Radar, Sprout, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLanguage } from '../contexts/LanguageContext.jsx'
import GreenVistaMark from './GreenVistaMark.jsx'

const navItems = [
  { key: 'nav.home', icon: Home, path: '/' },
  { key: 'nav.community', icon: MessageSquareText, path: '/community-feed' },
  { key: 'nav.fieldHealth', icon: Radar, path: '/ndvi-analysis' },
  { key: 'nav.cropPlanner', icon: Sprout, path: '/crop-suggestion' },
  { key: 'nav.aiGuide', icon: Bot, path: '/ai-chat' },
]

function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { language, setLanguage, t } = useLanguage()
  const { logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => setMenuOpen(false), [location.pathname])

  useEffect(() => {
    if (!menuOpen) return undefined

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className={`gv-app-header ${menuOpen ? 'menu-open' : ''}`}>
      <div className="gv-app-header-inner">
        <Link className="gv-app-brand" to="/" aria-label="GreenVista home">
          <span className="gv-app-brand-mark"><GreenVistaMark /></span>
          <span>GREEN<strong>VISTA</strong></span>
        </Link>

        <nav className="gv-app-links" aria-label="Workspace navigation">
          {navItems.map(({ key, path }) => (
            <NavLink key={path} to={path} end={path === '/'}>
              {t(key)}
            </NavLink>
          ))}
        </nav>

        <div className="gv-app-actions">
          <div className="gv-language" aria-label="Language selector">
            <Languages size={16} aria-hidden="true" />
            <button type="button" className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
            <button type="button" className={language === 'my' ? 'active' : ''} onClick={() => setLanguage('my')}>MY</button>
          </div>
          <button className="gv-signout" type="button" onClick={handleLogout}>
            <LogOut size={17} aria-hidden="true" />
            <span>{t('auth.logout') || 'Sign out'}</span>
          </button>
          <button
            className="gv-menu-button"
            type="button"
            aria-label={menuOpen ? t('nav.close') : t('nav.open')}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <button className="gv-mobile-menu-backdrop" type="button" aria-label={t('nav.close')} onClick={() => setMenuOpen(false)} />
          <aside className="gv-mobile-menu" role="dialog" aria-modal="true" aria-label={t('nav.navigate')}>
            <div className="gv-mobile-menu-head">
              <div><span>{t('nav.navigate')}</span><strong>GreenVista</strong></div>
              <button type="button" aria-label={t('nav.close')} onClick={() => setMenuOpen(false)}><X size={20} /></button>
            </div>
            <nav aria-label="Mobile workspace navigation">
              {navItems.map(({ key, icon: Icon, path }) => (
                <NavLink key={path} to={path} end={path === '/'}>
                  <Icon size={19} aria-hidden="true" />
                  <span>{t(key)}</span>
                </NavLink>
              ))}
            </nav>
            <div className="gv-mobile-menu-footer">
              <p>{t('nav.mobileFooter')}</p>
              <button type="button" onClick={handleLogout}>
                <LogOut size={18} aria-hidden="true" />
                {t('auth.logout') || 'Sign out'}
              </button>
            </div>
          </aside>
        </>
      )}
    </header>
  )
}

export default AppHeader
