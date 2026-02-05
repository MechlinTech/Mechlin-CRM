import { NextRequest, NextResponse } from "next/server"
import { getAllUsers } from "@/data/users"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organisationId = searchParams.get("organisationId")
    
    if (!organisationId) {
      return NextResponse.json(
        { error: "Organisation ID is required" },
        { status: 400 }
      )
    }

    const { data, error } = await getAllUsers()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Filter users by organization and return only id, name, email
    const orgUsers = data
      ?.filter(user => user.organisation_id === organisationId)
      ?.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email
      })) || []

    return NextResponse.json(orgUsers)
  } catch (error) {
    console.error("Error fetching organization users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
