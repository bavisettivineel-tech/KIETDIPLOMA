import { DashboardLayout } from "@/components/DashboardLayout";
import { Bus, Users, IndianRupee, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useTransport } from "@/hooks/useSupabaseData";
import { EmptyState, LoadingState } from "@/components/EmptyState";

import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { Download } from "lucide-react";

const Transport = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canAddRegistration = user?.role === "admin" || user?.role === "management" || user?.role === "faculty";
  const { data: registrations = [], isLoading } = useTransport();

  const { data: dbRoutes = [] } = useQuery({
    queryKey: ["bus_routes"],
    queryFn: async () => {
      // @ts-ignore
      const { data, error } = await supabase.from("bus_routes").select("*");
      if (error) return [];
      return data || [];
    }
  });

  const activeRoutesList = dbRoutes.length > 0
    ? dbRoutes.map((r: any) => r.route_name)
    : ["Route 1 - East City", "Route 2 - West End", "Route 3 - North Hills", "Route 4 - South Valley"];

  const [showForm, setShowForm] = useState(false);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [newRouteName, setNewRouteName] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [regForm, setRegForm] = useState({
    roll_number: "",
    route_name: "Route 1",
    pickup_point: "",
    transport_fee: 15000,
  });

  const handleExport = () => {
    const csvContent = [
      ["Student Name", "Roll Number", "Year", "Route Name", "Pickup Point", "Transport Fee", "Status"],
      ...registrations.map((r: any) => [
        r.students?.name,
        r.students?.roll_number,
        r.students?.academic_year,
        r.route_name,
        r.pickup_point,
        r.transport_fee,
        r.status
      ])
    ].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "kiet_transport_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Transport data exported as CSV");
  };

  const handleAddRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddRegistration) {
      toast.error("You do not have permission to modify transport data.");
      return;
    }
    setFormLoading(true);

    // Find student by roll number
    const { data: student, error: stuError } = await supabase
      .from("students")
      .select("id")
      .eq("roll_number", regForm.roll_number.trim())
      .single();

    if (stuError || !student) {
      toast.error("Student with this roll number not found.");
      setFormLoading(false);
      return;
    }

    const { error } = await supabase.from("transport_registrations").insert({
      student_id: student.id,
      route_name: regForm.route_name,
      pickup_point: regForm.pickup_point,
      transport_fee: regForm.transport_fee,
      status: "active"
    });

    setFormLoading(false);

    if (error) {
      toast.error(error.message || "Failed to add registration.");
    } else {
      toast.success("Bus registration added successfully!");
      setShowForm(false);
      setRegForm({ roll_number: "", route_name: "Route 1", pickup_point: "", transport_fee: 15000 });
      qc.invalidateQueries({ queryKey: ["transport"] });
    }
  };

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== "admin" && user?.role !== "management") {
      toast.error("Only Management and Admin can add basic routes.");
      return;
    }
    setFormLoading(true);
    // @ts-ignore
    const { error } = await supabase.from("bus_routes").insert({ route_name: newRouteName });
    setFormLoading(false);
    if (error) {
      toast.error(error.message || "Failed to add route.");
    } else {
      toast.success("Bus route added successfully!");
      setNewRouteName("");
      setShowRouteForm(false);
      qc.invalidateQueries({ queryKey: ["bus_routes"] });
    }
  };

  const getPaidAmount = (status: string, totalFee: number) => {
    if (status === "Paid" || status === "Collected") return totalFee;
    if (status === "Pending" || status === "active" || !status) return 0;
    const num = Number(status);
    return isNaN(num) ? 0 : num;
  };

  const [selectedYear, setSelectedYear] = useState("All");

  const handleUpdatePaidAmount = async (id: string, newAmount: number, totalFee: number) => {
    const finalStatus = newAmount >= totalFee ? "Paid" : newAmount.toString();
    const { error } = await supabase.from("transport_registrations").update({ status: finalStatus }).eq("id", id);
    if (error) { toast.error(error.message); }
    else { toast.success("Payment amount updated"); qc.invalidateQueries({ queryKey: ["transport"] }); }
  }

  const years = ["All", ...Array.from(new Set(registrations.map((r: any) => r.students?.academic_year).filter(Boolean)))].sort();

  const filteredRegistrations = selectedYear === "All"
    ? registrations
    : registrations.filter((r: any) => r.students?.academic_year === selectedYear);

  const totalStudents = filteredRegistrations.length;
  const totalRevenue = filteredRegistrations.reduce((s: number, r: any) => s + Number(r.transport_fee), 0);
  const totalCollected = filteredRegistrations.reduce((s: number, r: any) => s + getPaidAmount(r.status, Number(r.transport_fee)), 0);
  const totalPending = Math.max(0, totalRevenue - totalCollected);

  const getInitials = (name: string) => (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1200px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Transport</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage bus routes and student registrations</p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={handleExport} className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors shadow-sm">
              <Download className="h-4 w-4" /> Export
            </button>
            {canAddRegistration && (
              <button
                onClick={() => { setShowForm(!showForm); setShowRouteForm(false); }}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-sm shadow-red-500/20"
              >
                <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "Add Registration"}
              </button>
            )}
            {(user?.role === "admin" || user?.role === "management") && (
              <button
                onClick={() => { setShowRouteForm(!showRouteForm); setShowForm(false); }}
                className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-secondary transition-colors shadow-sm"
              >
                <Bus className="h-4 w-4" /> {showRouteForm ? "Cancel" : "Add Route"}
              </button>
            )}
          </div>
        </div>

        {/* Add Route Form */}
        {showRouteForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card border p-6 shadow-card">
            <h3 className="text-sm font-semibold mb-4">Add Manual Bus Route</h3>
            <form onSubmit={handleAddRoute} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="space-y-2 flex-1">
                <label className="text-xs font-semibold">New Route Name</label>
                <input type="text" value={newRouteName} onChange={e => setNewRouteName(e.target.value)} placeholder="e.g. Route 5 - Central Avenue" className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
              </div>
              <button type="submit" disabled={formLoading} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60 h-[38px] min-w-[140px]">
                {formLoading ? "Adding..." : "Save Route"}
              </button>
            </form>
          </motion.div>
        )}

        {/* Add Registration Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card border p-6 shadow-card">
            <h3 className="text-sm font-semibold mb-4">New Bus Registration</h3>
            <form onSubmit={handleAddRegistration} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Student Roll Number</label>
                  <input type="text" value={regForm.roll_number} onChange={e => setRegForm({ ...regForm, roll_number: e.target.value })} placeholder="e.g. 25371-CM-067" className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Route Name</label>
                  <select value={regForm.route_name} onChange={e => setRegForm({ ...regForm, route_name: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" required>
                    {activeRoutesList.map((route: string) => (
                      <option key={route} value={route}>{route}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Pickup Point</label>
                  <input type="text" value={regForm.pickup_point} onChange={e => setRegForm({ ...regForm, pickup_point: e.target.value })} placeholder="e.g. Central Library" className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Transport Fee (₹)</label>
                  <input type="number" value={regForm.transport_fee} onChange={e => setRegForm({ ...regForm, transport_fee: Number(e.target.value) })} placeholder="15000" className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={formLoading} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60">
                  {formLoading ? "Processing..." : "Register Student"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {isLoading ? <LoadingState /> : registrations.length === 0 ? (
          <EmptyState icon={Bus} title="No transport registrations yet"
            description="Transport registrations will appear here once management registers students for bus routes." />
        ) : (
          <>
            {user?.role !== "student" && (
              <div className="flex items-center gap-1.5 rounded-xl bg-secondary/50 p-1.5 border w-fit mb-4 flex-wrap">
                {years.map(year => (
                  <button key={year as string} onClick={() => setSelectedYear(year as string)}
                    className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${selectedYear === year ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    {year as string}
                  </button>
                ))}
              </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { label: "Students Enrolled", value: totalStudents, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                { label: "Total Revenue", value: `₹${(totalRevenue / 100000).toFixed(2)}L`, icon: IndianRupee, color: "text-purple-500", bg: "bg-purple-500/10" },
                { label: "Collected", value: `₹${(totalCollected / 100000).toFixed(2)}L`, icon: IndianRupee, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                { label: "Pending", value: `₹${(totalPending / 100000).toFixed(2)}L`, icon: IndianRupee, color: "text-amber-500", bg: "bg-amber-500/10" }
              ].map((c, i) => (
                <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="rounded-2xl bg-card border p-5 shadow-card flex items-center gap-4">
                  <div className={`h-11 w-11 rounded-xl ${c.bg} flex items-center justify-center`}>
                    <c.icon className={`h-5 w-5 ${c.color}`} />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{c.label}</p>
                    <p className="text-2xl font-bold">{c.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* List Format View */}
            <div className="rounded-2xl border bg-card shadow-card overflow-hidden mt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary/30">
                      <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Student</th>
                      <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Roll No</th>
                      <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Year</th>
                      <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Route Info</th>
                      <th className="text-right px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Total Fee</th>
                      <th className="text-right px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Paid Amount</th>
                      <th className="text-right px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Balance</th>
                      <th className="text-center px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map((r: any, i: number) => {
                      const student = r.students;
                      const totalFee = Number(r.transport_fee) || 0;
                      const paidAmount = getPaidAmount(r.status, totalFee);
                      const balance = Math.max(0, totalFee - paidAmount);
                      const isPaid = balance <= 0;
                      return (
                        <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b last:border-0 hover:bg-secondary/20 transition-colors">
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
                          <td className="px-5 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-[13px]">{r.route_name}</span>
                              <span className="text-xs text-muted-foreground mt-0.5">{r.pickup_point}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right font-medium">₹{totalFee.toLocaleString()}</td>
                          <td className="px-5 py-4 text-right">
                            {user?.role === "student" ? (
                              <span className="font-medium text-emerald-600">₹{paidAmount.toLocaleString()}</span>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-muted-foreground text-xs">₹</span>
                                <input
                                  type="number"
                                  defaultValue={paidAmount}
                                  onBlur={(e) => {
                                    const val = Number(e.target.value);
                                    if (val !== paidAmount && val >= 0) {
                                      handleUpdatePaidAmount(r.id, val, totalFee);
                                    }
                                  }}
                                  className="w-20 rounded-lg border-2 border-border bg-card px-2 py-1.5 text-xs font-bold text-emerald-600 outline-none focus:border-primary/50 text-right transition-colors"
                                />
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className={`font-bold ${balance > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                              ₹{balance.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${isPaid ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
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

export default Transport;
