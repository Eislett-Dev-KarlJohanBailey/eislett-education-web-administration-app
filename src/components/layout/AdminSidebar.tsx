
import { useState, useContext } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Layers,
  Globe,
  Building,
  BookText,
  FileQuestion,
  ChevronDown,
  Map,
  ClipboardList,
  Megaphone,
  Flag,
  HandHeart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { AuthUserDetails } from "@/models/Auth/authUserDetails"
import { useResources } from "@/hooks/use-resources"

interface AdminSidebarProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminSidebar({ isOpen, onOpenChange }: AdminSidebarProps) {
  const router = useRouter()
  const { hasResource, isSuperAdmin } = useResources()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    topics: router.pathname.includes("/admin/topics")
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const isActive = (path: string) => router.pathname === path
  const isInPath = (path: string) => router.pathname.startsWith(path)

  // Map menu items to resources
  const allMenuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin",
      resource: null // Always visible
    },
    {
      title: "Subjects",
      icon: BookOpen,
      href: "/admin/subjects",
      resource: null // Always visible (or add a resource if needed)
    },
    {
      title: "Courses",
      icon: BookText,
      href: "/admin/courses",
      resource: null // Always visible (or add a resource if needed)
    },
    {
      title: "Roadmaps",
      icon: Map,
      href: "/admin/roadmaps",
      resource: "roadmaps"
    },
    {
      title: "Topics",
      icon: Layers,
      href: "/admin/topics",
      resource: null, // Always visible (or add a resource if needed)
      submenu: [
        {
          title: "Subtopics",
          href: "/admin/topics/subtopics",
          resource: null
        },
        {
          title: "Questions",
          icon: FileQuestion,
          href: "/admin/topics/subtopics/questions",
          resource: "questions"
        }
      ]
    },
    {
      title: "Question Plans",
      icon: ClipboardList,
      href: "/admin/question-plans",
      resource: "questions"
    },
    {
      title: "Advertisements",
      icon: Megaphone,
      href: "/admin/advertisements",
      resource: null // Always visible (or add a resource if needed)
    },
    {
      title: "Sponsors",
      icon: HandHeart,
      href: "/admin/sponsors",
      resource: null // Always visible (or add a resource if needed)
    },
    {
      title: "Feature Flags",
      icon: Flag,
      href: "/admin/feature-flags",
      resource: null // Always visible (or add a resource if needed)
    },
    {
      title: "Countries",
      icon: Globe,
      href: "/admin/countries",
      resource: null // Always visible (or add a resource if needed)
    },
    {
      title: "Schools",
      icon: Building,
      href: "/admin/schools",
      resource: null // Always visible (or add a resource if needed)
    },
    {
      title: "Users",
      icon: Users,
      href: "/admin/users",
      resource: "students" // Using students resource for users
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/admin/settings",
      resource: null // Always visible (or add a resource if needed)
    }
  ]

  // Filter menu items based on resources
  const menuItems = allMenuItems.filter(item => {
    // Always show if no resource required
    if (!item.resource) return true;
    
    // Super admin sees everything
    if (isSuperAdmin) return true;
    
    // Check if user has the required resource
    return hasResource(item.resource);
  }).map(item => {
    // Filter submenu items if they exist
    if (item.submenu) {
      const filteredSubmenu = item.submenu.filter(subitem => {
        if (!subitem.resource) return true;
        if (isSuperAdmin) return true;
        return hasResource(subitem.resource);
      });
      
      return {
        ...item,
        submenu: filteredSubmenu
      };
    }
    return item;
  }).filter(item => {
    // Remove parent items if they have submenu but all submenu items were filtered out
    if (item.submenu && item.submenu.length === 0) {
      return false;
    }
    return true;
  })

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden",
          isOpen ? "block" : "hidden"
        )}
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-card border-r transition-transform duration-300 lg:transform-none",
          !isOpen && "lg:w-20",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <h2 className={cn("font-semibold", !isOpen && "lg:hidden")}>Admin Panel</h2>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={() => onOpenChange(!isOpen)}
          >
            {isOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {menuItems.map((item) => (
            <div key={item.href}>
              {item.submenu ? (
                <>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-between px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      !isOpen && "lg:justify-center",
                      isInPath(item.href) && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => toggleSection(item.title.toLowerCase())}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span className={cn("text-sm font-medium", !isOpen && "lg:hidden")}>
                        {item.title}
                      </span>
                    </div>
                    {isOpen && (
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          expandedSections[item.title.toLowerCase()] && "rotate-180"
                        )}
                      />
                    )}
                  </Button>
                  {expandedSections[item.title.toLowerCase()] && isOpen && (
                    <div className="ml-6 mt-1 space-y-1 border-l pl-2">
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          isActive(item.href) && "bg-accent/50 text-accent-foreground"
                        )}
                      >
                        All {item.title}
                      </Link>
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.href}
                          href={subitem.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                            isInPath(subitem.href) && "bg-accent/50 text-accent-foreground"
                          )}
                        >
                          {subitem.icon && <subitem.icon className="h-4 w-4" />}
                          {subitem.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    !isOpen && "lg:justify-center",
                    isActive(item.href) && "bg-accent text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className={cn("text-sm font-medium", !isOpen && "lg:hidden")}>
                    {item.title}
                  </span>
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
    </>
  )
}
