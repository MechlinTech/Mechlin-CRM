"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createPhaseAction, updatePhaseAction } from "@/actions/hierarchy"
import { toast } from "sonner"

interface PhaseFormProps {
  projectId: string;
  phase?: any;
  onSuccess?: () => void;
}

export function PhaseForm({ projectId, phase, onSuccess }: PhaseFormProps) {
  const isEdit = !!phase
  const form = useForm({
    defaultValues: {
      name: phase?.name || ""
    }
  })

  async function onSubmit(values: any) {
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
      {/* Decreased space-y-6 to space-y-4 to pull the button closer to the input */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 pt-0 mt-1 font-sans">
        <FormField 
          control={form.control} 
          name="name" 
          render={({ field }) => (
            <FormItem>
              {/* Typography: Medium weight for label */}
              <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">
                Phase Name
              </FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 focus:border-[#006AFF] transition-all" 
                  placeholder="Enter phase name" 
                />
              </FormControl>
            </FormItem>
          )} 
        />
        {/* Button: SemiBold weight per brand guide */}
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