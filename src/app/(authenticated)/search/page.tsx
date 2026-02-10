"use client"
import * as React from "react"
import { Search, ArrowLeft, Building2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { getAllUsersAction, getAllOrganisationsAction } from "@/actions/user-management"
import type { User, Organisation } from "@/actions/user-management"

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const [searchQuery, setSearchQuery] = React.useState(query)
  const [isSearching, setIsSearching] = React.useState(false)
  const [users, setUsers] = React.useState<User[]>([])
  const [organisations, setOrganisations] = React.useState<Organisation[]>([])
  const [error, setError] = React.useState<string | null>(null)

  // Load data on component mount and when query changes
  React.useEffect(() => {
    if (query) {
      performSearch(query)
    }
  }, [query])

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true)
    setError(null)
    
    try {
      // Fetch users and organisations from database
      const [usersResult, organisationsResult] = await Promise.all([
        getAllUsersAction(),
        getAllOrganisationsAction()
      ])

      if (usersResult.success && usersResult.users) {
        setUsers(usersResult.users)
      } else {
        setError(usersResult.error || "Failed to fetch users")
      }

      if (organisationsResult.success && organisationsResult.organisations) {
        setOrganisations(organisationsResult.organisations)
      } else {
        setError(organisationsResult.error || "Failed to fetch organisations")
      }
    } catch (err) {
      setError("An error occurred while searching")
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Update URL with new search query
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Filter results based on search query
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(query.toLowerCase()) ||
    user.email.toLowerCase().includes(query.toLowerCase()) ||
    user.organisations?.name.toLowerCase().includes(query.toLowerCase())
  )

  const filteredOrganisations = organisations.filter(org =>
    org.name.toLowerCase().includes(query.toLowerCase()) ||
    org.slug.toLowerCase().includes(query.toLowerCase())
  )

  // Combine all results
  const allResults = [
    ...filteredUsers.map(user => ({
      id: user.id,
      type: "user" as const,
      name: user.name,
      description: `${user.email}${user.organisations?.name ? ` • ${user.organisations.name}` : ''}`
    })),
    ...filteredOrganisations.map(org => ({
      id: org.id,
      type: "organisation" as const,
      name: org.name,
      description: `${org.slug} • ${org.status}`
    }))
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Search Results</h1>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search users, organisations..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 h-10"
          />
        </div>
      </form>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center h-32">
            <p className="text-red-600 text-center">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => performSearch(query)}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {!error && query && (
        <div className="text-sm text-gray-600">
          Found {allResults.length} results for "{query}"
          {filteredUsers.length > 0 && ` (${filteredUsers.length} users, ${filteredOrganisations.length} organisations)`}
        </div>
      )}

      {/* Search Results */}
      {isSearching ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">Searching...</div>
        </div>
      ) : !error && allResults.length > 0 ? (
        <div className="space-y-4">
          {allResults.map((result) => (
            <Card key={`${result.type}-${result.id}`} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {result.type === "user" ? (
                      <Users className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Building2 className="h-4 w-4 text-green-500" />
                    )}
                    {result.name}
                  </CardTitle>
                  <span className={`text-xs px-2 py-1 rounded ${
                    result.type === "user" 
                      ? "bg-blue-100 text-blue-600" 
                      : "bg-green-100 text-green-600"
                  }`}>
                    {result.type}
                  </span>
                </div>
                <CardDescription>{result.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : !error && query ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-32">
            <Search className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No results found</h3>
            <p className="text-gray-500 text-center">
              Try searching with different keywords or check your spelling
            </p>
          </CardContent>
        </Card>
      ) : !error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-32">
            <Search className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Start searching</h3>
            <p className="text-gray-500 text-center">
              Enter a search term to find users or organisations
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

export default function SearchPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500">Loading search...</div>
      </div>
    }>
      <SearchPageContent />
    </React.Suspense>
  )
}
