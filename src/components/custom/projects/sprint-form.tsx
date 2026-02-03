"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createSprintAction } from "@/actions/hierarchy"
import { toast } from "sonner"

export function SprintForm({ milestoneId, projectId, onSuccess }: any) {
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      start_date: "",
      end_date: "",
      status: "Active"
    }
  })

  async function onSubmit(values: any) {
    const res = await createSprintAction(milestoneId, projectId, values);
    if (res.success) {
      toast.success("Sprint Created Successfully");
      // This call to onSuccess() is what closes the Dialog in the parent 
      if (onSuccess) onSuccess(); 
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 text-black">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel className="text-[10px] font-bold uppercase text-zinc-400">Sprint Name</FormLabel><Input {...field} className="bg-white border-zinc-200" /></FormItem>
        )} />
        
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel className="text-[10px] font-bold uppercase text-zinc-400">Description</FormLabel><Textarea {...field} className="bg-white border-zinc-200" /></FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="start_date" render={({ field }) => (
            <FormItem><FormLabel className="text-[10px] font-bold uppercase text-zinc-400">Start Date</FormLabel><Input type="date" {...field} className="bg-white border-zinc-200" /></FormItem>
          )} />
          <FormField control={form.control} name="end_date" render={({ field }) => (
            <FormItem><FormLabel className="text-[10px] font-bold uppercase text-zinc-400">End Date</FormLabel><Input type="date" {...field} className="bg-white border-zinc-200" /></FormItem>
          )} />
        </div>
        
        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-bold uppercase text-zinc-400">Status</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger className="bg-white border-zinc-200"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )} />
        <Button type="submit" className="w-full bg-black text-white font-bold hover:bg-zinc-800">Create Sprint</Button>
      </form>
    </Form>
  )
}