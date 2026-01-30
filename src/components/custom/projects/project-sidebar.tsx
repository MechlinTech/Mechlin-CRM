"use client"
import { ChevronDown, Folder, Target, Zap } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function ProjectSidebar({ phases }: { phases: any[] }) {
  return (
    <div className="w-64 border-r bg-zinc-950/50 p-4 space-y-4">
      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Project Hierarchy</h3>
      <nav className="space-y-2">
        {phases.map((phase) => (
          <Collapsible key={phase.id} className="group">
            <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-zinc-900">
              <Folder size={16} className="text-blue-500" />
              <span>{phase.name}</span>
              <ChevronDown size={14} className="ml-auto transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-6 pt-1 space-y-1">
              {phase.milestones?.map((milestone: any) => (
                <Collapsible key={milestone.id} className="group/ms">
                  <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md p-2 text-xs hover:bg-zinc-900">
                    <Target size={14} className="text-orange-500" />
                    <span>{milestone.name}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-6 pt-1 space-y-1">
                    {milestone.sprints?.map((sprint: any) => (
                      <div key={sprint.id} className="flex items-center gap-2 p-2 text-[10px] text-zinc-400 hover:text-white cursor-pointer">
                        <Zap size={12} className="text-yellow-500" />
                        <span>{sprint.name}</span>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </nav>
    </div>
  );
}