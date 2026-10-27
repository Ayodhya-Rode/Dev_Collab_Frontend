export type Role = "ADMIN" | "TEAM_LEADER" | "DEVELOPER";

export interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: Role;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
}