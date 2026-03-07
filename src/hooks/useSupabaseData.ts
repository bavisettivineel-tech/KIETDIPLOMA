import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

// ─── Students ───────────────────────────────────────────────

export function useStudents() {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["students", user?.role, user?.assignedYear, user?.studentId],
        queryFn: async () => {
            let query = supabase.from("students").select("*").eq("is_active", true).order("roll_number");

            // Faculty sees only their assigned year
            if (user?.role === "faculty" && user.assignedYear) {
                query = query.eq("academic_year", user.assignedYear);
            }
            // Student sees only themselves (studentId = student UUID)
            if (user?.role === "student" && user.studentId) {
                query = query.eq("id", user.studentId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return (data || []) as Tables<"students">[];
        },
        enabled: !!user,
    });
}

// ─── Attendance ─────────────────────────────────────────────

export function useAttendance(date: string) {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["attendance", date, user?.role],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("attendance")
                .select("*, students!inner(name, academic_year, roll_number)")
                .eq("attendance_date", date);
            if (error) throw error;
            return data || [];
        },
        enabled: !!user && !!date,
    });
}

export function useSaveAttendance() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (records: { student_id: string; roll_number: string; attendance_date: string; status: string }[]) => {
            const { error } = await supabase.from("attendance").upsert(
                records.map((r) => ({
                    student_id: r.student_id,
                    roll_number: r.roll_number,
                    attendance_date: r.attendance_date,
                    status: r.status,
                })),
                { onConflict: "student_id,attendance_date" }
            );
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
    });
}

// ─── Internal Marks ─────────────────────────────────────────

export function useInternalMarks() {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["internal_marks", user?.role, user?.studentId],
        queryFn: async () => {
            let query = supabase
                .from("internal_marks")
                .select("*, students!inner(name, roll_number, academic_year)")
                .order("created_at");

            // Students only see their own marks (studentId = student UUID)
            if (user?.role === "student" && user.studentId) {
                query = query.eq("student_id", user.studentId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
        enabled: !!user,
    });
}

// ─── Assignment Marks ───────────────────────────────────────

export function useAssignmentMarks() {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["assignment_marks", user?.role, user?.studentId],
        queryFn: async () => {
            let query = supabase
                .from("assignment_marks")
                .select("*, students!inner(name, roll_number, academic_year)")
                .order("created_at");

            if (user?.role === "student" && user.studentId) {
                query = query.eq("student_id", user.studentId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
        enabled: !!user,
    });
}

// ─── Fees ───────────────────────────────────────────────────

export function useFees() {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["fees", user?.role, user?.studentId],
        queryFn: async () => {
            let query = supabase
                .from("fees")
                .select("*, students!inner(name, roll_number, academic_year)")
                .order("created_at");

            if (user?.role === "student" && user.studentId) {
                query = query.eq("student_id", user.studentId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
        enabled: !!user,
    });
}

export function useFeePayments() {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["fee_payments", user?.role, user?.studentId],
        queryFn: async () => {
            let query = supabase
                .from("fee_payments")
                .select("*, students!inner(name, roll_number), fees!inner(total, tuition, exam_fee, other_fee)")
                .order("payment_date", { ascending: false });

            if (user?.role === "student" && user.studentId) {
                query = query.eq("student_id", user.studentId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
        enabled: !!user,
    });
}

// ─── Transport ──────────────────────────────────────────────

export function useTransport() {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["transport", user?.role, user?.studentId],
        queryFn: async () => {
            let query = supabase
                .from("transport_registrations")
                .select("*, students!inner(name, roll_number, academic_year)")
                .order("route_name");

            if (user?.role === "student" && user.studentId) {
                query = query.eq("student_id", user.studentId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
        enabled: !!user,
    });
}

// ─── Notices ────────────────────────────────────────────────

export function useNotices() {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["notices"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("notices")
                .select("*")
                .order("is_pinned", { ascending: false })
                .order("created_at", { ascending: false });
            if (error) throw error;
            return (data || []) as Tables<"notices">[];
        },
        enabled: !!user,
    });
}

// ─── Dashboard Aggregates ───────────────────────────────────

export function useDashboardStats() {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["dashboard_stats", user?.role],
        queryFn: async () => {
            const { count: studentCount } = await supabase
                .from("students")
                .select("*", { count: "exact", head: true })
                .eq("is_active", true);

            const { data: yearData } = await supabase
                .from("students")
                .select("academic_year")
                .eq("is_active", true);

            const yearCounts: Record<string, number> = {};
            (yearData || []).forEach((s) => {
                yearCounts[s.academic_year] = (yearCounts[s.academic_year] || 0) + 1;
            });

            const { data: feeData } = await supabase.from("fees").select("total");
            const totalFeeExpected = (feeData || []).reduce((s, f) => s + (Number(f.total) || 0), 0);

            const { data: payData } = await supabase.from("fee_payments").select("amount");
            const totalFeeCollected = (payData || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);

            const { count: transportCount } = await supabase
                .from("transport_registrations")
                .select("*", { count: "exact", head: true })
                .eq("status", "active");

            const today = new Date().toISOString().split("T")[0];
            const { data: todayAttendance } = await supabase
                .from("attendance")
                .select("status")
                .eq("attendance_date", today);

            const presentToday = (todayAttendance || []).filter((a) => a.status === "present").length;
            const totalToday = (todayAttendance || []).length;

            const { data: recentNotices } = await supabase
                .from("notices")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(5);

            return {
                studentCount: studentCount || 0,
                yearCounts,
                totalFeeExpected,
                totalFeeCollected,
                transportCount: transportCount || 0,
                presentToday,
                totalAttendanceToday: totalToday,
                recentNotices: recentNotices || [],
            };
        },
        enabled: !!user,
    });
}
