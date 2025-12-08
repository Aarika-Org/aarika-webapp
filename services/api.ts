/**
 * Aarika Core API Service
 * 
 * Handles communication with the Aarika Core backend for competition management.
 * Supports x402 payment flow with Thirdweb wallet integration.
 */

// Backend endpoint from environment variable
const AARIKA_CORE_ENDPOINT = import.meta.env.VITE_AARIKA_CORE_ENDPOINT || 'http://localhost:8000';

// Types for API responses
export interface PaymentRequirement {
    x402Version: number;
    accepts: Array<{
        scheme: string;
        network: string;
        maxAmountRequired: string;
        resource: string;
        description: string;
        mimeType: string;
        payTo: string;
        maxTimeoutSeconds: number;
        asset: string;
        extra: {
            name: string;
            version: string;
        };
    }>;
    error: string;
}

/**
 * Select a winner. Follows the x402 payment flow similarly to createCompetition.
 */
export async function selectWinner(
    params: SelectWinnerRequest,
    paymentHeader?: string
): Promise<{ status: number; data: PaymentRequirement | SelectWinnerResponse | ApiError }> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (paymentHeader) headers['X-PAYMENT'] = paymentHeader;

    try {
        const response = await fetch(`${AARIKA_CORE_ENDPOINT}/select-winner`, {
            method: 'POST',
            headers,
            body: JSON.stringify(params),
        });
        const data = await response.json();
        return { status: response.status, data };
    } catch (error) {
        console.error('API Error:', error);
        return {
            status: 500,
            data: { error: error instanceof Error ? error.message : 'Network error' },
        };
    }
}

export interface CreateCompetitionRequest {
    prompt: string;
    rewardAmount: number;
    walletAddress: string;
}

export interface CreateCompetitionResponse {
    competitionId: string;
    status: string;
    message: string;
    txHash?: string;
}

export interface ApiError {
    error: string;
    code?: string;
}

// Winner selection
export interface SelectWinnerRequest {
    competitionId: string;
    winningAgentId: string;
}

export interface SelectWinnerResponse {
    status: string;
    competitionId: string;
    winnerAgentId: string;
    declareTx?: string;
    notifyTx?: string;
    payoutTx?: string;
    completeTx?: string;
    downloadUrl?: string | null;
}

/**
 * Create a competition on the Aarika platform.
 * 
 * This follows the x402 payment flow:
 * 1. First call without X-PAYMENT header returns 402 with payment requirements
 * 2. Second call with X-PAYMENT header (after payment) creates the competition
 * 
 * @param params - Competition creation parameters
 * @param paymentHeader - Optional base64-encoded x402 payment proof
 * @returns On 402: Payment requirements. On 200: Competition details.
 */
export async function createCompetition(
    params: CreateCompetitionRequest,
    paymentHeader?: string
): Promise<{ status: number; data: PaymentRequirement | CreateCompetitionResponse | ApiError }> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (paymentHeader) {
        headers['X-PAYMENT'] = paymentHeader;
    }

    try {
        const response = await fetch(`${AARIKA_CORE_ENDPOINT}/create-competition`, {
            method: 'POST',
            headers,
            body: JSON.stringify(params),
        });

        const data = await response.json();

        return {
            status: response.status,
            data,
        };
    } catch (error) {
        console.error('API Error:', error);
        return {
            status: 500,
            data: { error: error instanceof Error ? error.message : 'Network error' },
        };
    }
}

/**
 * Helper to check if response is a payment requirement (402)
 */
export function isPaymentRequired(
    response: { status: number; data: PaymentRequirement | CreateCompetitionResponse | ApiError }
): response is { status: 402; data: PaymentRequirement } {
    return response.status === 402;
}

/**
 * Helper to check if response is successful (200)
 */
export function isSuccess(
    response: { status: number; data: PaymentRequirement | CreateCompetitionResponse | ApiError }
): response is { status: 200; data: CreateCompetitionResponse } {
    return response.status === 200;
}

/**
 * Get the escrow amount from payment requirements
 * Escrow is 20% of the reward amount
 */
export function getEscrowAmount(paymentRequirement: PaymentRequirement): string {
    if (paymentRequirement.accepts && paymentRequirement.accepts.length > 0) {
        return paymentRequirement.accepts[0].maxAmountRequired;
    }
    return '0';
}

export default {
    createCompetition,
    isPaymentRequired,
    isSuccess,
    getEscrowAmount,
    getCompetition,
    getCompetitions,
    selectWinner,
};

/**
 * Fetch a competition by its backend UUID
 */
export interface AuthHeaders {
    address: string;
    signature: string;
    timestamp: string; // seconds since epoch as string
}

export async function getCompetition(id: string, auth?: AuthHeaders): Promise<any> {
    const headers: Record<string, string> = {};
    if (auth) {
        headers['x-wallet-address'] = auth.address;
        headers['x-signature'] = auth.signature;
        headers['x-timestamp'] = auth.timestamp;
    }
    const res = await fetch(`${AARIKA_CORE_ENDPOINT}/competitions/${id}`, { headers });
    if (!res.ok) {
        throw new Error('Competition not found');
    }
    return res.json();
}

/**
 * Fetch all competitions
 */
export async function getCompetitions(auth?: AuthHeaders): Promise<any[]> {
    const headers: Record<string, string> = {};
    if (auth) {
        headers['x-wallet-address'] = auth.address;
        headers['x-signature'] = auth.signature;
        headers['x-timestamp'] = auth.timestamp;
    }
    const res = await fetch(`${AARIKA_CORE_ENDPOINT}/competitions`, { headers });
    if (!res.ok) {
        throw new Error('Failed to fetch competitions');
    }
    return res.json();
}

/**
 * Poll delivery status for a completed competition
 */
export async function getDeliveryStatus(competitionId: string): Promise<{ ready: boolean; downloadUrl?: string }> {
    const res = await fetch(`${AARIKA_CORE_ENDPOINT}/delivery-status?competitionId=${encodeURIComponent(competitionId)}`);
    if (!res.ok) {
        throw new Error('Failed to fetch delivery status');
    }
    return res.json();
}
