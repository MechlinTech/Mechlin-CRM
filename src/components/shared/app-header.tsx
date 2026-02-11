"use client"
import * as React from "react"
import Image from "next/image"
import { Search, User, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export function AppHeader() {
  const { user } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [mounted, setMounted] = React.useState(false)
  
  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  const getUserInitials = () => {
    if (!user?.email) return "U"
    const name = (user as any)?.user_metadata?.full_name || user.email.split('@')[0]
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) {
      console.log("Error signing out:", error)
      toast.error(`Error signing out: ${error.message}`)
    } else {
      toast.success("Successfully signed out")
      router.push('/')
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shadow-sm">
      {/* Logo/Brand */}
      <div className="flex items-center">
        <Image src="/logo.png" alt="Mechlin CRM" width={132} height={32} />
      </div>

      
      <div className="flex items-center gap-2 sm:gap-4">
       
        <form onSubmit={handleSearch} className="hidden sm:block relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 w-32 sm:w-48 h-8 bg-gray-50 border-gray-200 focus:border-gray-300"
          />
        </form>

       
        {mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-1 sm:px-2 py-1 transition-colors">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                  <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm text-gray-600">
                  {(user as any)?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 sm:w-56">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center text-red-600" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          
          <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 py-1">
            <div className="h-7 w-7 sm:h-8 sm:w-8 bg-gray-200 rounded-full"></div>
            <div className="hidden sm:block h-4 w-16 bg-gray-200 rounded"></div>
          </div>
        )}
      </div>
    </header>
  )
}
