import { Bot, BookOpenText, Home, Languages, LogIn, LogOut, Radar, Sprout, UserRound } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLanguage } from '../contexts/LanguageContext.jsx'
import GreenVistaMark from './GreenVistaMark.jsx'

const navItems = [
  { key: 'nav.landing', icon: Home, path: '/' },
  { key: 'nav.ndvi', icon: Radar, path: '/ndvi-analysis' },
  { key: 'nav.suggestion', icon: Sprout, path: '/crop-suggestion' },
  { key: 'nav.cropGuide', icon: BookOpenText, path: '/crop-guide' },
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
    <aside className="gv-desktop-sidebar" aria-label={t('nav.workspaceSidebar')}>
      <Link className="gv-sidebar-brand" to="/" aria-label={t('brand.home')}>
        <span><GreenVistaMark /></span>
        <span>GREEN<strong>VISTA</strong></span>
      </Link>

      <nav className="gv-sidebar-nav" aria-label={t('nav.workspaceNavigation')}>
        {navItems.map(({ key, icon: Icon, path }) => (
          <NavLink key={path} to={path} end={path === '/'}>
            <Icon size={19} aria-hidden="true" />
            <span>{t(key)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="gv-sidebar-footer">
        <div className="gv-sidebar-language" aria-label={t('language.selector')}>
          <Languages size={17} aria-hidden="true" />
          <button type="button" className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
          <button type="button" className={language === 'my' ? 'active' : ''} onClick={() => setLanguage('my')}>MY</button>
        </div>
        <div className="gv-sidebar-actions">
          {currentUser ? (
            <>
              <NavLink className="gv-sidebar-action gv-sidebar-account" to="/account">
                <UserRound size={17} aria-hidden="true" />
                {t('account.farmProfile') || 'Farm profile'}
              </NavLink>
              <button className="gv-sidebar-action gv-sidebar-signout" type="button" onClick={handleLogout}>
                <LogOut size={17} aria-hidden="true" />
                {t('auth.logout') || 'Sign out'}
              </button>
            </>
          ) : (
            <button className="gv-sidebar-action gv-sidebar-login" type="button" onClick={() => navigate('/?auth=signin')}>
              <LogIn size={17} aria-hidden="true" />
              {t('auth.loginBtn') || 'Sign in'}
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}

export default DesktopSidebar
