import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldAlert, ArrowLeft } from "lucide-react"

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-zinc-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="p-4 bg-red-100 rounded-full">
                        <ShieldAlert className="h-12 w-12 text-red-600" />
                    </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-[#0F172A]">
                        Access Denied
                    </h1>
                    <p className="text-gray-600">
                        You don't have permission to access this page or perform this action.
                    </p>
                </div>

                {/* Description */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-gray-700">
                    <p className="font-semibold text-red-800 mb-2">Why am I seeing this?</p>
                    <ul className="text-left space-y-1 list-disc list-inside">
                        <li>Your account may not have the required role or permissions</li>
                        <li>The resource you're trying to access may be restricted</li>
                        <li>Contact your administrator if you believe this is a mistake</li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-center">
                    <Button
                        variant="outline"
                        onClick={() => window.history.back()}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Go Back
                    </Button>
                    <Link href="/dashboard">
                        <Button className="bg-[#0F172A] hover:bg-[#0F172A]/90">
                            Go to Dashboard
                        </Button>
                    </Link>
                </div>

                {/* Help */}
                <div className="pt-6 border-t">
                    <p className="text-sm text-gray-500">
                        Need help? Contact your system administrator or{" "}
                        <a href="mailto:support@mechlin.com" className="text-blue-600 hover:underline">
                            support@mechlin.com
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}
