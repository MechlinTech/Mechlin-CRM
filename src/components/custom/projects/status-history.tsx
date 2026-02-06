"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { History, ArrowRight, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export function StatusHistory({ logs }: { logs: any[] }) {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return (
    <Button variant="outline" size="sm" className="h-7 px-3 rounded-full text-[9px] font-bold uppercase gap-2">
      <History className="h-3 w-3" /> Status History
    </Button>
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 px-3 rounded-full border-zinc-200 text-[9px] font-bold uppercase gap-2 hover:bg-zinc-50">
          <History className="h-3 w-3" /> Status History
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] bg-white text-black overflow-y-auto border-l-0 shadow-2xl">
        <SheetHeader className="border-b pb-6">
          <SheetTitle className="text-2xl font-black tracking-tighter uppercase">Audit Trail</SheetTitle>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">History of all project transitions.</p>
        </SheetHeader>
        
        <div className="py-8 px-4 space-y-8">
          {logs && logs.length > 0 ? logs.map((log: any) => (
            <div key={log.id} className="relative pl-8 border-l-2 border-zinc-100 last:border-0 pb-6">
              <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-black border-4 border-white shadow-md z-10" />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900">
                    {log.action_type?.replace(/_/g, ' ') || 'ACTION'}
                  </p>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase" suppressHydrationWarning>
                    {formatDistanceToNow(new Date(log.created_at))} ago
                  </p>
                </div>
                
                <p className="text-xs text-zinc-600 font-medium leading-relaxed italic border-l-2 border-zinc-100 pl-3">
                    {log.new_value?.details || "Action recorded by system."}
                </p>

                <div className="flex items-center gap-1.5 mt-2 bg-zinc-50 w-fit px-2 py-1 rounded-md">
                    <User className="h-3 w-3 text-zinc-400" />
                    {/* Displays actual username from joined table */}
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">
                        By: {log.users?.name || 'Administrator'}
                    </span>
                </div>

                {log.old_value?.status && (
                  <div className="flex items-center gap-3 py-1 mt-2">
                    <span className="text-[9px] font-black px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded uppercase">
                      {log.old_value.status}
                    </span>
                    <ArrowRight className="h-3 w-3 text-zinc-300" />
                    <span className="text-[9px] font-black px-2 py-0.5 bg-black text-white rounded uppercase">
                      {log.new_value.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="text-center py-20 bg-zinc-50 rounded-3xl">
              <History className="h-12 w-12 text-zinc-200 mx-auto mb-4" />
              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">No activity recorded yet</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}