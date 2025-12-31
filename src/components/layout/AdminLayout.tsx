
import { useState } from "react"
import { AdminSidebar } from "./AdminSidebar"
import { AdminHeader } from "./AdminHeader"
import AuthLayout from "./AuthLayout"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <AuthLayout>
    <div className="min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onOpenChange={setSidebarOpen} />
      <div className={`${sidebarOpen ? "lg:ml-64" : "lg:ml-20"} transition-all duration-300`}>
        <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
    </AuthLayout>
  )
}
