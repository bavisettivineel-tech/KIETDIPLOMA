import { DashboardLayout } from "@/components/DashboardLayout";
import { CreditCard, CheckCircle2, Clock, TrendingUp, Download, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useFees, useFeePayments } from "@/hooks/useSupabaseData";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Fees = () => {
  const { data: fees = [], isLoading: loadingFees } = useFees();
  const { data: payments = [], isLoading: loadingPayments } = useFeePayments();
  const isLoading = loadingFees || loadingPayments;

  const { user } = useAuth();
  const qc = useQueryClient();
  const canManageFees = user?.role === "admin" || user?.role === "management";

  const [showFeeForm, setShowFeeForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [feeForm, setFeeForm] = useState({
    type: "payment", // "payment" or "assign"
    roll_number: "",
    amount: "",
    tuition: "",
    exam: "",
    other: "",
  });

  const handleAddFeeAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageFees) return;
    setFormLoading(true);

    const { data: student, error: stuError } = await supabase
      .from("students")
      .select("id, academic_year")
      .eq("roll_number", feeForm.roll_number.trim())
      .single();

    if (stuError || !student) {
      toast.error("Student not found.");
      setFormLoading(false);
      return;
    }

    if (feeForm.type === "assign") {
      const tuition = Number(feeForm.tuition) || 0;
      const exam = Number(feeForm.exam) || 0;
      const other = Number(feeForm.other) || 0;
      const total = tuition + exam + other;

      const { error } = await supabase.from("fees").insert({
        student_id: student.id,
        academic_year: student.academic_year,
        tuition,
        exam_fee: exam,
        other_fee: other,
        total
      });

      if (error) toast.error(error.message);
      else {
        toast.success("Fee structure assigned!");
        setShowFeeForm(false);
        qc.invalidateQueries({ queryKey: ["fees"] });
      }
    } else {
      const { data: feeData, error: feeErr } = await supabase
        .from("fees")
        .select("id")
        .eq("student_id", student.id)
        .maybeSingle();

      if (feeErr || !feeData) {
        toast.error("No fee structure found for student. Assign fees first.");
      } else {
        const { error } = await supabase.from("fee_payments").insert({
          student_id: student.id,
          fee_id: feeData.id,
          amount: Number(feeForm.amount),
          payment_date: new Date().toISOString()
        });
        if (error) toast.error(error.message);
        else {
          toast.success("Payment recorded successfully!");
          setShowFeeForm(false);
          qc.invalidateQueries({ queryKey: ["fee_payments"] });
        }
      }
    }
    setFormLoading(false);
  };

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
            {canManageFees && (
              <button
                onClick={() => setShowFeeForm(!showFeeForm)}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-sm shadow-red-500/20"
              >
                <Plus className="h-4 w-4" /> {showFeeForm ? "Cancel" : "Add / Update Fee"}
              </button>
            )}
          </div>
        </div>

        {/* Add / Update Fee Form */}
        {showFeeForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card border p-6 shadow-card">
            <h3 className="text-sm font-semibold mb-4">Manage Student Fees</h3>
            <form onSubmit={handleAddFeeAction} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Action Type</label>
                  <select
                    value={feeForm.type}
                    onChange={e => setFeeForm({ ...feeForm, type: e.target.value })}
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="payment">Record Payment (Status Update)</option>
                    <option value="assign">Assign Fee Structure</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Student Roll Number</label>
                  <input type="text" value={feeForm.roll_number} onChange={e => setFeeForm({ ...feeForm, roll_number: e.target.value })} placeholder="e.g. 25371-CM-067" className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                </div>

                {feeForm.type === "payment" && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold">Payment Amount (₹)</label>
                    <input type="number" value={feeForm.amount} onChange={e => setFeeForm({ ...feeForm, amount: e.target.value })} placeholder="Amount Paid" className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                  </div>
                )}

                {feeForm.type === "assign" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold">Tuition Fee (₹)</label>
                      <input type="number" value={feeForm.tuition} onChange={e => setFeeForm({ ...feeForm, tuition: e.target.value })} placeholder="e.g. 40000" className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold">Exam Fee (₹)</label>
                      <input type="number" value={feeForm.exam} onChange={e => setFeeForm({ ...feeForm, exam: e.target.value })} placeholder="e.g. 1500" className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold">Other Fee (₹)</label>
                      <input type="number" value={feeForm.other} onChange={e => setFeeForm({ ...feeForm, other: e.target.value })} placeholder="e.g. 500" className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={formLoading} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60">
                  {formLoading ? "Processing..." : "Submit"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

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
