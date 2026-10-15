import { Project, Task, ApprovalRequest, ProjectMemoryEntry, BudgetStatus } from '../types';

const API_BASE = '/api';

export const api = {
  // Projects
  async listProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async getProject(id: string): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects/${id}`);
    if (!res.ok) throw new Error('Failed to fetch project');
    return res.json();
  },

  async createProject(name: string, description: string, budgetLimitUsd: number = 25.0): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, budget_limit_usd: budgetLimitUsd })
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  async startAutonomousPipeline(projectId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/execute`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start pipeline');
  },

  // Tasks
  async listTasks(projectId: string): Promise<Task[]> {
    const res = await fetch(`${API_BASE}/tasks/project/${projectId}`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async retryTask(taskId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/retry`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to retry task');
  },

  // Approvals
  async listApprovals(projectId: string): Promise<ApprovalRequest[]> {
    const res = await fetch(`${API_BASE}/approvals/${projectId}`);
    if (!res.ok) throw new Error('Failed to fetch approvals');
    return res.json();
  },

  async decideApproval(approvalId: string, approved: boolean, note?: string): Promise<void> {
    const res = await fetch(`${API_BASE}/approvals/${approvalId}/decide?approved=${approved}${note ? `&note=${encodeURIComponent(note)}` : ''}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to decide approval');
  },

  // Memory
  async getMemory(projectId: string): Promise<ProjectMemoryEntry[]> {
    const res = await fetch(`${API_BASE}/memory/${projectId}`);
    if (!res.ok) throw new Error('Failed to fetch memory');
    return res.json();
  },

  // Budget & Global Stop
  async getBudget(projectId: string): Promise<BudgetStatus> {
    const res = await fetch(`${API_BASE}/budget/${projectId}`);
    if (!res.ok) throw new Error('Failed to fetch budget');
    return res.json();
  },

  async toggleEmergencyStop(active: boolean): Promise<{ is_emergency_stopped: boolean }> {
    const res = await fetch(`${API_BASE}/budget/emergency-stop?active=${active}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to toggle emergency stop');
    return res.json();
  }
};
