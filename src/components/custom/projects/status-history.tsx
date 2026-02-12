"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { History, ArrowRight, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

export function StatusHistory({ logs }: { logs: any[] }) {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return (
    <Button variant="outline" size="sm" className="h-7 px-3 rounded-full text-[9px] font-semibold uppercase gap-2 cursor-pointer">
      <History className="h-3 w-3" /> Status History
    </Button>
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        {/* Updated with Brand Blue hover and SemiBold weight */}
        <Button variant="outline" size="sm" className="h-7 px-3 rounded-full border-zinc-200 text-[9px] font-semibold uppercase gap-2 hover:bg-[#99C4FF] hover:text-white hover:border-[#99C4FF] transition-all cursor-pointer">
          <History className="h-3 w-3" /> Status History
        </Button>
      </SheetTrigger>
      {/* Width maintained at original spec */}
      <SheetContent className="w-full sm:w-[540px] bg-white text-[#0F172A] overflow-y-auto border-l-0 shadow-2xl">
        <SheetHeader className="border-b pb-6">
          <SheetTitle className="text-2xl font-semibold tracking-tight uppercase">Audit Trail</SheetTitle>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">History of all project transitions.</p>
        </SheetHeader>
        
        <div className="py-8 px-4 space-y-8">
          {logs && logs.length > 0 ? logs.map((log: any) => (
            <div key={log.id} className="relative pl-8 border-l-2 border-slate-100 last:border-0 pb-6">
              {/* Timeline marker updated to Brand Blue */}
              <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-[#006AFF] border-4 border-white shadow-md z-10" />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  {/* Action Type: SemiBold for visibility */}
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1F2937]">
                    {log.action_type?.replace(/_/g, ' ') || 'ACTION'}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium uppercase" suppressHydrationWarning>
                    {formatDistanceToNow(new Date(log.created_at))} ago
                  </p>
                </div>
                
                {/* Meta details: Regular weight */}
                <p className="text-xs text-slate-600 font-normal leading-relaxed italic border-l-2 border-slate-100 pl-3">
                    {log.new_value?.details || "Action recorded by system."}
                </p>

                <div className="flex items-center gap-1.5 mt-2 bg-slate-50 w-fit px-2 py-1 rounded-md">
                    <User className="h-3 w-3 text-slate-400" />
                    <span className="text-[9px] font-semibold text-slate-600 uppercase tracking-tighter">
                        By: {log.users?.name || 'Administrator'}
                    </span>
                </div>

                {log.old_value?.status && (
                  <div className="flex items-center gap-3 py-1 mt-2">
                    <span className="text-[9px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">
                      {log.old_value.status}
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-300" />
                    {/* Active status now uses Brand Blue */}
                    <span className="text-[9px] font-semibold px-2 py-0.5 bg-[#006AFF] text-white rounded uppercase">
                      {log.new_value.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="text-center py-20 bg-slate-50 rounded-3xl">
              <History className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest">No activity recorded yet</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}