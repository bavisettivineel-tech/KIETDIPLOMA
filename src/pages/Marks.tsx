import { DashboardLayout } from "@/components/DashboardLayout";
import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Save, Download } from "lucide-react";
import { useInternalMarks, useAssignmentMarks } from "@/hooks/useSupabaseData";
import { EmptyState, LoadingState } from "@/components/EmptyState";

const Marks = () => {
  const [tab, setTab] = useState<"internal" | "assignment">("internal");
  const { data: internalMarks = [], isLoading: loadingInternal } = useInternalMarks();
  const { data: assignmentMarks = [], isLoading: loadingAssignment } = useAssignmentMarks();

  const isLoading = tab === "internal" ? loadingInternal : loadingAssignment;
  const data = tab === "internal" ? internalMarks : assignmentMarks;
  const hasData = data.length > 0;

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
          </div>
        </div>

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
                  {data.map((row: any, i: number) => {
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
