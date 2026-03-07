import { DashboardLayout } from "@/components/DashboardLayout";
import { Plus, Shield, Users as UsersIcon, GraduationCap, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { useState } from "react";
import { toast } from "sonner";

export default function Users() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const isAdminOrManagement = user?.role === "admin" || user?.role === "management";

    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: "",
        login_id: "",
        password: "",
        role: "staff" as "admin" | "management" | "staff" | "faculty",
        assigned_year: "",
    });

    const { data: users = [], isLoading } = useQuery({
        queryKey: ["system_users"],
        queryFn: async () => {
            // @ts-ignore - Table created remotely, types not regenerated locally yet
            const { data, error } = await supabase
                .from("system_users" as any)
                .select("*")
                .neq("role", "student") // Students use Roll Number, don't show here usually unless needed. We hide them to keep it clean.
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data || [];
        },
        enabled: isAdminOrManagement, // only load if authorized
    });

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.login_id || !form.password) return;
        setLoading(true);

        // @ts-ignore - Table created remotely, types not regenerated locally yet
        const { error } = await supabase.from("system_users" as any).insert({
            name: form.name,
            login_id: form.login_id,
            password: form.password,
            role: form.role,
            assigned_year: form.role === "faculty" ? form.assigned_year : null,
            is_active: true,
        });

        setLoading(false);

        if (error) {
            toast.error(error.message || "Failed to add user. Login ID might already exist.");
        } else {
            toast.success("User account created successfully!");
            setShowForm(false);
            setForm({ name: "", login_id: "", password: "", role: "staff", assigned_year: "" });
            qc.invalidateQueries({ queryKey: ["system_users"] });
        }
    };

    const handleDelete = async (id: string, loginId: string) => {
        if (loginId === "Kiet group" || loginId === "Kiet Diploma") {
            toast.error("You cannot delete the master accounts.");
            return;
        }
        if (confirm("Are you sure you want to delete this user?")) {
            // @ts-ignore - Table created remotely, types not regenerated locally yet
            const { error } = await supabase.from("system_users" as any).delete().eq("id", id);
            if (error) {
                toast.error("Failed to delete user.");
            } else {
                toast.success("User deleted successfully.");
                qc.invalidateQueries({ queryKey: ["system_users"] });
            }
        }
    };

    if (!isAdminOrManagement) {
        return (
            <DashboardLayout>
                <EmptyState icon={Shield} title="Access Denied" description="Only Admin and Management can manage system users." />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-[1200px]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Staff & Faculty Management</h1>
                        <p className="text-sm text-muted-foreground mt-1">Manage CTPOS, Administrative Staff, and other system users</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-sm shadow-red-500/20"
                    >
                        <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "Add New User"}
                    </button>
                </div>

                {/* Add User Form */}
                {showForm && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card border p-6 shadow-card">
                        <h3 className="text-sm font-semibold mb-4">Create New Account</h3>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold">Full Name</label>
                                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="User Name" className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold">Login ID</label>
                                    <input type="text" value={form.login_id} onChange={e => setForm({ ...form, login_id: e.target.value })} placeholder="Unique Login ID" className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold">Password</label>
                                    <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold">Role</label>
                                    <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as any })} className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" required>
                                        <option value="faculty">CTPOS (Faculty)</option>
                                        <option value="staff">Administrative Staff</option>
                                        {user?.role === "admin" && <option value="management">Management</option>}
                                        {user?.role === "admin" && <option value="admin">Admin</option>}
                                    </select>
                                </div>
                                {form.role === "faculty" && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold">Assigned Academic Year</label>
                                        <select value={form.assigned_year} onChange={e => setForm({ ...form, assigned_year: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" required>
                                            <option value="">Select Year</option>
                                            <option value="1st Year">1st Year</option>
                                            <option value="2nd Year">2nd Year</option>
                                            <option value="3rd Year">3rd Year</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="submit" disabled={loading} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60">
                                    {loading ? "Creating..." : "Create Account"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {/* Users List */}
                {isLoading ? <LoadingState /> : users.length === 0 ? (
                    <EmptyState icon={UsersIcon} title="No staff added yet." />
                ) : (
                    <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-secondary/30">
                                        <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Name</th>
                                        <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Login ID</th>
                                        <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Password</th>
                                        <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Role</th>
                                        <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Assigned Year</th>
                                        <th className="text-right px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((row: any, i: number) => (
                                        <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b last:border-0 hover:bg-secondary/20 transition-colors">
                                            <td className="px-5 py-4 font-bold">{row.name}</td>
                                            <td className="px-5 py-4 font-mono text-xs">{row.login_id}</td>
                                            <td className="px-5 py-4 font-mono text-xs">{row.password}</td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                          ${row.role === 'admin' ? 'bg-red-500/10 text-red-600' :
                                                        row.role === 'management' ? 'bg-blue-500/10 text-blue-600' :
                                                            row.role === 'faculty' ? 'bg-emerald-500/10 text-emerald-600' :
                                                                'bg-purple-500/10 text-purple-600'}`}
                                                >
                                                    {row.role === 'faculty' ? 'CTPOS' : row.role.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-muted-foreground">{row.assigned_year || "—"}</td>
                                            <td className="px-5 py-4 text-right">
                                                {(row.login_id !== "Kiet group" && row.login_id !== "Kiet Diploma") && (
                                                    <button onClick={() => handleDelete(row.id, row.login_id)} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
