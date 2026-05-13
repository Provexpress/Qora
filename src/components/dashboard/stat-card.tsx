"use client";

import { motion } from "framer-motion";
import { CalendarCheck, FileText, ListTodo, TrendingUp, Users, WalletCards } from "lucide-react";
import { Card } from "@/components/ui/card";

const icons = {
  users: Users,
  trending: TrendingUp,
  file: FileText,
  calendar: CalendarCheck,
  wallet: WalletCards,
  todo: ListTodo
};

type StatIcon = keyof typeof icons;

export function StatCard({ title, value, helper, icon, index = 0 }: { title: string; value: string; helper: string; icon: StatIcon; index?: number }) {
  const Icon = icons[icon];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }} transition={{ delay: index * 0.05 }}>
      <Card className="group overflow-hidden p-5">
        <div className="mb-4 h-1 w-12 rounded-full bg-primary/70 transition group-hover:w-20" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
          </div>
          <div className="rounded-lg border border-primary/10 bg-primary/10 p-3 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
