import { DashboardLayout } from "@/components/DashboardLayout";
import { CalendarCheck, Check, X, Save } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useStudents, useSaveAttendance } from "@/hooks/useSupabaseData";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Attendance = () => {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState("All");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<Record<string, "present" | "absent">>({});

  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const saveAttendance = useSaveAttendance();

  // Load existing attendance for selected date
  useQuery({
    queryKey: ["attendance_for_date", date],
    queryFn: async () => {
      const { data } = await supabase.from("attendance").select("student_id, status").eq("attendance_date", date);
      if (data) {
        const map: Record<string, "present" | "absent"> = {};
        data.forEach((r) => { map[r.student_id] = r.status as any; });
        setAttendance(map);
      }
      return data;
    },
    enabled: !!date,
  });

  const years = ["All", ...Array.from(new Set(students.map(s => s.academic_year))).sort()];
  const filtered = selectedYear === "All" ? students : students.filter(s => s.academic_year === selectedYear);

  const presentCount = Object.values(attendance).filter(v => v === "present").length;
  const absentCount = Object.values(attendance).filter(v => v === "absent").length;
  const unmarkedCount = filtered.length - filtered.filter(s => attendance[s.id]).length;

  const markAll = (status: "present" | "absent") => {
    const obj: Record<string, "present" | "absent"> = { ...attendance };
    filtered.forEach(s => { obj[s.id] = status; });
    setAttendance(obj);
  };

  const handleSave = async () => {
    const records = filtered
      .filter(s => attendance[s.id])
      .map(s => ({ student_id: s.id, roll_number: s.roll_number, attendance_date: date, status: attendance[s.id] }));
    if (records.length === 0) { toast.error("No attendance marked yet."); return; }
    saveAttendance.mutate(records, {
      onSuccess: () => toast.success("Attendance saved successfully!"),
      onError: () => toast.error("Failed to save attendance."),
    });
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1200px]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-sm text-muted-foreground mt-1">Mark daily attendance for students</p>
        </div>

        {studentsLoading ? <LoadingState /> : students.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No attendance records available" description="Attendance records will appear here once students are added to the system." />
        ) : (
          <>
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-xl bg-secondary/50 p-1.5 border flex-wrap">
                {years.map(year => (
                  <button key={year} onClick={() => setSelectedYear(year)}
                    className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${selectedYear === year ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    {year}
                  </button>
                ))}
              </div>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="rounded-xl border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 shadow-sm" />
              <div className="flex gap-2 ml-auto">
                <button onClick={() => markAll("present")} className="flex items-center gap-2 rounded-xl bg-emerald-500/10 text-emerald-600 px-4 py-2.5 text-xs font-semibold hover:bg-emerald-500/20 transition-colors border border-emerald-500/20">
                  <Check className="h-3.5 w-3.5" /> Mark All Present
                </button>
                <button onClick={() => markAll("absent")} className="flex items-center gap-2 rounded-xl bg-red-500/10 text-red-600 px-4 py-2.5 text-xs font-semibold hover:bg-red-500/20 transition-colors border border-red-500/20">
                  <X className="h-3.5 w-3.5" /> Mark All Absent
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Present", value: presentCount, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                { label: "Absent", value: absentCount, color: "text-red-500", bg: "bg-red-500/10" },
                { label: "Unmarked", value: unmarkedCount, color: "text-amber-500", bg: "bg-amber-500/10" },
                { label: "Total", value: filtered.length, color: "text-blue-500", bg: "bg-blue-500/10" },
              ].map((card, i) => (
                <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="rounded-2xl bg-card border p-5 shadow-card flex items-center gap-4">
                  <div className={`h-11 w-11 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <span className={`text-lg font-bold ${card.color}`}>{card.value}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{card.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Table */}
            <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-secondary/30">
                    <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Student</th>
                    <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Roll Number</th>
                    <th className="text-center px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => {
                    const status = attendance[s.id];
                    return (
                      <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                        className={`border-b last:border-0 transition-colors ${status === "present" ? "bg-emerald-500/[0.03]" : status === "absent" ? "bg-red-500/[0.03]" : "hover:bg-secondary/30"}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-[11px] font-bold ${status === "present" ? "bg-emerald-500/10 text-emerald-600" : status === "absent" ? "bg-red-500/10 text-red-600" : "bg-slate-100 text-slate-500"}`}>
                              {getInitials(s.name)}
                            </div>
                            <span className="font-semibold">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{s.roll_number}</td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setAttendance(p => ({ ...p, [s.id]: "present" }))}
                              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${status === "present" ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105" : "bg-secondary text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500"}`}>
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => setAttendance(p => ({ ...p, [s.id]: "absent" }))}
                              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${status === "absent" ? "bg-red-500 text-white shadow-md shadow-red-500/30 scale-105" : "bg-secondary text-muted-foreground hover:bg-red-500/10 hover:text-red-500"}`}>
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button onClick={handleSave} disabled={saveAttendance.isPending}
              className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-red-500/20 disabled:opacity-60">
              {saveAttendance.isPending ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
              {saveAttendance.isPending ? "Saving…" : "Save Attendance"}
            </button>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
