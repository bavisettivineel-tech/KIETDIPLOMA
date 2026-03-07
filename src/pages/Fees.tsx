import { DashboardLayout } from "@/components/DashboardLayout";
import { CreditCard, CheckCircle2, Clock, TrendingUp, Download } from "lucide-react";
import { motion } from "framer-motion";
import { useFees, useFeePayments } from "@/hooks/useSupabaseData";
import { EmptyState, LoadingState } from "@/components/EmptyState";

const Fees = () => {
  const { data: fees = [], isLoading: loadingFees } = useFees();
  const { data: payments = [], isLoading: loadingPayments } = useFeePayments();
  const isLoading = loadingFees || loadingPayments;

  // Compute per-student paid amounts
  const paidByStudent: Record<string, number> = {};
  payments.forEach((p: any) => {
    paidByStudent[p.student_id] = (paidByStudent[p.student_id] || 0) + Number(p.amount);
  });

  const totalExpected = fees.reduce((s: number, f: any) => s + (Number(f.total) || 0), 0);
  const totalCollected = Object.values(paidByStudent).reduce((s, v) => s + v, 0);
  const totalPending = Math.max(0, totalExpected - totalCollected);
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  const getInitials = (name: string) => (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1400px]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Fees</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage fee structures and track payments</p>
          <div className="flex gap-2.5">
            <button onClick={() => {
              const rows = fees.map((f: any) => [
                f.students?.name,
                f.students?.roll_number,
                f.academic_year,
                f.tuition || 0,
                f.exam_fee || 0,
                f.other_fee || 0,
                f.total || 0,
                paidByStudent[f.student_id] || 0,
                Math.max(0, (f.total || 0) - (paidByStudent[f.student_id] || 0))
              ]);
              const header = ["Name", "Roll No", "Year", "Tuition Fee", "Exam Fee", "Other Fee", "Total Fee", "Paid", "Pending"];
              const csv = [header, ...rows].map(e => e.join(",")).join("\n");
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `kiet_fees_export.csv`;
              link.click();
            }} className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors shadow-sm">
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </div>

        {isLoading ? <LoadingState /> : fees.length === 0 ? (
          <EmptyState icon={CreditCard} title="No fee records available"
            description="Fee records will appear here once management assigns fees to students." />
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: "Total Expected", value: `₹${(totalExpected / 100000).toFixed(2)}L`, icon: CreditCard, color: "text-blue-500", bg: "bg-blue-500/10", gradient: "gradient-info" },
                { label: "Collected", value: `₹${(totalCollected / 100000).toFixed(2)}L`, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", gradient: "gradient-success" },
                { label: "Pending", value: `₹${(totalPending / 100000).toFixed(2)}L`, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", gradient: "gradient-warning" },
                { label: "Collection Rate", value: `${collectionRate}%`, icon: TrendingUp, color: "text-red-500", bg: "bg-red-500/10", gradient: "gradient-primary" },
              ].map((c, i) => (
                <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="rounded-2xl bg-card border p-6 shadow-card card-hover relative overflow-hidden">
                  <div className={`absolute inset-0 ${c.gradient} pointer-events-none`} />
                  <div className="relative flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl ${c.bg} flex items-center justify-center`}>
                      <c.icon className={`h-5 w-5 ${c.color}`} />
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{c.label}</p>
                      <p className="text-2xl font-bold mt-0.5">{c.value}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Fee Table */}
            <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary/30">
                      <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Student</th>
                      <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Roll No</th>
                      <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Year</th>
                      <th className="text-right px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Total Fee</th>
                      <th className="text-right px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Paid</th>
                      <th className="text-right px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Balance</th>
                      <th className="text-center px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((f: any, i: number) => {
                      const student = f.students;
                      const paid = paidByStudent[f.student_id] || 0;
                      const total = Number(f.total) || 0;
                      const balance = Math.max(0, total - paid);
                      const isPaid = balance === 0;
                      return (
                        <motion.tr key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
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
                          <td className="px-5 py-4 text-muted-foreground">{student?.academic_year || "—"}</td>
                          <td className="px-5 py-4 text-right font-medium">₹{total.toLocaleString()}</td>
                          <td className="px-5 py-4 text-right text-emerald-600 font-medium">₹{paid.toLocaleString()}</td>
                          <td className="px-5 py-4 text-right">
                            <span className={`font-semibold ${balance > 0 ? "text-amber-600" : "text-emerald-600"}`}>₹{balance.toLocaleString()}</span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${isPaid ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${isPaid ? "bg-emerald-500" : "bg-amber-500"}`} />
                              {isPaid ? "Paid" : "Pending"}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Fees;
