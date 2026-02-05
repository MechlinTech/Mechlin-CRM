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
  content: React.ReactElement
}

export function ActionButton({ title, trigger, content }: ActionButtonProps) {
  const [open, setOpen] = React.useState(false)

  // Defensive check: ensure content exists before cloning
  if (!content) return null;

  // Inject onSuccess logic into the child form on the client side
  const formWithProps = React.cloneElement(content as React.ReactElement<any>, {
    onSuccess: () => setOpen(false)
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="bg-white text-black max-w-xl border-none shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-black text-xl tracking-tighter uppercase">{title}</DialogTitle>
        </DialogHeader>
        {formWithProps}
      </DialogContent>
    </Dialog>
  )
}