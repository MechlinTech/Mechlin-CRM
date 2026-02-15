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
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

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
}

export function InvitesTable() {
    const [invites, setInvites] = useState<Invite[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchInvites()
    }, [])

    async function fetchInvites() {
        try {
            const response = await fetch('/api/users/invite')
            const data = await response.json()

            if (data.success) {
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

    if (loading) {
        return (
            <div className="p-8 text-center">
                <p className="text-sm text-gray-500">Loading invitations...</p>
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
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited By</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Expires</TableHead>
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
                                <span className="text-sm">{invite.inviter?.name || 'N/A'}</span>
                                <span className="text-xs text-gray-500">{invite.inviter?.email}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(invite.invited_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(invite.expires_at), { addSuffix: true })}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
