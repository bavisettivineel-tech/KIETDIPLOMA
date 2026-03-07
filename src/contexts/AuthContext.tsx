import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "management" | "staff" | "faculty" | "student";

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  loginId: string;
  assignedYear?: string;
  studentId?: string; // UUID of student record (for student logins)
}

interface AuthContextType {
  user: AuthUser | null;
  login: (loginId: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const SESSION_KEY = "kiet_erp_session";
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on app load
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AuthUser;
        setUser(parsed);
      }
    } catch { }
    setLoading(false);
  }, []);

  const login = async (
    loginId: string,
    password: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    loginId = loginId.trim();
    password = password.trim();

    // ── STUDENT LOGIN ─────────────────────────────────────────
    // Students use roll number as both loginId and password
    if (role === "student") {
      const { data: student, error } = await supabase
        .from("students")
        .select("id, name, roll_number, academic_year")
        .eq("roll_number", loginId)
        .eq("is_active", true)
        .single();

      if (error || !student) {
        return { success: false, error: "Roll number not found. Check your roll number and try again." };
      }

      // Password must match roll number (default) OR a custom password in system_users
      const validDefaultPassword = password === loginId;

      // Check if student has a custom password in system_users
      const { data: sysUser } = await supabase
        .from("system_users")
        .select("password")
        .eq("login_id", loginId)
        .eq("role", "student")
        .single();

      const validCustomPassword = sysUser && sysUser.password === password;

      if (!validDefaultPassword && !validCustomPassword) {
        return { success: false, error: "Incorrect password. For students, the default password is your roll number." };
      }

      const authUser: AuthUser = {
        id: student.id,
        name: student.name,
        role: "student",
        loginId: student.roll_number,
        assignedYear: student.academic_year,
        studentId: student.id,
      };
      setUser(authUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
      return { success: true };
    }

    // ── ALL OTHER ROLES: Query system_users ───────────────────
    const { data: sysUser, error } = await supabase
      .from("system_users")
      .select("id, name, login_id, password, role, assigned_year")
      .eq("login_id", loginId)
      .eq("is_active", true)
      .single();

    if (error || !sysUser) {
      return { success: false, error: "Login ID not found." };
    }

    if (sysUser.password !== password) {
      return { success: false, error: "Incorrect password." };
    }

    if (sysUser.role !== role) {
      return { success: false, error: `This account is not registered as ${role}. Please select the correct role.` };
    }

    const authUser: AuthUser = {
      id: sysUser.id,
      name: sysUser.name,
      role: sysUser.role as UserRole,
      loginId: sysUser.login_id,
      assignedYear: sysUser.assigned_year || undefined,
    };

    setUser(authUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
