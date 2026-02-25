export const SIDEBAR_NAVIGATION = [
  {
    title: "Dashboard",
    url: "/dashboard",
  },
  {
    title: "Project Management",
    url: "/projects",
    items: [], // Always include this to satisfy TypeScript
  },
  {
    title: "Organization Management",
    url: "",
    items: [
      { title: "Organizations", url: "/organisations" },
    ],
  },
  {
    title: "User Management",
    url: "", // Empty URL for collapsible groups
    items: [
      { title: "Users", url: "/users" },
      { title: "Invitations", url: "/invites" },
      { title: "Role Based Permissions", url: "/roles" },
      { title: "User Permissions", url: "/user-permissions" },
      { title: "Permissions Management", url: "/permissions-management" },
    ],
  },
];