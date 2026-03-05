"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ActionButtonProps {
  title: string
  trigger: React.ReactNode
  children: React.ReactNode // Switch back to children for standard React nesting
}

// Create a Context to allow deep children to close the dialog
export const ActionModalContext = React.createContext<{ close: () => void }>({ close: () => {} });

export function ActionButton({ title, trigger, children }: ActionButtonProps) {
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const close = () => setOpen(false);

  // Prevent hydration mismatch by waiting for client-side mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{trigger}</>
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="bg-white text-black max-w-xl border-none shadow-2xl overflow-y-auto custom-scrollbar max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-black text-xl tracking-tighter uppercase">{title}</DialogTitle>
        </DialogHeader>
        <ActionModalContext.Provider value={{ close }}>
          {children}
        </ActionModalContext.Provider>
      </DialogContent>
    </Dialog>
  )
}