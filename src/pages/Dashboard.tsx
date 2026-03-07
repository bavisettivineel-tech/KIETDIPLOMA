import { DashboardLayout } from "@/components/DashboardLayout";
import { Users, CalendarCheck, IndianRupee, Bus, TrendingUp, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useSupabaseData";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { motion } from "framer-motion";
import { StudentPortal } from "@/components/StudentPortal";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";

const tooltipStyle = {
  background: "rgba(255,255,255,0.95)",
  border: "1px solid hsl(228, 20%, 90%)",
  borderRadius: "10px",
  fontSize: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  padding: "10px 14px",
};

const YEAR_COLORS = ["#D32F2F", "#1976D2", "#F59E0B", "#10B981"];

const Dashboard = () => {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return <DashboardLayout><LoadingState /></DashboardLayout>;
  }

  const hasData = stats && stats.studentCount > 0;

  // Build year distribution data for pie chart
  const yearPieData = stats ? Object.entries(stats.yearCounts).map(([name, value], i) => ({
    name, value, color: YEAR_COLORS[i % YEAR_COLORS.length],
  })) : [];

  // Attendance percentage
  const attendancePercent = stats && stats.totalAttendanceToday > 0
    ? Math.round((stats.presentToday / stats.totalAttendanceToday) * 100)
    : 0;

  const feeCollected = stats ? stats.totalFeeCollected : 0;
  const feeExpected = stats ? stats.totalFeeExpected : 0;
  const collectionRate = feeExpected > 0 ? Math.round((feeCollected / feeExpected) * 100) : 0;

  const roleDashNames: Record<string, string> = {
    admin: "Admin Dashboard",
    management: "Management Dashboard",
    staff: "Staff Dashboard",
    faculty: "Faculty Dashboard",
    student: "Student Dashboard",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1400px]">
        {/* Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {user ? roleDashNames[user.role] : "Dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back, {user?.name} 👋
            </p>
          </div>
        </div>

        {user?.role === "student" ? (
          <StudentPortal />
        ) : !hasData ? (
          <EmptyState
            icon={TrendingUp}
            title="System is ready"
            description="Data will appear after users begin using the system. Start by adding students, marking attendance, and entering marks."
          />
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: "TOTAL STUDENTS", value: stats.studentCount.toLocaleString(), icon: Users, color: "text-red-500", bg: "bg-red-500/10", gradient: "gradient-primary" },
                { label: "TODAY'S ATTENDANCE", value: stats.totalAttendanceToday > 0 ? `${attendancePercent}%` : "—", icon: CalendarCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", gradient: "gradient-success" },
                { label: "FEE COLLECTION", value: feeCollected > 0 ? `₹${(feeCollected / 100000).toFixed(1)}L` : "₹0", icon: IndianRupee, color: "text-blue-500", bg: "bg-blue-500/10", gradient: "gradient-info" },
                { label: "TRANSPORT USERS", value: stats.transportCount.toLocaleString(), icon: Bus, color: "text-amber-500", bg: "bg-amber-500/10", gradient: "gradient-warning" },
              ].map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl bg-card border p-6 shadow-card card-hover relative overflow-hidden"
                >
                  <div className={`absolute inset-0 ${card.gradient} pointer-events-none`} />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{card.label}</p>
                      <p className="text-3xl font-bold mt-1">{card.value}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                      <card.icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Students by Year Pie */}
              {yearPieData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-2xl bg-card border p-6 shadow-card"
                >
                  <h3 className="text-sm font-semibold">Students by Year</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Total: {stats.studentCount.toLocaleString()}</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={yearPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value" strokeWidth={0}>
                        {yearPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {yearPieData.map((y) => (
                      <div key={y.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-[3px]" style={{ background: y.color }} />
                          <span className="text-xs font-medium">{y.name}</span>
                        </div>
                        <span className="text-xs font-bold">{y.value}<span className="text-muted-foreground font-normal ml-1">({stats.studentCount > 0 ? Math.round((y.value / stats.studentCount) * 100) : 0}%)</span></span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Fee Collection Summary */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="lg:col-span-2 rounded-2xl bg-card border p-6 shadow-card"
              >
                <h3 className="text-sm font-semibold">Fee Collection Summary</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Overall collection rate</p>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">₹{(feeExpected / 100000).toFixed(1)}L</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Expected</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">₹{(feeCollected / 100000).toFixed(1)}L</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Collected</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">{collectionRate}%</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Rate</p>
                  </div>
                </div>
                <div className="mt-6 h-3 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all" style={{ width: `${collectionRate}%` }} />
                </div>
              </motion.div>
            </div>

            {/* Recent Notices */}
            {stats.recentNotices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-2xl bg-card border p-6 shadow-card"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Recent Notices</h3>
                </div>
                <div className="space-y-3">
                  {stats.recentNotices.map((n: any) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/30 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Bell className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {n.posted_by_name && ` • ${n.posted_by_name}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
