"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createPhaseAction, updatePhaseAction } from "@/actions/hierarchy" // Ensure path is correct
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField 
          control={form.control} 
          name="name" 
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold uppercase text-zinc-400">Phase Name</FormLabel>
              <Input {...field} className="bg-white border-zinc-200 text-black" />
            </FormItem>
          )} 
        />
        <Button 
          type="submit" 
          disabled={form.formState.isSubmitting}
          className="w-full bg-black text-white hover:bg-zinc-800 font-bold"
        >
          {form.formState.isSubmitting ? "Saving..." : (isEdit ? "Update Phase" : "Create Phase")}
        </Button>
      </form>
    </Form>
  )
}