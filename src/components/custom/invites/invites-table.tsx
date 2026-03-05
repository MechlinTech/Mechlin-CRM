"use client"

import { useEffect, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { useRBAC } from "@/context/rbac-context" // RBAC Integration
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"

interface Invite {
    id: string
    email: string
    status: string
    invited_at: string
    expires_at: string
    organisation: {
        name: string
    }
    inviter: {
        name: string
        email: string
    }
    invited_by: string
}

export function InvitesTable() {
    const [invites, setInvites] = useState<Invite[]>([])
    const [loading, setLoading] = useState(true)
    
    // RBAC Hook
    const { hasPermission, loading: rbacLoading } = useRBAC()

    useEffect(() => {
        // Only fetch if RBAC is loaded and user has permission to read user-related data
        if (!rbacLoading && hasPermission('users.read')) {
            fetchInvites()
        } else if (!rbacLoading) {
            setLoading(false)
        }
    }, [rbacLoading, hasPermission])

    async function fetchInvites() {
        try {
            const response = await fetch('/api/users/invite')
            const data = await response.json()

            if (data.success) {
                // Server now filters invites by current user's organization
                setInvites(data.invites)
            } else {
                toast.error('Failed to load invitations')
            }
        } catch (error) {
            console.error('Error fetching invites:', error)
            toast.error('Failed to load invitations')
        } finally {
            setLoading(false)
        }
    }

    async function deleteInvite(inviteId: string, email: string) {
        try {
            const response = await fetch(`/api/users/invite?id=${inviteId}`, {
                method: 'DELETE',
            })

            const data = await response.json()

            if (data.success) {
                toast.success(`Invitation for ${email} deleted successfully`)
                fetchInvites() // Refresh the list
            } else {
                toast.error(data.error || 'Failed to delete invitation')
            }
        } catch (error) {
            console.error('Error deleting invite:', error)
            toast.error('Failed to delete invitation')
        }
    }

    function getStatusBadge(status: string) {
        const statusConfig = {
            pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
            accepted: { label: 'Accepted', className: 'bg-green-100 text-green-800 border-green-200' },
            expired: { label: 'Expired', className: 'bg-gray-100 text-gray-800 border-gray-200' },
        }

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

        return (
            <Badge variant="outline" className={config.className}>
                {config.label}
            </Badge>
        )
    }

    // Combined loading state
    if (loading || rbacLoading) {
        return (
            <div className="p-8 text-center">
                <p className="text-sm text-gray-500">Loading invitations...</p>
            </div>
        )
    }

    // RBAC Check for Table Visibility
    if (!hasPermission('users.read')) {
        return (
            <div className="p-8 text-center">
                <p className="text-sm text-red-500 font-medium">Access Restricted: You do not have permission to view invitations.</p>
            </div>
        )
    }

    if (invites.length === 0) {
        return (
            <div className="p-8 text-center">
                <p className="text-sm text-gray-500">No invitations found</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-md border border-gray-200/50 shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="bg-gray-100">Email</TableHead>
                        <TableHead className="bg-gray-100">Organisation</TableHead>
                        <TableHead className="bg-gray-100">Status</TableHead>
                        <TableHead className="bg-gray-100">Invited By</TableHead>
                        <TableHead className="bg-gray-100">Sent</TableHead>
                        {hasPermission('users.delete') && <TableHead className="bg-gray-100">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invites.map((invite) => (
                        <TableRow key={invite.id}>
                            <TableCell className="font-medium">{invite.email}</TableCell>
                            <TableCell>{invite.organisation?.name || 'N/A'}</TableCell>
                            <TableCell>{getStatusBadge(invite.status)}</TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-sm">{invite.inviter?.name || 'Administrator'}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                                {formatDistanceToNow(new Date(invite.invited_at), { addSuffix: true })}
                            </TableCell>
                            {hasPermission('users.delete') && (
                                <TableCell>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                disabled={invite.status !== 'pending'}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete the invitation for {invite.email}? 
                                                    This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => deleteInvite(invite.id, invite.email)}
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}