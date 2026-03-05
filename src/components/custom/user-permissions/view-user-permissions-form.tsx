"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ViewUserPermissionsFormProps {
    user: any
}

export function ViewUserPermissionsForm({ user }: ViewUserPermissionsFormProps) {
    const directPermissions = user.user_permissions || []

    return (
        <div className="space-y-6">
            {/* User Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#006AFF] rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                            {user.name?.charAt(0)?.toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-[#0F172A]">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                </div>
            </div>

            {/* Direct Permissions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Direct Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                    {directPermissions.length > 0 ? (
                        <div className="space-y-3">
                            {directPermissions.map((up: any) => (
                                <div key={up.permission_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-sm">{up.permissions?.display_name}</p>
                                        <p className="text-xs text-gray-600">{up.permissions?.module}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-xs bg-[#006AFF]/10 text-[#006AFF] border-[#006AFF]/20">
                                        {up.permissions?.action}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No direct permissions assigned</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
