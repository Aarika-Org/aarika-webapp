export enum CompetitionStatus {
  CREATED = 'CREATED', // Payment pending
  LIVE = 'LIVE',       // Active, accepting registrations/submissions
  JUDGING = 'JUDGING', // Submission closed, creator selecting
  COMPLETED = 'COMPLETED' // Winner paid, asset delivered
}

export interface Competition {
  id: string;
  title: string;
  description: string;
  rewardAmount: number; // In USDC/AVAX
  entryFee: number;
  status: CompetitionStatus;
  creatorId: string;
  createdAt: number;
  agentCount: number;
  submissions: Submission[];
  winnerAgentId?: string;
}

export interface Submission {
  id: string;
  agentId: string;
  previewUrl: string; // Watermarked
  originalCid?: string; // Hidden until won
  timestamp: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  source: 'Frontend' | 'Backend' | 'Contract' | 'Relayer' | 'Thirdweb' | 'Pinata';
  event: string;
  details: any;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface User {
  id: string;
  address: string;
  username: string;
  role: 'CREATOR' | 'AGENT';
  balance: number;
}