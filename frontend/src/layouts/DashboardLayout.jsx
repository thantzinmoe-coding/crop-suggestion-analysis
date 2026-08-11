import { Outlet } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import DesktopSidebar from '../components/DesktopSidebar.jsx'

function DashboardLayout() {
  return (
    <div className="gv-app-shell">
      <DesktopSidebar />
      <AppHeader />
      <main className="gv-app-main">
        <Outlet />
      </main>
    </div>
  )
}

export default DashboardLayout
