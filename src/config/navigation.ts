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
    title: "User Management",
    url: "", // Empty URL for collapsible groups
    items: [
      { title: "Organizations", url: "/organisations" },
      { title: "Users", url: "/users" },
      { title: "Role Based Permissions", url: "/roles" },
    ],
  },
];