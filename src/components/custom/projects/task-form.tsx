"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createTaskAction, updateTaskAction } from "@/actions/hierarchy"
import { toast } from "sonner"
import { ActionModalContext } from "@/components/shared/action-button"
import { WysiwygEditor } from "@/components/shared/wysiwyg-editorPM"

export function TaskForm({ ids, task, onSuccess }: { ids: any, task?: any, onSuccess?: () => void }) {
  const { close } = React.useContext(ActionModalContext);
  const [description, setDescription] = React.useState(task?.description || "");
  const [loading, setLoading] = React.useState(false);
  
  const form = useForm({ 
    defaultValues: { 
      title: task?.title || "", 
      status: task?.status || "Pending" 
    } 
  });

  async function onSubmit(values: any) {
    setLoading(true);
    const res = task 
      ? await updateTaskAction(task.id, ids.project_id, { ...values, description }) 
      : await createTaskAction({ ...values, description, ...ids });
      
    if (res.success) { 
      toast.success("Saved"); 
      onSuccess?.(); 
      close(); 
    } else {
      toast.error(res.error || "Failed to save task");
    }
    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2 text-[#0F172A] font-sans">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Task Title</FormLabel>
            <FormControl>
              <Input {...field} className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 focus:border-[#006AFF] transition-all" placeholder="Enter task title" />
            </FormControl>
          </FormItem>
        )} />
        
        <div className="space-y-2">
            <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Task Description</FormLabel>
            <WysiwygEditor content={description} onChange={setDescription} />
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
                <SelectItem value="Pending" className="cursor-pointer">Pending</SelectItem>
                <SelectItem value="In Progress" className="cursor-pointer">In Progress</SelectItem>
                <SelectItem value="Completed" className="cursor-pointer">Completed</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )} />
        
        <Button 
          type="submit" 
          disabled={loading}
          className="ml-70 w-60 bg-[#006AFF] text-white font-semibold h-12 rounded-xl shadow-lg hover:bg-[#99C4FF] transition-all active:scale-95 cursor-pointer mt-2"
        >
          {loading ? 'Saving...' : 'Save Task'}
        </Button>
      </form>
    </Form>
  )
}