import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, BookOpen, Clock, CalendarCheck, Bus, Award, Download, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export const StudentPortal = () => {
    const { user } = useAuth();

    // Fetch detailed student info including transport and attendance
    const { data: studentInfo, isLoading } = useQuery({
        queryKey: ["student_portal", user?.studentId],
        queryFn: async () => {
            if (!user?.studentId) return null;

            const { data: student } = await supabase
                .from("students")
                .select(`
          *,
          transport_registrations (route_name, pickup_point, status),
          attendance:attendance (status)
        `)
                .eq("id", user.studentId)
                .single();

            const { data: intMarks } = await supabase.from("internal_marks").select("*").eq("student_id", user.studentId);
            const { data: assMarks } = await supabase.from("assignment_marks").select("*").eq("student_id", user.studentId);

            return {
                profile: student,
                transport: student?.transport_registrations?.[0],
                attendanceArr: student?.attendance || [],
                internalMarks: intMarks || [],
                assignmentMarks: assMarks || [],
            };
        },
        enabled: !!user?.studentId
    });

    if (isLoading || !studentInfo) {
        return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
    }

    const { profile, transport, attendanceArr, internalMarks, assignmentMarks } = studentInfo;

    // Attendance Calculations
    const presentDays = attendanceArr.filter((a: any) => a.status === 'present').length;
    const totalDays = attendanceArr.length;
    const attPercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return (
        <div className="space-y-6 mt-4">
            {/* Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card border p-6 shadow-card overflow-hidden relative">
                    <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Overall Attendance</p>
                    <div className="flex items-end justify-between mt-2">
                        <p className="text-3xl font-bold">{totalDays > 0 ? `${attPercent}%` : 'N/A'}</p>
                        <CalendarCheck className="h-6 w-6 text-blue-500 opacity-80" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{presentDays} present out of {totalDays} days</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl bg-card border p-6 shadow-card overflow-hidden relative">
                    <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Current Semester</p>
                    <div className="flex items-end justify-between mt-2">
                        <p className="text-2xl font-bold">{profile?.academic_year || 'N/A'}</p>
                        <BookOpen className="h-6 w-6 text-emerald-500 opacity-80" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{profile?.branch || 'General'}</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl bg-card border p-6 shadow-card overflow-hidden relative sm:col-span-2 lg:col-span-2">
                    <div className="absolute inset-0 bg-purple-500/5 pointer-events-none" />
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Transport ID (Bus Pass)</p>
                    {transport ? (
                        <div className="flex items-center gap-4 mt-2">
                            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <Bus className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="font-bold text-lg">{transport.route_name}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Pickup: {transport.pickup_point}</p>
                            </div>
                            <div className="ml-auto text-right">
                                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">Active Pass</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 mt-4 text-muted-foreground">
                            <Bus className="h-5 w-5" />
                            <p className="text-sm">No active bus registration found.</p>
                        </div>
                    )}
                </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Virtual ID Card */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="rounded-3xl bg-gradient-to-br from-red-600 to-red-800 text-white p-1 overflow-hidden shadow-xl">
                    <div className="rounded-[22px] bg-red-900/40 p-6 h-full flex flex-col justify-between relative backdrop-blur-md">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <Users className="h-32 w-32" />
                        </div>
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-lg font-bold tracking-widest text-white/90 uppercase">STUDENT ID</h3>
                                    <p className="text-xs text-white/70">KIET Campus Hub</p>
                                </div>
                                <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center font-bold text-xl border border-white/20">
                                    {profile?.name ? profile.name.slice(0, 2).toUpperCase() : 'ST'}
                                </div>
                            </div>
                            <div className="space-y-4 relative z-10">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-white/60">Full Name</p>
                                    <p className="text-xl font-semibold">{profile?.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-white/60">Roll Number</p>
                                        <p className="font-mono text-lg font-medium">{profile?.roll_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-white/60">Course</p>
                                        <p className="font-medium text-white/90">{profile?.branch}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Academic Marks Snapshot */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl bg-card border shadow-card flex flex-col">
                    <div className="p-5 border-b flex justify-between items-center bg-muted/30">
                        <h3 className="font-bold flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Academic Overview</h3>
                    </div>
                    <div className="p-0 overflow-auto max-h-[250px]">
                        {internalMarks.length > 0 ? (
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-card z-10">
                                    <tr className="border-b text-muted-foreground text-xs uppercase tracking-wider">
                                        <th className="text-left py-3 px-5 font-semibold">Subject</th>
                                        <th className="text-right py-3 px-5 font-semibold">Avg Mid Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {internalMarks.map((m: any) => (
                                        <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30">
                                            <td className="py-3 px-5 font-medium">{m.subject}</td>
                                            <td className="py-3 px-5 text-right font-bold text-primary">{m.average || 0} / 25</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">
                                <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No internal marks posted yet.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

        </div>
    );
};
