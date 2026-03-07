import { ReactNode, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Search, LogOut, ChevronDown, User, Settings } from "lucide-react";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, text: "Attendance marked for 1st Year CME", time: "2 min ago", unread: true },
    { id: 2, text: "Fee payment received - ₹15,000", time: "15 min ago", unread: true },
    { id: 3, text: "New notice posted: Exam Schedule", time: "1 hr ago", unread: false },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Premium Top Navigation Bar */}
          <header className="h-16 flex items-center justify-between border-b bg-card/80 backdrop-blur-xl px-4 md:px-6 shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg p-2 transition-colors" />

              {/* Search Bar */}
              <div className="hidden sm:flex items-center gap-2.5 rounded-xl bg-secondary/70 border border-transparent focus-within:border-primary/20 focus-within:bg-white focus-within:shadow-sm px-3.5 py-2 transition-all duration-200">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search students, records, modules..."
                  className="bg-transparent text-sm outline-none w-64 placeholder:text-muted-foreground/60"
                />
                <kbd className="hidden md:inline-flex h-5 items-center rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
                  className="relative rounded-xl p-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                >
                  <Bell className="h-[18px] w-[18px]" />
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 pulse-dot" />
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border bg-card shadow-xl animate-fade-in overflow-hidden">
                      <div className="px-4 py-3 border-b">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold">Notifications</h3>
                          <span className="rounded-full bg-red-500/10 text-red-500 px-2 py-0.5 text-[10px] font-bold">
                            {notifications.filter(n => n.unread).length} new
                          </span>
                        </div>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.map((n) => (
                          <div key={n.id} className={`px-4 py-3 border-b last:border-0 hover:bg-secondary/50 transition-colors cursor-pointer ${n.unread ? "bg-primary/[0.02]" : ""}`}>
                            <div className="flex items-start gap-3">
                              {n.unread && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                              <div className={n.unread ? "" : "pl-5"}>
                                <p className="text-xs leading-relaxed">{n.text}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-2.5 border-t bg-secondary/30">
                        <button className="text-xs font-medium text-primary hover:underline w-full text-center">
                          View all notifications
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Separator */}
              <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-secondary transition-all"
                >
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {user?.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-[13px] font-semibold leading-none">{user?.name}</p>
                    <p className="text-[11px] text-muted-foreground capitalize mt-0.5">{user?.role}</p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border bg-card shadow-xl animate-fade-in overflow-hidden">
                      <div className="px-4 py-3 border-b">
                        <p className="text-sm font-semibold">{user?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                      </div>
                      <div className="p-1.5">
                        <button className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                          <User className="h-4 w-4 text-muted-foreground" />
                          My Profile
                        </button>
                        <button className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                          <Settings className="h-4 w-4 text-muted-foreground" />
                          Settings
                        </button>
                      </div>
                      <div className="p-1.5 border-t">
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-6 lg:p-8 page-enter">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
