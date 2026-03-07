import { DashboardLayout } from "@/components/DashboardLayout";
import { BarChart3, Download, FileText, Users, CalendarCheck, CreditCard, Bus, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useStudents, useFees, useFeePayments, useTransport } from "@/hooks/useSupabaseData";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";

const tooltipStyle = {
  background: "rgba(255,255,255,0.95)", border: "1px solid hsl(228,20%,90%)",
  borderRadius: "10px", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", padding: "10px 14px",
};

const Reports = () => {
  const { data: students = [], isLoading: ls } = useStudents();
  const { data: fees = [], isLoading: lf } = useFees();
  const { data: payments = [], isLoading: lp } = useFeePayments();
  const { data: transport = [], isLoading: lt } = useTransport();

  const isLoading = ls || lf || lp || lt;
  const hasData = students.length > 0 || fees.length > 0;

  // Build year distribution
  const yearCounts: Record<string, number> = {};
  students.forEach(s => { yearCounts[s.academic_year] = (yearCounts[s.academic_year] || 0) + 1; });
  const yearData = Object.entries(yearCounts).map(([name, count]) => ({ name, count }));

  // Fee collection totals
  const totalExpected = fees.reduce((s: number, f: any) => s + (Number(f.total) || 0), 0);
  const totalCollected = payments.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
  const feeData = [
    { name: "Collected", value: totalCollected, color: "#10B981" },
    { name: "Pending", value: Math.max(0, totalExpected - totalCollected), color: "#F59E0B" },
  ];

  // Transport by route
  const routeCounts: Record<string, number> = {};
  transport.forEach((r: any) => { routeCounts[r.route_name] = (routeCounts[r.route_name] || 0) + 1; });
  const routeData = Object.entries(routeCounts).map(([name, count]) => ({ name, count }));

  const COLORS = ["#D32F2F", "#1976D2", "#F59E0B", "#10B981", "#8B5CF6"];

  const quickReports = [
    { title: "Student Master List", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Fee Collection Summary", icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Attendance Summary Report", icon: CalendarCheck, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Transport Registration Report", icon: Bus, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1400px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">Analytics built from live database data</p>
          </div>
          <button className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors shadow-sm">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>

        {isLoading ? <LoadingState /> : !hasData ? (
          <EmptyState icon={BarChart3} title="No data available yet"
            description="Charts and reports will appear here once data is entered into the system." />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Students by Year */}
              {yearData.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="rounded-2xl bg-card border p-6 shadow-card">
                  <h3 className="text-sm font-semibold">Students by Year</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Total enrolled students</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={yearData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(228,20%,92%)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(224,10%,60%)" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(224,10%,60%)" axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" name="Students" radius={[8, 8, 0, 0]}>
                        {yearData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Fee Collection */}
              {totalExpected > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="rounded-2xl bg-card border p-6 shadow-card">
                  <h3 className="text-sm font-semibold">Fee Collection Status</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Collected vs. pending</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={feeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={5} dataKey="value" strokeWidth={0}>
                        {feeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {feeData.map(d => (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-[3px]" style={{ background: d.color }} /><span className="text-xs">{d.name}</span></div>
                        <span className="text-xs font-bold">₹{d.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Transport by Route */}
              {routeData.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="rounded-2xl bg-card border p-6 shadow-card lg:col-span-2">
                  <h3 className="text-sm font-semibold">Transport Registrations by Route</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Students per bus route</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={routeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(228,20%,92%)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(224,10%,60%)" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(224,10%,60%)" axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" name="Students" fill="#1976D2" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </div>

            {/* Quick Reports */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="rounded-2xl bg-card border p-6 shadow-card">
              <h3 className="text-sm font-semibold mb-4">Quick Reports</h3>
              <div className="space-y-2">
                {quickReports.map((r, i) => (
                  <motion.div key={r.title} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.06 }}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-secondary/50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-xl ${r.bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                        <r.icon className={`h-4 w-4 ${r.color}`} />
                      </div>
                      <div>
                        <span className="text-sm font-medium">{r.title}</span>
                        <p className="text-[11px] text-muted-foreground">PDF / Excel export available</p>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100">
                      <Download className="h-3.5 w-3.5" /> Download
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Reports;
