import { useState } from "react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Eye, EyeOff, AlertCircle, Shield, ArrowRight, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: "admin", label: "Admin", color: "text-red-500" },
  { value: "management", label: "Management", color: "text-blue-500" },
  { value: "staff", label: "Administrative Staff", color: "text-purple-500" },
  { value: "faculty", label: "CTPOS (Faculty)", color: "text-emerald-500" },
  { value: "student", label: "Student", color: "text-amber-500" },
];

const ROLE_HINTS: Record<UserRole, string> = {
  admin: "Login ID: Kiet group",
  management: "Login ID: Kiet Diploma",
  staff: "Login ID assigned by admin",
  faculty: "Login ID assigned by admin",
  student: "Login ID = Roll number · Password = Roll number",
};

const QUICK_LOGINS: { label: string; role: UserRole; id: string; pass: string; color: string }[] = [
  { label: "Admin", role: "admin", id: "Kiet group", pass: "Kiet8297@", color: "bg-red-500/10 text-red-600 border-red-200" },
  { label: "Management", role: "management", id: "Kiet Diploma", pass: "Diploma8297@", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
];

const Login = () => {
  const [role, setRole] = useState<UserRole>("admin");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const selectedRole = ROLES.find(r => r.value === role)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId || !password) return;
    setError("");
    setLoading(true);
    const result = await login(loginId, password, role);
    setLoading(false);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Invalid credentials.");
    }
  };

  const quickFill = (id: string, pass: string, r: UserRole) => {
    setRole(r);
    setLoginId(id);
    setPassword(pass);
    setError("");
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Branding Panel ────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(211, 47, 47, 0.25) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(25, 118, 210, 0.2) 0%, transparent 50%)
          `
        }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />
        {/* Floating shapes */}
        <motion.div animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 right-20 h-24 w-24 rounded-3xl bg-white/[0.03] border border-white/[0.06]" />
        <motion.div animate={{ y: [0, 14, 0], rotate: [0, -3, 0] }} transition={{ duration: 6, repeat: Infinity, delay: 1.5 }}
          className="absolute bottom-32 left-16 h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/10" />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-16 max-w-xl">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="flex justify-center mb-10">
            <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-2xl shadow-red-500/30 border border-red-400/20">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
          </motion.div>
          <h1 className="text-5xl font-extrabold text-white tracking-tight">KIET POLYTECHNIC</h1>
          <p className="text-lg text-white/60 mt-3">Kakinada Institute of Engineering & Technology</p>
          <p className="text-sm text-white/40 mt-1">Enterprise Campus Management Platform</p>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-4">
            {[{ label: "Students", val: "3,000+" }, { label: "Faculty", val: "150+" }, { label: "Modules", val: "10+" }].map(s => (
              <div key={s.label} className="rounded-2xl bg-white/[0.05] border border-white/[0.06] p-4">
                <p className="text-2xl font-bold text-white">{s.val}</p>
                <p className="text-[11px] text-white/40 uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 border border-white/[0.08]">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[11px] text-white/50">256-bit encrypted • Enterprise grade security</span>
          </div>
        </motion.div>
      </div>

      {/* ── Right Login Form ────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-background">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">KIET POLYTECHNIC</h2>
              <p className="text-xs text-muted-foreground">Campus Hub Platform</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-2">Sign in to access the KIET Campus Hub</p>
          </div>

          {/* Quick Logins */}
          <div className="mb-6 rounded-2xl border bg-secondary/30 p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">⚡ Quick Login</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_LOGINS.map(q => (
                <button key={q.label} type="button" onClick={() => quickFill(q.id, q.pass, q.role)}
                  className={`flex flex-col rounded-xl border p-3 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${q.color}`}>
                  <span className="text-xs font-bold">{q.label}</span>
                  <span className="text-[10px] opacity-70 mt-0.5 font-mono">{q.id}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Role Selector */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Role</label>
              <div className="relative">
                <button type="button" onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="w-full flex items-center justify-between rounded-xl border-2 border-border bg-card px-4 py-3 text-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all">
                  <span className={`font-medium ${selectedRole.color}`}>{selectedRole.label}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showRoleDropdown ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {showRoleDropdown && (
                    <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      className="absolute top-full left-0 right-0 mt-1 rounded-xl border bg-card shadow-xl z-50 overflow-hidden">
                      {ROLES.map(r => (
                        <button key={r.value} type="button"
                          onClick={() => { setRole(r.value); setShowRoleDropdown(false); setLoginId(""); setPassword(""); setError(""); }}
                          className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-secondary/50 flex items-center gap-3 ${role === r.value ? "bg-secondary/30" : ""}`}>
                          <span className={`h-2 w-2 rounded-full ${r.value === "admin" ? "bg-red-500" : r.value === "management" ? "bg-blue-500" : r.value === "staff" ? "bg-purple-500" : r.value === "faculty" ? "bg-emerald-500" : "bg-amber-500"}`} />
                          <span className={`font-medium ${r.color}`}>{r.label}</span>
                          {role === r.value && <span className="ml-auto text-primary text-xs">✓</span>}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Login ID */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                {role === "student" ? "Roll Number" : "Login ID"}
              </label>
              <input type="text" value={loginId} onChange={e => setLoginId(e.target.value)}
                placeholder={role === "student" ? "e.g. 25371-CM-067" : "Enter your login ID"}
                className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                required />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={role === "student" ? "Same as your roll number" : "Enter your password"}
                  className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all pr-12"
                  required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Role-specific hint */}
              <p className="text-[11px] text-muted-foreground pl-1">{ROLE_HINTS[role]}</p>
            </div>

            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.99 }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 py-3.5 text-sm font-bold text-white hover:from-red-500 hover:to-red-600 transition-all shadow-lg shadow-red-500/25 disabled:opacity-70 mt-2">
              {loading
                ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span>Sign In</span><ArrowRight className="h-4 w-4" /></>}
            </motion.button>
          </form>

          {/* Student hint card */}
          {role === "student" && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-bold text-amber-700 mb-1">📋 Student Login Instructions</p>
              <p className="text-xs text-amber-600 leading-relaxed">
                Enter your <span className="font-semibold">diploma roll number</span> as both the Login ID and Password.<br />
                <span className="font-mono font-semibold">Example: 25371-CM-067</span>
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
