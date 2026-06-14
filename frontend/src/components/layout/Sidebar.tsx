import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ShoppingBag, Users, Package, BarChart3,
  Factory, Truck, CreditCard, Settings, ChevronLeft, ChevronRight,
  LogOut, UserCircle, Palette, FileText, TrendingUp,
  Boxes, Shirt, ClipboardList, DollarSign, PieChart, UserPlus
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { authService } from '@/services/authService'
import toast from 'react-hot-toast'

type Role = 'ADMIN' | 'AGENT' | 'ACCOUNTANT' | 'DESIGNER'

interface NavItem {
  label: string
  icon: React.ComponentType<any>
  path: string
}

interface NavSection {
  title?: string
  items: NavItem[]
}

const navConfig: Record<Role, NavSection[]> = {
  ADMIN: [
    {
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
        { label: 'Orders', icon: ShoppingBag, path: '/admin/orders' },
        { label: 'Customers', icon: Users, path: '/admin/customers' },
        { label: 'Products', icon: Shirt, path: '/admin/products' },
        { label: 'Inventory', icon: Boxes, path: '/admin/inventory' },
        { label: 'Production', icon: Factory, path: '/admin/production' },
        { label: 'Dispatch', icon: Truck, path: '/admin/dispatch' },
        { label: 'Payments', icon: CreditCard, path: '/admin/payments' },
        { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
      ],
    },
    {
      title: 'Create ID',
      items: [
        { label: 'Agent', icon: UserCircle, path: '/admin/createid/agent' },
        { label: 'Accountant', icon: DollarSign, path: '/admin/createid/accountant' },
        { label: 'Designer', icon: Palette, path: '/admin/createid/designer' },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Users', icon: Users, path: '/admin/users' },
        { label: 'Settings', icon: Settings, path: '/admin/settings' },
      ],
    },
  ],
  AGENT: [
    {
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/agent/dashboard' },
        { label: 'T-Shirt Catalog', icon: Shirt, path: '/agent/catalog' },
        { label: 'My Orders', icon: ShoppingBag, path: '/agent/orders' },
        { label: 'Customers', icon: Users, path: '/agent/customers' },
        { label: 'Performance', icon: TrendingUp, path: '/agent/performance' },
      ],
    },
  ],
  ACCOUNTANT: [
    {
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/accountant/dashboard' },
        { label: 'Payments', icon: DollarSign, path: '/accountant/payments' },
        { label: 'Invoices', icon: FileText, path: '/accountant/invoices' },
        { label: 'Reports', icon: PieChart, path: '/accountant/reports' },
      ],
    },
  ],
  DESIGNER: [
    {
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/designer/dashboard' },
        { label: 'Assigned Orders', icon: ClipboardList, path: '/designer/orders' },
        { label: 'My Mockups', icon: Palette, path: '/designer/mockups' },
      ],
    },
  ],
}

const roleColors: Record<Role, string> = {
  ADMIN: 'bg-primary-500',
  AGENT: 'bg-blue-500',
  ACCOUNTANT: 'bg-green-500',
  DESIGNER: 'bg-purple-500',
}

const roleLabels: Record<Role, string> = {
  ADMIN: 'Administrator',
  AGENT: 'Sales Agent',
  ACCOUNTANT: 'Accountant',
  DESIGNER: 'Designer',
}

interface SidebarProps {
  role: Role
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ role, mobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar } = useThemeStore()
  const navigate = useNavigate()
  const navSections = navConfig[role] || []

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch {}
    logout()
    navigate('/auth/login')
    toast.success('Logged out successfully')
  }

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center shrink-0 shadow-red-glow">
            <span className="text-white font-black text-sm">PK</span>
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                key="sidebar-logo"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <p className="font-black text-gray-900 dark:text-white text-sm whitespace-nowrap">PK Corporate erp</p>
                <p className="text-gray-400 text-xs whitespace-nowrap">Manufacturing ERP</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse button - desktop only */}
        <button
          onClick={toggleSidebar}
          className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors hidden lg:flex"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Role badge */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            key="role-badge"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-4 mt-4 mb-2"
          >
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white ${roleColors[role]}`}>
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
              {roleLabels[role]}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-thin space-y-1">
        {navSections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            {/* Section heading — only when sidebar is expanded and section has a title */}
            <AnimatePresence>
              {!sidebarCollapsed && section.title && (
                <motion.div
                  key={`section-heading-${section.title || sectionIdx}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-3 pt-3 pb-1"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {section.title}
                  </span>
                  <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapsed: show a subtle divider between sections */}
            {sidebarCollapsed && sectionIdx > 0 && (
              <div className="mx-3 my-2 h-px bg-gray-100 dark:bg-gray-800" />
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    `sidebar-item ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`
                  }
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <item.icon size={18} className="shrink-0" />
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span
                        key={`label-${item.path}`}
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-3 shrink-0">
        <div className={`flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
            <span className="text-primary-600 dark:text-primary-400 font-bold text-xs">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                key="user-footer"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 overflow-hidden"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.button
                key="logout-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut size={15} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        {sidebarCollapsed && (
          <button
            onClick={handleLogout}
            className="w-full mt-1 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors flex justify-center"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-30 overflow-hidden"
      >
        {renderSidebarContent()}
      </motion.aside>

      {/* Mobile Sidebar */}
      <aside
        className={`flex lg:hidden flex-col fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-30 transition-all duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        {renderSidebarContent()}
      </aside>
    </>
  )
}
