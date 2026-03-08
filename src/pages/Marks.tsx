import { DashboardLayout } from "@/components/DashboardLayout";
import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Save, Download, Plus } from "lucide-react";
import { useInternalMarks, useAssignmentMarks } from "@/hooks/useSupabaseData";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Marks = () => {
  const [tab, setTab] = useState<"internal" | "assignment">("internal");
  const { data: internalMarks = [], isLoading: loadingInternal } = useInternalMarks();
  const { data: assignmentMarks = [], isLoading: loadingAssignment } = useAssignmentMarks();
  const { user } = useAuth();
  const qc = useQueryClient();
  const canAddMarks = user && user.role !== "student";
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [markForm, setMarkForm] = useState({ roll_number: "", subject: "", mark1: "", mark2: "", mark3: "" });

  const handleAddMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddMarks) return;
    setFormLoading(true);

    const { data: student, error: stuError } = await supabase
      .from("students")
      .select("id")
      .eq("roll_number", markForm.roll_number.trim())
      .single();

    if (stuError || !student) {
      toast.error("Student with this roll number not found.");
      setFormLoading(false);
      return;
    }

    const m1 = markForm.mark1 ? Number(markForm.mark1) : null;
    const m2 = markForm.mark2 ? Number(markForm.mark2) : null;
    const m3 = markForm.mark3 ? Number(markForm.mark3) : null;

    if (tab === "internal") {
      const { error } = await supabase.from("internal_marks").insert({
        student_id: student.id,
        subject: markForm.subject,
        mid1: m1,
        mid2: m2,
        mid3: m3
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Internal marks added.");
        setShowForm(false);
        setMarkForm({ roll_number: "", subject: "", mark1: "", mark2: "", mark3: "" });
        qc.invalidateQueries({ queryKey: ["internal_marks"] });
      }
    } else {
      const { error } = await supabase.from("assignment_marks").insert({
        student_id: student.id,
        subject: markForm.subject,
        assignment1: m1,
        assignment2: m2,
        assignment3: m3
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Assignment marks added.");
        setShowForm(false);
        setMarkForm({ roll_number: "", subject: "", mark1: "", mark2: "", mark3: "" });
        qc.invalidateQueries({ queryKey: ["assignment_marks"] });
      }
    }
    setFormLoading(false);
  };

  const isLoading = tab === "internal" ? loadingInternal : loadingAssignment;
  const data = tab === "internal" ? internalMarks : assignmentMarks;
  const hasData = data.length > 0;

  const [selectedYear, setSelectedYear] = useState("All");

  const years = ["All", ...Array.from(new Set(data.map((d: any) => d.students?.academic_year).filter(Boolean)))].sort();

  const filteredData = selectedYear === "All"
    ? data
    : data.filter((d: any) => d.students?.academic_year === selectedYear);

  const getInitials = (name: string) => (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1200px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Marks</h1>
            <p className="text-sm text-muted-foreground mt-1">View and manage internal and assignment marks</p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => {
              const rows = data.map((d: any) => tab === "internal"
                ? [d.students?.name, d.students?.roll_number, d.subject, d.mid1, d.mid2, d.mid3]
                : [d.students?.name, d.students?.roll_number, d.subject, d.assignment1, d.assignment2, d.assignment3]
              );
              const header = tab === "internal"
                ? ["Name", "Roll No", "Subject", "Mid 1", "Mid 2", "Mid 3"]
                : ["Name", "Roll No", "Subject", "Assign 1", "Assign 2", "Assign 3"];

              const csv = [header, ...rows].map(e => e.join(",")).join("\n");
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `kiet_${tab}_marks.csv`;
              link.click();
            }} className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors shadow-sm">
              <Download className="h-4 w-4" /> Export
            </button>
            {canAddMarks && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-sm shadow-red-500/20"
              >
                <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "Add Marks"}
              </button>
            )}
          </div>
        </div>

        {/* Add Marks Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card border p-6 shadow-card">
            <h3 className="text-sm font-semibold mb-4">Add {tab === "internal" ? "Internal" : "Assignment"} Marks</h3>
            <form onSubmit={handleAddMarks} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Student Roll Number</label>
                  <input type="text" value={markForm.roll_number} onChange={e => setMarkForm({ ...markForm, roll_number: e.target.value })} placeholder="e.g. 25371-CM-067" className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Subject</label>
                  <input type="text" value={markForm.subject} onChange={e => setMarkForm({ ...markForm, subject: e.target.value })} placeholder="e.g. Mathematics" className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">{tab === "internal" ? "Mid 1" : "Assignment 1"}</label>
                  <input type="number" value={markForm.mark1} onChange={e => setMarkForm({ ...markForm, mark1: e.target.value })} placeholder="Max 25" className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">{tab === "internal" ? "Mid 2" : "Assignment 2"}</label>
                  <input type="number" value={markForm.mark2} onChange={e => setMarkForm({ ...markForm, mark2: e.target.value })} placeholder="Max 25" className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">{tab === "internal" ? "Mid 3" : "Assignment 3"}</label>
                  <input type="number" value={markForm.mark3} onChange={e => setMarkForm({ ...markForm, mark3: e.target.value })} placeholder="Max 25" className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={formLoading} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60">
                  {formLoading ? "Processing..." : "Save Marks"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1.5 rounded-xl bg-secondary/50 p-1.5 w-fit border">
          {(["internal", "assignment"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-lg px-5 py-2.5 text-xs font-medium transition-all capitalize ${tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "internal" ? "📝 Internal Marks" : "📋 Assignment Marks"}
            </button>
          ))}
        </div>

        {isLoading ? <LoadingState /> : !hasData ? (
          <EmptyState icon={BookOpen} title="No marks data available"
            description="Marks will appear here once faculty enters internal or assignment marks for students." />
        ) : (
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="rounded-2xl border bg-card shadow-card overflow-hidden">

            <div className="flex items-center gap-1.5 bg-secondary/30 p-4 border-b flex-wrap">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">Academic Year</span>
              {years.map(year => (
                <button key={year as string} onClick={() => setSelectedYear(year as string)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${selectedYear === year ? "bg-card shadow-sm text-foreground border border-border" : "text-muted-foreground hover:text-foreground border border-transparent"}`}>
                  {year as string}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-secondary/30">
                    <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Student</th>
                    <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Roll No</th>
                    <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Subject</th>
                    {tab === "internal" ? (
                      <>
                        <th className="text-center px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Mid 1<div className="text-[10px] font-normal opacity-60">/25</div></th>
                        <th className="text-center px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Mid 2<div className="text-[10px] font-normal opacity-60">/25</div></th>
                        <th className="text-center px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Mid 3<div className="text-[10px] font-normal opacity-60">/25</div></th>
                        <th className="text-center px-5 py-3.5 font-medium text-blue-500 text-xs uppercase tracking-wider">Average</th>
                      </>
                    ) : (
                      <>
                        <th className="text-center px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">A1<div className="text-[10px] font-normal opacity-60">/10</div></th>
                        <th className="text-center px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">A2<div className="text-[10px] font-normal opacity-60">/10</div></th>
                        <th className="text-center px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">A3<div className="text-[10px] font-normal opacity-60">/10</div></th>
                        <th className="text-center px-5 py-3.5 font-medium text-blue-500 text-xs uppercase tracking-wider">Total</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row: any, i: number) => {
                    const student = row.students;
                    const total = tab === "internal"
                      ? (row.average ?? 0)
                      : ((row.assignment1 ?? 0) + (row.assignment2 ?? 0) + (row.assignment3 ?? 0));
                    const max = tab === "internal" ? 25 : 30;
                    const pct = Math.round((total / max) * 100);
                    return (
                      <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                        className="border-b last:border-0 hover:bg-secondary/20 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-600">
                              {getInitials(student?.name || "")}
                            </div>
                            <span className="font-semibold">{student?.name || "—"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{student?.roll_number || "—"}</td>
                        <td className="px-5 py-4 text-muted-foreground">{row.subject}</td>
                        {tab === "internal" ? (
                          <>
                            <td className="px-5 py-4 text-center"><span className="inline-flex items-center justify-center h-8 w-12 rounded-lg bg-secondary text-sm font-medium">{row.mid1 ?? "—"}</span></td>
                            <td className="px-5 py-4 text-center"><span className="inline-flex items-center justify-center h-8 w-12 rounded-lg bg-secondary text-sm font-medium">{row.mid2 ?? "—"}</span></td>
                            <td className="px-5 py-4 text-center"><span className="inline-flex items-center justify-center h-8 w-12 rounded-lg bg-secondary text-sm font-medium">{row.mid3 ?? "—"}</span></td>
                          </>
                        ) : (
                          <>
                            <td className="px-5 py-4 text-center"><span className="inline-flex items-center justify-center h-8 w-12 rounded-lg bg-secondary text-sm font-medium">{row.assignment1 ?? "—"}</span></td>
                            <td className="px-5 py-4 text-center"><span className="inline-flex items-center justify-center h-8 w-12 rounded-lg bg-secondary text-sm font-medium">{row.assignment2 ?? "—"}</span></td>
                            <td className="px-5 py-4 text-center"><span className="inline-flex items-center justify-center h-8 w-12 rounded-lg bg-secondary text-sm font-medium">{row.assignment3 ?? "—"}</span></td>
                          </>
                        )}
                        <td className="px-5 py-4 text-center">
                          <span className={`text-sm font-bold ${pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-600"}`}>
                            {total.toFixed(1)}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Marks;
