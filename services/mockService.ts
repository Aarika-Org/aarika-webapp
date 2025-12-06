import { Competition, CompetitionStatus, Submission } from '../types';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to generate a fake hash
const mockHash = () => '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');

export const mockService = {
  // User Journey 1: Create Competition
  async createCompetition(
    metadata: { title: string; reward: number }, 
    addLog: (s: any, e: string, d?: any) => void
  ): Promise<Competition> {
    addLog('Frontend', 'Initiating Create Competition', metadata);
    
    // 1. Payment Simulation
    addLog('Thirdweb', 'Opening Payment Modal (x402)', { 
      amount: metadata.reward * 0.2 + 10, // Entry + 20% escrow
      currency: 'USDC' 
    });
    await delay(1500);
    addLog('Thirdweb', 'Payment Successful', { txHash: mockHash() });
    
    // 2. Webhook
    addLog('Backend', 'Received Payment Webhook', { signature: mockHash().substring(0, 10) + '...' });
    await delay(800);
    
    // 3. Relayer writes to chain
    addLog('Relayer', 'Submitting Transaction to Avalanche', { 
      function: 'createCompetition',
      params: { metadataHash: mockHash(), escrowAmount: metadata.reward * 0.2 } 
    });
    await delay(2000);
    
    const newComp: Competition = {
      id: `comp_${Date.now()}`,
      title: metadata.title,
      description: 'A newly created competition.',
      rewardAmount: metadata.reward,
      entryFee: 10,
      status: CompetitionStatus.LIVE,
      creatorId: 'currentUser',
      createdAt: Date.now(),
      agentCount: 0,
      submissions: []
    };

    addLog('Contract', 'Event Emitted: CompetitionCreated', { competitionId: newComp.id });
    addLog('Frontend', 'Competition is now LIVE');
    
    return newComp;
  },

  // User Journey 2: Agent Registration
  async registerAgent(competitionId: string, agentId: string, addLog: any) {
    addLog('Agent', 'Initiating Registration', { competitionId, agentId });
    
    // Backend API
    addLog('Backend', 'POST /register-agent', { competitionId });
    await delay(500);
    
    // Payment
    addLog('Thirdweb', 'Processing Registration Fee (x402)', { amount: 5 }); // arbitrary small fee
    await delay(1500);
    addLog('Thirdweb', 'Payment Confirmed');
    
    // Contract Call
    addLog('Relayer', 'Calling registerAgent() on Avalanche', { agentId, competitionId });
    await delay(2000);
    
    addLog('Contract', 'Event Emitted: AgentRegistered', { agentId, competitionId });
    return true;
  },

  // User Journey 3: Asset Submission
  async submitAsset(competitionId: string, agentId: string, file: File, addLog: any): Promise<Submission> {
    addLog('Agent', 'Preparing Submission Locally', { fileName: file.name, size: file.size });
    
    // 1. Pinata Private Upload
    addLog('Pinata', 'Uploading RAW file via Presigned URL (Private)', { method: 'PUT' });
    await delay(2000);
    const originalCid = 'Qm' + mockHash().substring(2, 44);
    addLog('Pinata', 'File Stored (Private)', { cid: originalCid });
    
    // 2. Webhook to Backend
    addLog('Backend', 'Received Pinata Webhook', { cid: originalCid });
    await delay(1000);
    
    // 3. Watermarking & Public Upload
    addLog('Backend', 'Generating Watermarked Preview...');
    await delay(1500);
    const watermarkedCid = 'Qm' + mockHash().substring(2, 44);
    addLog('Pinata', 'Uploaded Preview to Public IPFS', { cid: watermarkedCid });
    
    // 4. Contract Commit
    addLog('Relayer', 'Calling commitSubmission()', { hash: mockHash() });
    await delay(1500);
    addLog('Contract', 'Event Emitted: commitSubmission');
    addLog('Contract', 'Event Emitted: SubmissionPreviewGenerated', { previewCid: watermarkedCid });

    return {
      id: `sub_${Date.now()}`,
      agentId,
      previewUrl: `https://picsum.photos/seed/${watermarkedCid}/400/300?blur=2`, // Simulating watermark visually with generic image
      originalCid,
      timestamp: Date.now()
    };
  },

  // User Journey 4: Winner Selection
  async selectWinner(competitionId: string, winningAgentId: string, amount: number, addLog: any) {
    addLog('Creator', 'Selected Winner', { winningAgentId });
    
    // 1. Pay remaining 80%
    addLog('Thirdweb', 'Opening Payment Modal for Final Settlement', { amount: amount * 0.8 });
    await delay(2000);
    addLog('Thirdweb', 'Payment Verified (x402)', { tx: mockHash() });
    
    // 2. Webhook
    addLog('Backend', 'Verifying Signature & Amount');
    await delay(500);
    
    // 3. Contract Declare Winner
    addLog('Relayer', 'Calling declareWinner()', { competitionId, winningAgentId });
    await delay(2000);
    addLog('Contract', 'Event Emitted: WinnerDeclared');
    
    // 4. Payouts
    addLog('Contract', 'Transferring funds to Winner wallet');
    addLog('Contract', 'Transferring platform fee (10%)');
    addLog('Contract', 'Event Emitted: CompetitionEnded');
    
    // 5. Delivery
    addLog('Backend', 'Generating Time-Limited Download Link (Pinata)');
    await delay(1000);
    
    return {
      downloadUrl: 'https://pinata.cloud/ipfs/QmRestOfUrl...'
    };
  }
};
