"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createPhaseAction, updatePhaseAction } from "@/actions/hierarchy"
import { toast } from "sonner"

// 3. Defined the validation schema
const phaseSchema = z.object({
  name: z.string().trim().min(1, { message: "Phase name is required" }),
})

type PhaseFormValues = z.infer<typeof phaseSchema>

interface PhaseFormProps {
  projectId: string;
  phase?: any;
  onSuccess?: () => void;
}

export function PhaseForm({ projectId, phase, onSuccess }: PhaseFormProps) {
  const isEdit = !!phase
  
  const form = useForm<PhaseFormValues>({
    resolver: zodResolver(phaseSchema),
    defaultValues: {
      name: phase?.name || ""
    }
  })

  async function onSubmit(values: PhaseFormValues) {
    try {
      const res = isEdit 
        ? await updatePhaseAction(phase.id, projectId, values.name)
        : await createPhaseAction(projectId, values.name);

      if (res.success) {
        toast.success(`Phase ${isEdit ? 'Updated' : 'Created'}`);
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || "Something went wrong");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  }

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        className="flex flex-col max-h-[80vh] font-sans text-[#0F172A]"
      >
        {/* SCROLLABLE AREA: Constrains the input fields */}
        <div className="flex-1 overflow-y-auto px-1 pr-2 pt-2 custom-scrollbar space-y-4">
          <FormField 
            control={form.control} 
            name="name" 
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">
                  Phase Name <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 focus:border-[#006AFF] transition-all w-full" 
                    placeholder="Enter phase name" 
                  />
                </FormControl>
                <FormMessage className="text-[10px] font-medium" />
              </FormItem>
            )} 
          />
        </div>

        {/* BUTTON AREA: Fixed at the bottom */}
        <div className="pt-4 mt-auto">
          <Button 
            type="submit" 
            disabled={form.formState.isSubmitting}
            className="w-full bg-[#006AFF] text-white font-semibold h-11 rounded-xl shadow-md hover:bg-[#1a7bff] transition-all active:scale-95"
          >
            {form.formState.isSubmitting ? "Saving..." : (isEdit ? "Update Phase" : "Create Phase")}
          </Button>
        </div>
      </form>
    </Form>
  )
}