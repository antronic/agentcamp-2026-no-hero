/**
 * AppSidebar — Main navigation sidebar for ZStore back-office.
 * Uses shadcn Sidebar component with navigation links to all pages.
 */

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Warehouse,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar'

// Navigation items for the sidebar menu
const navItems = [
  { title: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
  { title: 'Products', icon: Package, id: 'products' },
  { title: 'Orders', icon: ShoppingCart, id: 'orders' },
  { title: 'Sales Report', icon: TrendingUp, id: 'sales' },
  { title: 'Inventory', icon: Warehouse, id: 'inventory' },
]

interface AppSidebarProps {
  activePage: string
  onNavigate: (page: string) => void
}

export function AppSidebar({ activePage, onNavigate }: AppSidebarProps) {
  return (
    <Sidebar>
      {/* Store branding */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
            Z
          </div>
          <div>
            <h2 className="text-sm font-semibold">ZStore</h2>
            <p className="text-xs text-muted-foreground">Back Office</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activePage === item.id}
                    onClick={() => onNavigate(item.id)}
                    className="cursor-pointer"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
        <p className="text-xs text-muted-foreground">
          © 2026 ZStore Demo
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
