import { DashboardLayout } from "@/components/DashboardLayout";
import { Bell, Pin, Plus, Calendar, User, Megaphone } from "lucide-react";
import { motion } from "framer-motion";
import { useNotices } from "@/hooks/useSupabaseData";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const Notices = () => {
  const { data: notices = [], isLoading } = useNotices();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [posting, setPosting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", is_pinned: false });
  const [showForm, setShowForm] = useState(false);

  const canPost = user?.role === "admin" || user?.role === "management" || user?.role === "faculty";

  const pinned = notices.filter((n: any) => n.is_pinned);
  const recent = notices.filter((n: any) => !n.is_pinned);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) return;
    setPosting(true);
    const { error } = await supabase.from("notices").insert({
      title: form.title,
      description: form.description,
      is_pinned: form.is_pinned,
      posted_by_name: user?.name,
    });
    setPosting(false);
    if (error) { toast.error("Failed to post notice."); return; }
    toast.success("Notice posted!");
    setForm({ title: "", description: "", is_pinned: false });
    setShowForm(false);
    qc.invalidateQueries({ queryKey: ["notices"] });
  };

  const NoticeCard = ({ n, pinned }: { n: any; pinned: boolean }) => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl bg-card border p-6 shadow-card card-hover relative overflow-hidden ${pinned ? "border-primary/10" : ""}`}>
      {pinned && <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-red-300 rounded-r-full" />}
      <div className={`flex items-start gap-4 ${pinned ? "pl-3" : ""}`}>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${pinned ? "bg-primary/10" : "bg-secondary"}`}>
          {pinned ? <Megaphone className="h-5 w-5 text-primary" /> : <Bell className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold">{n.title}</h3>
            {pinned && <Pin className="h-3 w-3 text-primary" />}
          </div>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{n.description}</p>
          <div className="flex items-center gap-4 mt-3">
            {n.posted_by_name && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <User className="h-3 w-3" /><span>{n.posted_by_name}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[900px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notice Board</h1>
            <p className="text-sm text-muted-foreground mt-1">College announcements and updates</p>
          </div>
          {canPost && (
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-sm shadow-red-500/20">
              <Plus className="h-4 w-4" /> Post Notice
            </button>
          )}
        </div>

        {/* Post Form */}
        {showForm && canPost && (
          <motion.form initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            onSubmit={handlePost} className="rounded-2xl bg-card border p-6 shadow-card space-y-4">
            <h3 className="text-sm font-semibold">New Notice</h3>
            <input type="text" placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full rounded-xl border bg-secondary/30 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} className="w-full rounded-xl border bg-secondary/30 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" required />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))}
                  className="rounded" />
                Pin this notice
              </label>
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors">Cancel</button>
                <button type="submit" disabled={posting}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60">
                  {posting ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          </motion.form>
        )}

        {isLoading ? <LoadingState /> : notices.length === 0 ? (
          <EmptyState icon={Bell} title="No notices posted yet"
            description="Notices will appear here once admin, management, or faculty post announcements." />
        ) : (
          <>
            {pinned.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  <Pin className="h-3.5 w-3.5 text-primary" /> Pinned Notices
                </div>
                {pinned.map((n: any) => <NoticeCard key={n.id} n={n} pinned={true} />)}
              </div>
            )}
            {recent.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  <Bell className="h-3.5 w-3.5" /> Recent Notices
                </div>
                {recent.map((n: any) => <NoticeCard key={n.id} n={n} pinned={false} />)}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Notices;
