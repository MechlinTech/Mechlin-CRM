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
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createUserAction, updateUserAction, type User } from "@/actions/user-management"
import { useAdminWithInternalFalse } from "@/hooks/useAdminWithInternalFalse"
import { useOrganisationData } from "@/hooks/useOrganisationData"

// Zod schema matching the database schema
const userSchema = z.object({
  organisation_id: z
    .string()
    .min(1, "Organisation is required"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .max(255, "Email must be less than 255 characters")
    .email("Invalid email address"),
  status: z.enum(["active", "suspended"]),
})

type UserFormValues = z.infer<typeof userSchema>

interface CreateUserFormProps {
  onSuccess?: () => void
  user?: User | null
}

export function CreateUserForm({ onSuccess, user }: CreateUserFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { isAdminWithInternalFalse, organisationId: userOrgId, loading: adminCheckLoading } = useAdminWithInternalFalse()
  const isEditMode = !!user

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      organisation_id: "",
      name: "",
      email: "",
      status: "active",
    },
  })

  const { organisations, loadingOrgs, organisationName } = useOrganisationData({
    form,
    organisationField: "organisation_id"
  })

  // Pre-fill form when user is provided (edit mode)
  useEffect(() => {
    if (user && !loadingOrgs) {
      form.reset({
        organisation_id: isAdminWithInternalFalse && userOrgId ? userOrgId : user.organisation_id,
        name: user.name,
        email: user.email,
        status: user.status,
      })
    } else if (!user && !loadingOrgs) {
      // Reset to default values when not in edit mode
      form.reset({
        organisation_id: isAdminWithInternalFalse && userOrgId ? userOrgId : "",
        name: "",
        email: "",
        status: "active",
      })
    }
  }, [user, form, loadingOrgs, isAdminWithInternalFalse, userOrgId])

  async function onSubmit(data: UserFormValues) {
    setLoading(true)
    try {
      const orgId = isAdminWithInternalFalse && userOrgId ? userOrgId : data.organisation_id
      let result
      if (isEditMode && user) {
        // Update existing user
        result = await updateUserAction(user.id, {
          organisation_id: orgId,
          name: data.name,
          email: data.email,
          status: data.status,
        })
        if (!result.success) {
          if (result.code === "23505") {
            toast.error("Email already exists")
            form.setError("email", { message: "Email already exists" })
          } else {
            toast.error(result.error)
          }
          return
        }
        toast.success("User updated successfully!")
      } else {
        // Create new user
        result = await createUserAction({
          organisation_id: orgId,
          name: data.name,
          email: data.email,
          status: data.status,
        })
        if (!result.success) {
          if (result.code === "23505") {
            toast.error("Email already exists")
            form.setError("email", { message: "Email already exists" })
          } else {
            toast.error(result.error)
          }
          return
        }
        toast.success("User created successfully!")
        form.reset()
      }
      
      // Refresh the page to show the updated/new user
      router.refresh()
      
      // Close the dialog after successful operation
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("An unexpected error occurred")
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full flex flex-col">
        {!isAdminWithInternalFalse && (
          
          <FormField
              control={form.control}
              name="organisation_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organisation</FormLabel>

                  {isAdminWithInternalFalse ? (
                    //  Locked org display
                    <FormControl>
                      <Input
                        value={organisationName || "Loading..."}
                        disabled
                        className="bg-gray-100"
                      />
                    </FormControl>
                  ) : (
                    //  Normal dropdown
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
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />

        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter user name"
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormDescription>
                A unique email address for the user
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading || loadingOrgs || (isAdminWithInternalFalse && !userOrgId)} className="ml-auto">
          {loading 
            ? (isEditMode ? "Updating..." : "Creating...") 
            : (isEditMode ? "Update User" : "Create User")}
        </Button>
      </form>
    </Form>
  )
}
