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

export interface TeamSummary {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  teamLeaderId: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  teamLeader: { id: string; name: string; email: string } | null;
  _count: { members: number };
}

export interface TeamMemberInfo {
  joinedAt: string;
  user: { id: string; name: string; email: string };
}

export interface TeamDetail {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  teamLeaderId: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  teamLeader: { id: string; name: string; email: string } | null;
  members: TeamMemberInfo[];
}

export interface PendingInvitation {
  id: string;
  email: string;
  intendedRole: "TEAM_LEADER" | "DEVELOPER";
  status: string;
  expiresAt: string;
  createdAt: string;
  team: { id: string; name: string } | null;
  invitedBy: { id: string; name: string };
}

export type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "ARCHIVED";

export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface ProjectSummary {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: Priority;
  startDate: string | null;
  dueDate: string | null;
  teamLeaderId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  teamLeader: { id: string; name: string; email: string };
  createdBy: { id: string; name: string };
  teams: { team: { id: string; name: string } }[];
}

export interface ProjectDetail extends Omit<ProjectSummary, "teams"> {
  createdBy: { id: string; name: string };
  teams: {
    team: {
      id: string;
      name: string;
      teamLeader: { id: string; name: string } | null;
      _count: { members: number };
    };
  }[];
}