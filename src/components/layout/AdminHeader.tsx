
import { Button } from "@/components/ui/button"
import { Menu, User } from "lucide-react"
import { useRouter } from "next/router"
import { useContext } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { AuthUserDetails } from "@/models/Auth/authUserDetails"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface AdminHeaderProps {
  onMenuClick: () => void
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const router = useRouter()
  const authContext = useContext(useAuth())
  const userDetails = authContext?.userDetails as AuthUserDetails | undefined
  
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

  const getUserInitials = () => {
    if (!userDetails) return "U"
    const first = userDetails.firstName?.[0] || ""
    const last = userDetails.lastName?.[0] || ""
    return (first + last).toUpperCase() || "U"
  }

  const getUserName = () => {
    if (!userDetails) return "User"
    return `${userDetails.firstName || ""} ${userDetails.lastName || ""}`.trim() || userDetails.email || "User"
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
        {userDetails && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">{getUserName()}</span>
                  <span className="text-xs text-muted-foreground">{userDetails.email}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{getUserName()}</p>
                  <p className="text-xs text-muted-foreground">{userDetails.email}</p>
                  <Badge variant="secondary" className="w-fit mt-1">
                    {userDetails.role || "User"}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {userDetails.resources && userDetails.resources.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-xs">Resources</DropdownMenuLabel>
                  {userDetails.resources.map((resource, index) => (
                    <DropdownMenuItem key={index} className="text-xs">
                      {resource.resource}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
