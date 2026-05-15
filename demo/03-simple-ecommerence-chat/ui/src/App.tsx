/**
 * App — Root layout for the ZStore back-office application.
 * Renders a sidebar + main content area + taskbar + floating chat window.
 */

import { useState } from 'react'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Taskbar } from '@/components/taskbar'
import { ChatWindow } from '@/components/chat-window'
import { DashboardPage } from '@/pages/dashboard'
import { ProductsPage } from '@/pages/products'
import { OrdersPage } from '@/pages/orders'
import { SalesReportPage } from '@/pages/sales-report'
import { InventoryPage } from '@/pages/inventory'

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [chatOpen, setChatOpen] = useState(false)

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage />
      case 'products': return <ProductsPage />
      case 'orders': return <OrdersPage />
      case 'sales': return <SalesReportPage />
      case 'inventory': return <InventoryPage />
      default: return <DashboardPage />
    }
  }

  return (
    <div className="dark">
      <SidebarProvider>
        <AppSidebar activePage={activePage} onNavigate={setActivePage} />
        <main className="flex-1 overflow-auto p-4 pb-16 md:p-6 md:pb-16">
          <SidebarTrigger className="mb-4 md:hidden" />
          {renderPage()}
        </main>
      </SidebarProvider>

      {/* Floating chat window */}
      {chatOpen && (
        <ChatWindow
          onClose={() => setChatOpen(false)}
          onMinimize={() => setChatOpen(false)}
        />
      )}

      {/* Bottom taskbar */}
      <Taskbar chatOpen={chatOpen} onToggleChat={() => setChatOpen((o) => !o)} />
    </div>
  )
}

export default App
