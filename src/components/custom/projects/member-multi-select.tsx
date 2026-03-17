// Mechlin-CRM\src\components\custom\projects\member-multi-select.tsx
"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface Member {
  users: { id: string; name: string; email: string }
}

export function MemberMultiSelect({ 
  members, 
  selected, 
  onChange, 
  label 
}: { 
  members: Member[], 
  selected: string[], 
  onChange: (ids: string[]) => void,
  label: string 
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">
        {label}
      </label>
      <div className="border border-slate-200 rounded-xl p-3 h-[150px] overflow-y-auto bg-slate-50/30 transition-all focus-within:bg-white focus-within:border-[#006AFF]/30 scrollbar-hide">
        {members.length > 0 ? members.map((m) => (
          <div key={m.users.id} className="flex flex-row items-center space-x-2 py-1.5 space-y-0 group">
            <Checkbox 
              id={m.users.id}
              className="h-4 w-4 border-slate-300 data-[state=checked]:bg-[#006AFF] data-[state=checked]:border-[#006AFF] cursor-pointer" 
              checked={selected.includes(m.users.id)} 
              onCheckedChange={(checked) => {
                return checked 
                  ? onChange([...selected, m.users.id]) 
                  : onChange(selected.filter((id) => id !== m.users.id))
              }} 
            />
            <label 
              htmlFor={m.users.id}
              className="text-xs font-medium text-slate-700 cursor-pointer group-hover:text-[#006AFF] transition-colors"
            >
              {m.users.name}
            </label>
          </div>
        )) : (
          <p className="text-[10px] text-slate-400 font-medium italic text-center py-4">
            No users available
          </p>
        )}
      </div>
    </div>
  )
}