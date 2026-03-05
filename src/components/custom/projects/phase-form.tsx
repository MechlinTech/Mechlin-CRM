"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod" // 1. Added resolver
import * as z from "zod" // 2. Added zod
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
    resolver: zodResolver(phaseSchema), // 4. Integrated the resolver
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 pt-0 mt-1 font-sans">
        <FormField 
          control={form.control} 
          name="name" 
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">
                Phase Name
              </FormLabel>
              <FormControl>
                {/* 5. The Input will automatically turn red because Shadcn's Input component 
                    reacts to the field state error when wrapped in FormField */}
                <Input 
                  {...field} 
                  className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 focus:border-[#006AFF] transition-all" 
                  placeholder="Enter phase name" 
                />
              </FormControl>
              {/* 6. Added FormMessage to show the "Phase name is required" text */}
              <FormMessage className="text-[10px] font-medium" />
            </FormItem>
          )} 
        />
        <Button 
          type="submit" 
          disabled={form.formState.isSubmitting}
          className="w-full"
        >
          {form.formState.isSubmitting ? "Saving..." : (isEdit ? "Update Phase" : "Create Phase")}
        </Button>
      </form>
    </Form>
  )
}