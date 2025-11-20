
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useRouter } from "next/router"

interface AdminHeaderProps {
  onMenuClick: () => void
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const router = useRouter()
  
  // Extract the current page title from the route
  const getPageTitle = () => {
    const path = router.pathname
    if (path === "/admin") return "Dashboard"
    if (path.includes("/admin/settings")) return "Settings"
    if (path.includes("/admin/users")) return "Users"
    if (path.includes("/admin/question-plans")) return "Question Plans"
    
    // Extract the last segment of the path and capitalize it
    const segments = path.split("/")
    const lastSegment = segments[segments.length - 1]
    // Handle hyphenated paths like "question-plans" -> "Question Plans"
    return lastSegment
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <header className="border-b bg-card">
      <div className="flex h-16 items-center px-4 gap-4">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
          <Menu className="h-6 w-6" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Admin {getPageTitle()}</h1>
        </div>
      </div>
    </header>
  )
}
