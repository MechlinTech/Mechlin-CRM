"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createMilestoneAction, updateMilestoneAction } from "@/actions/hierarchy"
import { toast } from "sonner"

export function MilestoneForm({ phaseId, projectId, milestone, onSuccess }: any) {
  const isEdit = !!milestone
  // UPDATED: Added loading state to prevent double creation
  const [loading, setLoading] = React.useState(false);

  const form = useForm({
    defaultValues: {
      name: milestone?.name || "",
      deliverables: milestone?.deliverables || "",
      demo_date: milestone?.demo_date || "",
      start_date: milestone?.start_date || "",
      end_date: milestone?.end_date || "",
      hours: milestone?.hours || 0,
      budget: milestone?.budget || 0,
      status: milestone?.status || "Backlog"
    }
  })

  async function onSubmit(values: any) {
    setLoading(true); // UPDATED: Disable button immediately
    let res;

    try {
      if (isEdit) {
        res = await updateMilestoneAction(
          milestone.id, 
          projectId, 
          values.name, 
          values.status, 
          values
        );
      } else {
        res = await createMilestoneAction(phaseId, projectId, values);
      }

      if (res.success) {
        toast.success(isEdit ? "Milestone Updated" : "Milestone Created");
        onSuccess?.();
      } else {
        toast.error(res.error || "Failed to save milestone");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false); // UPDATED: Re-enable if there was an error
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        {/* ... (Keep all existing FormFields same) ... */}
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-bold uppercase">Name</FormLabel>
            <Input {...field} required />
          </FormItem>
        )} />
        
        <FormField control={form.control} name="deliverables" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-bold uppercase">Deliverables</FormLabel>
            <Textarea {...field} />
          </FormItem>
        )} />

        <div className="grid grid-cols-3 gap-4">
          <FormField control={form.control} name="start_date" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold uppercase">Start</FormLabel>
              <Input type="date" {...field} />
            </FormItem>
          )} />
          <FormField control={form.control} name="end_date" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold uppercase">End</FormLabel>
              <Input type="date" {...field} />
            </FormItem>
          )} />
          <FormField control={form.control} name="demo_date" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold uppercase">Demo Date</FormLabel>
              <Input type="date" {...field} />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="hours" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold uppercase">Hours</FormLabel>
              <Input type="number" {...field} />
            </FormItem>
          )} />
          <FormField control={form.control} name="budget" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold uppercase">Budget</FormLabel>
              <Input type="number" {...field} />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-bold uppercase">Status</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {['Active', 'Closed', 'Backlog', 'Payment Pending', 'Payment Done'].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )} />

        {/* UPDATED: Button is disabled during loading */}
        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-black text-white font-bold hover:bg-gray-800"
        >
          {loading ? 'Processing...' : isEdit ? 'Update Milestone' : 'Save Milestone'}
        </Button>
      </form>
    </Form>
  )
}