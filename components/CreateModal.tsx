import React, { useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { avalancheFuji } from 'thirdweb/chains';
import { useStats } from '../contexts/StatsContext';
import {
  createCompetition,
  isPaymentRequired,
  isSuccess,
  PaymentRequirement,
} from '../services/api';

// USDC contract address on Avalanche Fuji Testnet
const USDC_CONTRACT_ADDRESS = '0x5425890298aed601595a70AB815c96711a31Bc65';

// EIP-712 domain for USDC TransferWithAuthorization (ERC-3009)
const USDC_DOMAIN = {
  name: 'USD Coin',
  version: '2',
  chainId: avalancheFuji.id,
  verifyingContract: USDC_CONTRACT_ADDRESS as `0x${string}`,
};

// EIP-3009 TransferWithAuthorization types
const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const;

interface CreateModalProps {
  initialPrompt: string;
  onClose: () => void;
  navigate: (p: string) => void;
}

type ModalStep = 'form' | 'payment' | 'processing' | 'error';

// Generate random nonce for authorization
function generateNonce(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return ('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`;
}

/**
 * Normalizes ECDSA signature v value to legacy format (27/28)
 */
export function normalizeSignatureV(signature: string, chainId: number): string {
  // Extract v value from signature (last byte or two)
  const vHex = signature.slice(130);
  const vValue = parseInt(vHex, 16);
  let normalizedV: number;
  if (vValue === 0 || vValue === 1) {
    // Already in yParity format, convert to legacy
    normalizedV = vValue + 27;
  } else if (vValue === 27 || vValue === 28) {
    // Already in legacy format
    normalizedV = vValue;
  } else if (vValue >= 35) {
    // EIP-155 format: v = chainId * 2 + 35 + yParity
    const yParity = (vValue - 35 - chainId * 2) % 2;
    normalizedV = yParity + 27;
  } else {
    console.warn('Unexpected v value:', vValue, '- attempting fallback');
    normalizedV = vValue;
  }
  // Reconstruct signature with normalized v
  return signature.slice(0, 130) + normalizedV.toString(16).padStart(2, '0');
}

const CreateModal: React.FC<CreateModalProps> = ({ initialPrompt, onClose, navigate }) => {
  const { addLog } = useStats();
  const account = useActiveAccount();

  const [step, setStep] = useState<ModalStep>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentRequirement | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: initialPrompt,
    rewardAmount: 100
  });

  // First step: Submit form to get payment requirements
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account?.address) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);
    addLog('Frontend', 'Initiating Create Competition', formData);

    try {
      // Call API without payment - expect 402 response
      const response = await createCompetition({
        prompt: formData.description,
        rewardAmount: formData.rewardAmount,
        walletAddress: account.address,
      });

      if (isPaymentRequired(response)) {
        addLog('Backend', 'Payment Required (x402)', {
          amount: response.data.accepts?.[0]?.maxAmountRequired,
          description: response.data.accepts?.[0]?.description
        });
        setPaymentInfo(response.data);
        setStep('payment');
      } else if (isSuccess(response)) {
        // Unexpected success without payment (maybe already paid?)
        handleSuccess(response.data.competitionId);
      } else {
        const errorData = response.data as { error: string };
        throw new Error(errorData.error || 'Failed to create competition');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      addLog('Frontend', 'Error', { error: message });
      setError(message);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  // Second step: Handle payment with ERC-3009 TransferWithAuthorization signature
  const handlePayment = async () => {
    if (!account || !paymentInfo) return;

    const payToAddress = paymentInfo.accepts?.[0]?.payTo;
    const maxAmountRequired = paymentInfo.accepts?.[0]?.maxAmountRequired;
    const network = paymentInfo.accepts?.[0]?.network;

    if (!payToAddress || !maxAmountRequired) {
      setError('Invalid payment information');
      setStep('error');
      return;
    }

    setLoading(true);
    setStep('processing');

    // Amount is already in smallest units from backend (e.g., 10100 = 0.0101 USDC)
    const amountInSmallestUnit = maxAmountRequired;

    addLog('Thirdweb', 'Requesting ERC-3009 TransferWithAuthorization signature', {
      to: payToAddress,
      amount: amountInSmallestUnit,
      asset: 'USDC'
    });

    try {
      // Generate authorization parameters
      const now = Math.floor(Date.now() / 1000);
      const validAfter = now.toString();
      const validBefore = (now + 172800).toString(); // Valid for 48 hours
      const nonce = generateNonce();

      // Debug logging
      console.log('=== ERC-3009 Signature Debug ===');
      console.log('Account:', account.address);
      console.log('Pay to:', payToAddress);
      console.log('Amount (smallest unit):', amountInSmallestUnit);
      console.log('Nonce:', nonce);

      // Build EIP-712 domain strictly from backend x402 requirements
      const accepts0 = paymentInfo.accepts?.[0];
      const chainIdFromNetwork = Number((accepts0?.network || '').split(':')[1] || avalancheFuji.id);
      const verifyingContract = (accepts0?.asset as `0x${string}`) || (USDC_CONTRACT_ADDRESS as `0x${string}`);

      // EIP-712 typed data for TransferWithAuthorization
      const typedData = {
        types: TRANSFER_WITH_AUTHORIZATION_TYPES,
        primaryType: 'TransferWithAuthorization' as const,
        domain: {
          name: 'USD Coin',
          version: '2',
          chainId: chainIdFromNetwork,
          verifyingContract,
        },
        message: {
          from: account.address as `0x${string}`,
          to: payToAddress as `0x${string}`,
          value: amountInSmallestUnit,
          validAfter: validAfter,
          validBefore: validBefore,
          nonce: nonce,
        },
      };

      console.log('Typed data:', JSON.stringify({
        ...typedData,
        message: {
          ...typedData.message,
          value: amountInSmallestUnit,
          validAfter: validAfter,
          validBefore: validBefore,
        }
      }, null, 2));

      addLog('Thirdweb', 'Waiting for wallet signature...', { status: 'pending' });

      // Check if signTypedData exists on account
      if (typeof account.signTypedData !== 'function') {
        throw new Error('Wallet does not support signTypedData. Please reconnect your wallet.');
      }

      // Sign the typed data using the smart wallet
      console.log('Calling account.signTypedData...');
      const signature = await account.signTypedData(typedData);
      console.log('Signature received:', signature);

      addLog('Thirdweb', 'Signature Obtained', {
        signature: signature.slice(0, 20) + '...',
        status: 'signed'
      });

      // Create x402 payment payload with the ERC-3009 signature
      const paymentPayload = {
        x402Version: paymentInfo.x402Version || 1,
        scheme: 'exact',
        network: network || `eip155:${avalancheFuji.id}`,
        payload: {
          signature: signature,
          authorization: {
            from: account.address,
            to: payToAddress,
            value: amountInSmallestUnit,
            validAfter: validAfter,
            validBefore: validBefore,
            nonce: nonce,
          }
        }
      };

      // Verify payload structure before sending
      if (!paymentPayload.payload.authorization || !paymentPayload.payload.authorization.to) {
        console.error("MALFORMED PAYLOAD:", paymentPayload);
        throw new Error("Malformed payment payload: missing authorization details");
      }

      console.log('Payment payload:', JSON.stringify(paymentPayload, null, 2));

      const paymentHeader = btoa(JSON.stringify(paymentPayload));
      console.log('X-PAYMENT Header:', paymentHeader);

      addLog('Thirdweb', 'Payment Authorization Ready', {
        from: account.address,
        to: payToAddress,
        value: amountInSmallestUnit
      });

      // Retry API with payment proof
      const response = await createCompetition(
        {
          prompt: formData.description,
          rewardAmount: formData.rewardAmount,
          walletAddress: account.address,
        },
        paymentHeader
      );

      if (isSuccess(response)) {
        addLog('Backend', 'Competition Created', {
          competitionId: response.data.competitionId,
          txHash: response.data.txHash
        });
        handleSuccess(response.data.competitionId);
      } else {
        const errorData = response.data as { error: string };
        throw new Error(errorData.error || 'Payment verification failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      console.error('Payment error:', err);
      addLog('Frontend', 'Payment Error', { error: message });
      setError(message);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (competitionId: string) => {
    addLog('Contract', 'Event Emitted: CompetitionCreated', { competitionId });
    addLog('Frontend', 'Competition is now LIVE');

    setTimeout(() => {
      navigate(`#/competition/${competitionId}`);
    }, 500);
  };

  const resetToForm = () => {
    setStep('form');
    setError(null);
    setPaymentInfo(null);
  };

  // Calculate advance payment (10% of reward) and platform fee (0.1% of reward)
  const advancePayment = formData.rewardAmount * 0.1;
  const platformFee = formData.rewardAmount * 0.001;
  const totalPayment = advancePayment + platformFee;

  // Format all costs to 5 decimal places
  const formatCost = (amount: number) => amount.toFixed(5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="bg-white w-full max-w-md sm:max-w-lg p-3 sm:p-4 md:p-5 relative transform transition-all shadow-neo-lg border-3 sm:border-4 border-black">
        <button onClick={onClose} className="absolute top-2 right-2 bg-black text-white hover:bg-neo-pink hover:text-black transition-colors font-bold px-2 py-0.5 border-2 border-black shadow-neo-sm text-xs">
          ESC
        </button>

        {/* Form Step */}
        {step === 'form' && (
          <>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-black mb-1 uppercase tracking-tighter pr-10">Initialize Protocol</h2>
            <div className="h-1 w-10 bg-neo-pink mb-2 border border-black"></div>
            <p className="text-gray-600 font-mono text-[9px] sm:text-[10px] mb-3 font-bold uppercase tracking-widest">Define parameters for distributed agent execution.</p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] sm:text-xs font-black text-black uppercase tracking-wider mb-1 border-l-3 border-neo-yellow pl-1.5">Prompt / Directive</label>
                <textarea
                  autoFocus
                  rows={2}
                  required
                  className="w-full bg-white border-2 sm:border-3 border-black text-black p-2 focus:shadow-neo outline-none transition-all placeholder-gray-400 font-sans text-xs sm:text-sm font-bold resize-none"
                  placeholder="What do you want the agents to create?"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-black text-black uppercase tracking-wider mb-1 border-l-3 border-neo-blue pl-1.5">Competition Title (Optional)</label>
                <input
                  type="text"
                  className="w-full bg-white border-2 sm:border-3 border-black text-black p-2 focus:shadow-neo outline-none font-sans font-bold text-xs sm:text-sm"
                  placeholder="e.g., Neon City Concept Art"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] sm:text-xs font-black text-black uppercase tracking-wider mb-1 border-l-3 border-neo-green pl-1.5">Reward (USDC)</label>
                  <div className="relative">
                    <span className="absolute left-2 top-2 text-black font-bold font-mono text-xs sm:text-sm">$</span>
                    <input
                      type="number"
                      required
                      min={0.01}
                      step={0.01}
                      className="w-full bg-white border-2 sm:border-3 border-black text-black pl-5 sm:pl-6 p-2 focus:shadow-neo outline-none font-mono text-sm sm:text-base font-bold"
                      value={formData.rewardAmount}
                      onChange={e => setFormData({ ...formData, rewardAmount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-black text-black uppercase tracking-wider mb-1 border-l-3 border-gray-400 pl-1.5">Advance (10%)</label>
                  <div className="w-full bg-gray-100 border-2 sm:border-3 border-black text-gray-500 p-2 font-mono text-sm sm:text-base font-bold cursor-not-allowed">
                    ${formatCost(advancePayment)}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 sm:py-3 mt-2 bg-neo-yellow text-black font-black uppercase tracking-widest border-2 sm:border-3 border-black shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg transition-all text-xs sm:text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'CONNECTING...' : 'DEPLOY COMPETITION'}
              </button>
            </form>
          </>
        )}

        {/* Payment Step */}
        {step === 'payment' && paymentInfo && (
          <>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-black mb-1 uppercase tracking-tighter pr-10">Confirm Payment</h2>
            <div className="h-1 w-10 bg-neo-green mb-2 border border-black"></div>
            <p className="text-gray-600 font-mono text-[9px] sm:text-[10px] mb-4 font-bold uppercase tracking-widest">Sign authorization to pay with USDC.</p>

            <div className="space-y-3 mb-4">
              <div className="bg-gray-50 border-2 border-black p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase text-gray-600">Advance Payment (10%)</span>
                  <span className="font-mono font-bold">${formatCost(advancePayment)} USDC</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase text-gray-600">Platform Fee (0.1%)</span>
                  <span className="font-mono font-bold">${formatCost(platformFee)} USDC</span>
                </div>
                <div className="border-t-2 border-black pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black uppercase">Total Due Now</span>
                    <span className="font-mono font-black text-lg">${formatCost(totalPayment)}</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-gray-500 font-mono">
                Remaining {(100 - 10).toFixed(0)}% (${formatCost(formData.rewardAmount * 0.9)}) will be charged when you select a winner.
              </p>

              <div className="bg-neo-green/20 border-2 border-neo-green p-2">
                <p className="text-[10px] text-black font-bold">
                  🔐 Smart Wallet (ERC-4337) - Sign gasless authorization.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={resetToForm}
                className="flex-1 py-2.5 bg-white text-black font-black uppercase tracking-widest border-2 border-black hover:bg-gray-100 transition-all text-xs"
              >
                Back
              </button>
              <button
                onClick={handlePayment}
                disabled={loading}
                className={`flex-1 py-2.5 bg-neo-green text-black font-black uppercase tracking-widest border-2 border-black shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg transition-all text-xs ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Signing...' : 'Sign & Pay'}
              </button>
            </div>
          </>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-black mb-1 uppercase tracking-tighter pr-10">Processing</h2>
            <div className="h-1 w-10 bg-neo-blue mb-2 border border-black"></div>

            <div className="flex flex-col items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-neo-pink mb-4"></div>
              <p className="text-sm font-bold uppercase text-gray-600">
                Waiting for signature...
              </p>
              <p className="text-xs font-mono text-gray-400 mt-2">Please confirm in your wallet</p>
            </div>
          </>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-black mb-1 uppercase tracking-tighter pr-10">Error</h2>
            <div className="h-1 w-10 bg-red-500 mb-2 border border-black"></div>

            <div className="bg-red-50 border-2 border-red-500 p-3 mb-4">
              <p className="text-sm font-bold text-red-700">{error}</p>
            </div>

            <button
              onClick={resetToForm}
              className="w-full py-2.5 bg-white text-black font-black uppercase tracking-widest border-2 border-black hover:bg-gray-100 transition-all text-xs"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateModal;