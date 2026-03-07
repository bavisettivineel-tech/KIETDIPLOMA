import { motion } from "framer-motion";
import { Database, FileText, Users, Calendar, CreditCard, Bus, Bell, BarChart3, LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
}

const defaults: Record<string, { icon: LucideIcon }> = {
    students: { icon: Users },
    attendance: { icon: Calendar },
    marks: { icon: FileText },
    fees: { icon: CreditCard },
    transport: { icon: Bus },
    notices: { icon: Bell },
    dashboard: { icon: BarChart3 },
    reports: { icon: BarChart3 },
};

export function EmptyState({ icon: Icon = Database, title, description }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 px-6"
        >
            <div className="h-16 w-16 rounded-2xl bg-secondary/60 flex items-center justify-center mb-5">
                <Icon className="h-7 w-7 text-muted-foreground/60" />
            </div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {description && (
                <p className="text-sm text-muted-foreground mt-1.5 max-w-sm text-center leading-relaxed">
                    {description}
                </p>
            )}
        </motion.div>
    );
}

export function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground mt-4">Loading data…</p>
        </div>
    );
}
