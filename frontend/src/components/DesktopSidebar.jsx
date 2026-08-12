import { Bot, Home, Languages, LogOut, Radar, Sprout } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLanguage } from '../contexts/LanguageContext.jsx'
import GreenVistaMark from './GreenVistaMark.jsx'

const navItems = [
  { key: 'nav.landing', icon: Home, path: '/' },
  { key: 'nav.ndvi', icon: Radar, path: '/ndvi-analysis' },
  { key: 'nav.suggestion', icon: Sprout, path: '/crop-suggestion' },
  { key: 'nav.chat', icon: Bot, path: '/ai-chat' },
]

function DesktopSidebar() {
  const { currentUser, logout } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <aside className="gv-desktop-sidebar" aria-label="Workspace sidebar">
      <Link className="gv-sidebar-brand" to="/" aria-label="GreenVista home">
        <span><GreenVistaMark /></span>
        <span>GREEN<strong>VISTA</strong></span>
      </Link>

      <div className="gv-sidebar-intro">
        <p>{t('nav.workspace')}</p>
        <h2>{t('nav.farmIntelligence')}</h2>
        <span>{t('nav.sidebarDescription')}</span>
      </div>

      <nav className="gv-sidebar-nav" aria-label="Workspace navigation">
        {navItems.map(({ key, icon: Icon, path }) => (
          <NavLink key={path} to={path} end={path === '/'}>
            <Icon size={19} aria-hidden="true" />
            <span>{t(key)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="gv-sidebar-footer">
        <div className="gv-sidebar-language" aria-label="Language selector">
          <Languages size={17} aria-hidden="true" />
          <button type="button" className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
          <button type="button" className={language === 'my' ? 'active' : ''} onClick={() => setLanguage('my')}>MY</button>
        </div>
        {currentUser?.email && <p className="gv-sidebar-email" title={currentUser.email}>{currentUser.email}</p>}
        <button className="gv-sidebar-signout" type="button" onClick={handleLogout}>
          <LogOut size={17} aria-hidden="true" />
          {t('auth.logout') || 'Sign out'}
        </button>
      </div>
    </aside>
  )
}

export default DesktopSidebar
