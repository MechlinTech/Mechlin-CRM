"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createMilestoneAction, updateMilestoneAction } from "@/actions/hierarchy"
import { toast } from "sonner"

export function MilestoneForm({ phaseId, projectId, milestone, onSuccess }: any) {
  const isEdit = !!milestone
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
    setLoading(true);
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
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2 font-sans">
        
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Name</FormLabel>
            <FormControl>
              <Input {...field} required className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10" />
            </FormControl>
          </FormItem>
        )} />
        
        <FormField control={form.control} name="deliverables" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Deliverables</FormLabel>
            <FormControl>
              <Textarea {...field} className="bg-white border-slate-200 rounded-xl text-xs font-medium min-h-[80px] resize-none" />
            </FormControl>
          </FormItem>
        )} />

        {/* Responsive Grid: Stacks on mobile, 3 columns on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={form.control} name="start_date" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Start</FormLabel>
              <FormControl>
                <Input type="date" {...field} className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 cursor-pointer" />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="end_date" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">End</FormLabel>
              <FormControl>
                <Input type="date" {...field} className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 cursor-pointer" />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="demo_date" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Demo Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 cursor-pointer" />
              </FormControl>
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="hours" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Hours</FormLabel>
              <FormControl>
                <Input type="number" {...field} className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10" />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="budget" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Budget</FormLabel>
              <FormControl>
                <Input type="number" {...field} className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10" />
              </FormControl>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Status</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 cursor-pointer">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl">
                {['Active', 'Closed', 'Backlog', 'Payment Pending', 'Payment Done'].map(s => (
                  <SelectItem key={s} value={s} className="text-xs font-medium cursor-pointer">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )} />

        <Button 
          type="submit" 
          disabled={loading} 
          className="ml-33 w-50 bg-[#006AFF] text-white font-semibold h-12 rounded-xl shadow-lg hover:bg-[#99C4FF] transition-all active:scale-95 cursor-pointer mt-2"
        >
          {loading ? 'Processing...' : isEdit ? 'Update Milestone' : 'Save Milestone'}
        </Button>
      </form>
    </Form>
  )
}