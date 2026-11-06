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
  stats: ProjectStats;
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

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED";

export interface ProjectStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  progress: number;
  byStatus: Record<TaskStatus, number>;
}

export interface Task {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  description: string | null;
  assignedToId: string | null;
  createdById: string;
  status: TaskStatus;
  priority: Priority;
  position: number;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: { id: string; name: string; email: string } | null;
  createdBy: { id: string; name: string };
  isOverdue: boolean;
}

export interface Assignee {
  id: string;
  name: string;
  email: string;
  teams: string[];
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; role: Role };
}

export interface ActivityEntry {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name: string; role: Role };
}

export interface GithubConnection {
  repoOwner: string;
  repoName: string;
  defaultBranch: string;
  url: string;
  connectedBy: { id: string; name: string } | null;
  createdAt: string;
}

export interface GithubCommit {
  sha: string;
  shortSha: string;
  message: string;
  url: string;
  authorName: string | null;
  authorLogin: string | null;
  authorAvatar: string | null;
  committedAt: string | null;
}

export interface GithubPullRequest {
  number: number;
  title: string;
  url: string;
  draft: boolean;
  authorLogin: string | null;
  authorAvatar: string | null;
  branch: string;
  base: string;
  createdAt: string;
  updatedAt: string;
}

export interface PullRequestInfo {
  number: number;
  title: string;
  state: "open" | "closed" | "merged";
  draft: boolean;
  authorLogin: string | null;
}

export interface TaskPrLink {
  id: string;
  prNumber: number;
  url: string | null;
  linkedBy: { id: string; name: string };
  createdAt: string;
  info: PullRequestInfo | null;
}