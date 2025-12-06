import { Competition, CompetitionStatus, User } from './types';

export const MOCK_USER: User = {
  id: 'user_0x123',
  address: '0x71C...9A2',
  username: 'shanks.eth',
  role: 'CREATOR',
  balance: 1000
};

export const INITIAL_COMPETITIONS: Competition[] = [
  {
    id: 'comp_1',
    title: 'Cyberpunk Cityscape',
    description: 'Looking for a high-fidelity cyberpunk city scene with neon lights and rain. Must include a flying car.',
    rewardAmount: 500,
    entryFee: 10,
    status: CompetitionStatus.LIVE,
    creatorId: 'user_0x999',
    createdAt: Date.now() - 86400000,
    agentCount: 3,
    submissions: [
      {
        id: 'sub_1',
        agentId: 'agent_01',
        previewUrl: 'https://picsum.photos/id/122/400/300',
        timestamp: Date.now() - 40000
      },
      {
        id: 'sub_2',
        agentId: 'agent_02',
        previewUrl: 'https://picsum.photos/id/133/400/300',
        timestamp: Date.now() - 20000
      }
    ]
  },
  {
    id: 'comp_2',
    title: 'Orbit Logo Design',
    description: 'Minimalist logo for a space logistics company.',
    rewardAmount: 200,
    entryFee: 5,
    status: CompetitionStatus.JUDGING,
    creatorId: MOCK_USER.id,
    createdAt: Date.now() - 172800000,
    agentCount: 5,
    submissions: [
       {
        id: 'sub_3',
        agentId: 'agent_03',
        previewUrl: 'https://picsum.photos/id/55/400/300',
        timestamp: Date.now() - 100000
      },
      {
        id: 'sub_4',
        agentId: 'agent_04',
        previewUrl: 'https://picsum.photos/id/66/400/300',
        timestamp: Date.now() - 90000
      }
    ]
  },
  {
    id: 'comp_3',
    title: 'Retro Synthwave Loop',
    description: 'A seamless 10s loop of a retro car driving into a sunset grid.',
    rewardAmount: 1000,
    entryFee: 25,
    status: CompetitionStatus.COMPLETED,
    creatorId: MOCK_USER.id,
    createdAt: Date.now() - 400000000,
    agentCount: 12,
    winnerAgentId: 'agent_07',
    submissions: [
      {
        id: 'sub_win',
        agentId: 'agent_07',
        previewUrl: 'https://picsum.photos/id/238/400/300',
        timestamp: Date.now() - 350000000,
        originalCid: 'QmFinishedAssetHash'
      },
      {
        id: 'sub_loss',
        agentId: 'agent_09',
        previewUrl: 'https://picsum.photos/id/239/400/300',
        timestamp: Date.now() - 360000000
      }
    ]
  }
];