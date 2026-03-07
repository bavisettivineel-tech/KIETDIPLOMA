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

  // Group by route
  const routeMap: Record<string, { students: any[]; fee: number }> = {};
  registrations.forEach((r: any) => {
    if (!routeMap[r.route_name]) routeMap[r.route_name] = { students: [], fee: Number(r.transport_fee) };
    routeMap[r.route_name].students.push(r);
  });
  const routes = Object.entries(routeMap);

  const totalStudents = registrations.length;
  const totalRevenue = registrations.reduce((s: number, r: any) => s + Number(r.transport_fee), 0);
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
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Total Routes", value: routes.length, icon: Bus, color: "text-blue-500", bg: "bg-blue-500/10" },
                { label: "Students Enrolled", value: totalStudents, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                { label: "Total Revenue", value: `₹${(totalRevenue / 100000).toFixed(2)}L`, icon: IndianRupee, color: "text-amber-500", bg: "bg-amber-500/10" },
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

            {/* Route Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {routes.map(([routeName, info], i) => (
                <motion.div key={routeName} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                  className="rounded-2xl bg-card border p-6 shadow-card card-hover space-y-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Bus className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">{routeName}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Fee: ₹{info.fee.toLocaleString()}</p>
                      </div>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600">Active</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Students</p>
                      <p className="text-lg font-bold">{info.students.length}</p>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Fee/Year</p>
                      <p className="text-lg font-bold">₹{info.fee.toLocaleString()}</p>
                    </div>
                  </div>
                  {/* Pickup points */}
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Pickup Points</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[...new Set(info.students.map((s: any) => s.pickup_point))].map((pt: any) => (
                        <span key={pt} className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium">{pt}</span>
                      ))}
                    </div>
                  </div>
                  {/* Students list */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Registered Students</p>
                    {info.students.slice(0, 5).map((s: any) => (
                      <div key={s.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/30">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                          {getInitials(s.students?.name || "")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{s.students?.name || "—"}</p>
                          <p className="text-[10px] text-muted-foreground">{s.pickup_point}</p>
                        </div>
                      </div>
                    ))}
                    {info.students.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center py-1">+{info.students.length - 5} more</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Transport;
