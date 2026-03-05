"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminWithInternalFalse } from "@/hooks/useAdminWithInternalFalse"
import { useOrganisationData } from "@/hooks/useOrganisationData"

const inviteSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  organisationId: z
    .string()
    .min(1, "Organisation is required"),
})

type InviteFormValues = z.infer<typeof inviteSchema>

interface InviteUserFormProps {
  onSuccess?: () => void
}

export function InviteUserForm({ onSuccess }: InviteUserFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { isAdminWithInternalFalse, organisationId: userOrgId } = useAdminWithInternalFalse()

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      organisationId: "",
    },
  })

  const { organisations, loadingOrgs, organisationName } = useOrganisationData({
    form,
    organisationField: "organisationId"
  })

  async function onSubmit(data: InviteFormValues) {
    setLoading(true)
    try {
      const payload = isAdminWithInternalFalse && userOrgId
        ? { email: data.email, organisationId: userOrgId }
        : data
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to send invitation')
        return
      }

      toast.success('Invitation sent successfully!')
      form.reset()
      router.refresh()

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full flex flex-col">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isAdminWithInternalFalse ? (
          <FormField
            control={form.control}
            name="organisationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organisation</FormLabel>
                <FormControl>
                  <Input
                    value={organisationName || "Loading..."}
                    disabled
                    className="bg-muted"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="organisationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organisation</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={loading || loadingOrgs}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an organisation" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {organisations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={loading || loadingOrgs || (isAdminWithInternalFalse && !userOrgId)} className="ml-auto">
          {loading ? "Sending..." : "Send Invitation"}
        </Button>
      </form>
    </Form>
  )
}
