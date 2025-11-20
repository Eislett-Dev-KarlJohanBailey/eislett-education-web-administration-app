
import { useState } from "react"
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
  ClipboardList
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdminSidebarProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminSidebar({ isOpen, onOpenChange }: AdminSidebarProps) {
  const router = useRouter()
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

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin"
    },
    {
      title: "Subjects",
      icon: BookOpen,
      href: "/admin/subjects"
    },
    {
      title: "Courses",
      icon: BookText,
      href: "/admin/courses"
    },
    {
      title: "Roadmaps",
      icon: Map,
      href: "/admin/roadmaps"
    },
    {
      title: "Topics",
      icon: Layers,
      href: "/admin/topics",
      submenu: [
        {
          title: "Subtopics",
          href: "/admin/topics/subtopics"
        },
        {
          title: "Questions",
          icon: FileQuestion,
          href: "/admin/topics/subtopics/questions"
        }
      ]
    },
    {
      title: "Question Plans",
      icon: ClipboardList,
      href: "/admin/question-plans"
    },
    {
      title: "Countries",
      icon: Globe,
      href: "/admin/countries"
    },
    {
      title: "Schools",
      icon: Building,
      href: "/admin/schools"
    },
    {
      title: "Users",
      icon: Users,
      href: "/admin/users"
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/admin/settings"
    }
  ]

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
