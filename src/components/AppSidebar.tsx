import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BookOpen,
  CreditCard,
  Bus,
  Bell,
  BarChart3,
  Settings,
  GraduationCap,
  LogOut,
  ChevronRight,
  Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const baseNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Students", url: "/students", icon: Users },
  { title: "Attendance", url: "/attendance", icon: CalendarCheck },
  { title: "Marks", url: "/marks", icon: BookOpen },
  { title: "Fees", url: "/fees", icon: CreditCard },
  { title: "Transport", url: "/transport", icon: Bus },
  { title: "Notices", url: "/notices", icon: Bell },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, logout } = useAuth();

  let navItems = [...baseNavItems];
  if (user?.role === "admin" || user?.role === "management") {
    // Insert "Staff & Users" after Dashboard
    navItems.splice(1, 0, { title: "Staff & Users", url: "/users", icon: Shield as any });
  }

  if (user?.role === "student") {
    navItems = navItems.filter(item =>
      !["Students", "Attendance", "Fees", "Transport", "Reports", "Settings", "Staff & Users"].includes(item.title)
    );
  }

  if (user?.role === "management") {
    navItems = navItems.filter(item => item.title !== "Attendance");
  }

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/20">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-sidebar-accent-foreground">KIET POLYTECHNIC</span>
              <span className="text-[11px] text-sidebar-foreground/60">Campus Hub Platform</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest font-semibold mb-1 px-3">
            {!collapsed && "Main Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <NavLink
                        to={item.url}
                        end
                        className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${isActive
                          ? "bg-sidebar-accent text-white"
                          : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
                          }`}
                        activeClassName="bg-sidebar-accent text-white font-semibold"
                      >
                        <item.icon className={`h-[18px] w-[18px] transition-colors ${isActive ? "text-white" : ""}`} />
                        {!collapsed && (
                          <>
                            <span>{item.title}</span>
                            {isActive && (
                              <ChevronRight className="ml-auto h-3.5 w-3.5 text-white/60" />
                            )}
                          </>
                        )}
                        {isActive && !collapsed && (
                          <div className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-red-400" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {user && (
          <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent/30 transition-colors">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold shadow-sm">
              {user.name.charAt(0)}
            </div>
            {!collapsed && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-[13px] font-semibold text-sidebar-accent-foreground">{user.name}</span>
                <span className="truncate text-[11px] capitalize text-sidebar-foreground/50">{user.role}</span>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={logout}
                className="rounded-md p-1.5 text-sidebar-foreground/50 hover:text-red-400 hover:bg-sidebar-accent/50 transition-all"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
