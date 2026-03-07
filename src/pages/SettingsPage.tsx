import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, GraduationCap, Shield, Mail, Clock, Globe, Bell, Moon, Sun, Monitor, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState("system");
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[800px]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account and system preferences</p>
        </div>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border p-6 shadow-card">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-5">Profile Information</h3>
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-red-500/20">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-sm text-muted-foreground capitalize mt-0.5">{user.role}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 text-[10px] font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Account Details */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl bg-card border p-6 shadow-card">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-5">Account Details</h3>
          <div className="grid gap-4">
            {[
              { icon: Building2, label: "Institution", value: "KIET — Kakinada Institute of Engineering & Technology" },
              { icon: GraduationCap, label: "Branch", value: "CME — Computer Engineering" },
              { icon: Shield, label: "Access Level", value: user.role.toUpperCase() },
              { icon: Mail, label: "Email", value: user.loginId || "—" },
              ...(user.assignedYear ? [{ icon: GraduationCap, label: user.role === "student" ? "Year" : "Assigned Year", value: user.assignedYear }] : []),
              { icon: Clock, label: "Session Status", value: "Active" },
              { icon: Globe, label: "Language", value: "English (India)" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-card flex items-center justify-center border shadow-sm">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{item.label}</p>
                  <p className="text-sm font-semibold mt-0.5 truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl bg-card border p-6 shadow-card">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-5">Appearance</h3>
          <div className="flex gap-3">
            {[{ id: "light", label: "Light", icon: Sun }, { id: "dark", label: "Dark", icon: Moon }, { id: "system", label: "System", icon: Monitor }].map(t => (
              <button key={t.id} onClick={() => setTheme(t.id)}
                className={`flex flex-col items-center gap-2 rounded-xl p-4 border-2 transition-all flex-1 ${theme === t.id ? "border-primary bg-primary/5" : "border-transparent bg-secondary/30 hover:bg-secondary/50"}`}>
                <t.icon className={`h-5 w-5 ${theme === t.id ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-xs font-medium ${theme === t.id ? "text-primary" : "text-muted-foreground"}`}>{t.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl bg-card border p-6 shadow-card">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-5">Notifications</h3>
          <div className="space-y-4">
            {[
              { label: "Email Notifications", desc: "Receive updates via email", icon: Mail, state: emailNotif, toggle: () => setEmailNotif(!emailNotif) },
              { label: "Push Notifications", desc: "Receive in-app notifications", icon: Bell, state: pushNotif, toggle: () => setPushNotif(!pushNotif) },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <button onClick={item.toggle} className={`relative h-6 w-11 rounded-full transition-colors ${item.state ? "bg-primary" : "bg-muted"}`}>
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm ${item.state ? "translate-x-5" : ""}`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl border-2 border-red-200 p-6">
          <h3 className="text-xs font-semibold text-red-500 uppercase tracking-widest mb-4">Danger Zone</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sign Out</p>
              <p className="text-[11px] text-muted-foreground">End your current session</p>
            </div>
            <button onClick={logout}
              className="flex items-center gap-2 rounded-xl border-2 border-red-200 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
