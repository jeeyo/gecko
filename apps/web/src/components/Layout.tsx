import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Calendar,
  Receipt,
  NotebookPen,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Dashboard", icon: Calendar, end: true },
  { to: "/expenses", label: "Expenses", icon: Receipt, end: false },
  { to: "/notes", label: "Notes", icon: NotebookPen, end: false },
  { to: "/settings", label: "Settings", icon: SettingsIcon, end: false },
];

export function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved ? JSON.parse(saved) : false;
  });

  const toggleSidebar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar-collapsed", JSON.stringify(next));
  };

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden transition-all duration-300 md:flex md:shrink-0 md:flex-col md:border-r md:bg-card",
          isCollapsed ? "md:w-16" : "md:w-56",
        )}
      >
        <div
          className={cn(
            "flex items-center px-4 py-6",
            isCollapsed ? "justify-center" : "justify-between",
          )}
        >
          {!isCollapsed && (
            <div className="px-1 text-lg font-semibold tracking-tight">
              Gecko
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSidebar}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        <nav className="flex flex-col gap-1 px-2">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              title={isCollapsed ? n.label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  isCollapsed && "justify-center px-2",
                )
              }
            >
              <n.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>{n.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom tabs */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t bg-card md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-xs",
                isActive ? "text-foreground" : "text-muted-foreground",
              )
            }
          >
            <n.icon className="h-5 w-5" />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
