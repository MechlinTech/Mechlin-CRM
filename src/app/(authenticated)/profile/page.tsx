"use client"
import * as React from "react"
import { User, Mail, Phone, Calendar, MapPin, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/useAuth"
import { useRBAC } from "@/context/rbac-context" // RBAC Integration

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  
  // RBAC Hook
  const { hasPermission, loading: rbacLoading } = useRBAC()

  // Combined loading state
  const isLoading = authLoading || rbacLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading profile...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">User not found</div>
      </div>
    )
  }

  // Extract user data from Supabase auth user
  const userData = {
    name: (user as any)?.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
    email: user.email || '',
    phone: (user as any)?.phone || '',
    role: (user as any)?.user_metadata?.role || 'User',
    department: (user as any)?.user_metadata?.department || 'Not specified',
    location: (user as any)?.user_metadata?.location || 'Not specified',
    joinDate: (user as any)?.created_at ? new Date((user as any).created_at).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : 'Unknown',
    avatar: (user as any)?.user_metadata?.avatar_url || ''
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profile</h1>
        
        {/* RBAC: Only show Edit button if user has users.update permission */}
        {hasPermission('users.update') && (
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Your basic profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {userData.avatar ? (
                <AvatarImage src={userData.avatar} />
              ) : null}
              <AvatarFallback className="text-lg">
                {userData.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{userData.name}</h3>
              <p className="text-sm text-gray-500">{userData.role}</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <Label className="text-xs text-gray-500">Email</Label>
                <p className="text-sm">{userData.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <Label className="text-xs text-gray-500">Location</Label>
                <p className="text-sm">{userData.location}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <Label className="text-xs text-gray-500">Joined</Label>
                <p className="text-sm">{userData.joinDate}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}