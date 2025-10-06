import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

const ProofGenerator = ({
  metadata,
  onGenerateProof,
  proofData,
  isLoading,
  disabled,
  error,
}) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: 0.1 }}
    className="bg-card/90 border border-white/10 rounded-2xl p-6 shadow-xl"
  >
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold">3. Generate Proof</h2>
      <ShieldCheck className="h-5 w-5 text-brand-500" />
    </div>
    <p className="text-sm text-gray-400">
      Produce a zero-knowledge proof and commitment hash from the extracted metadata.
    </p>

    <button
      type="button"
      onClick={onGenerateProof}
      disabled={disabled || isLoading}
      className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-medium text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-gray-600"
    >
      {isLoading && (
        <span className="inline-flex h-4 w-4 items-center justify-center">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </span>
      )}
      Generate Proof
    </button>

    {isLoading && (
      <p className="mt-3 text-sm text-gray-300">Generating cryptographic proof…</p>
    )}

    {!isLoading && error && (
      <p className="mt-3 text-sm text-red-400">{error}</p>
    )}

    {proofData && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 space-y-3 rounded-lg border border-brand-500/30 bg-black/40 p-4 text-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Commitment Hash</span>
          <code className="truncate rounded bg-black/60 px-2 py-1 text-xs text-brand-200">
            {proofData.commitmentHash || '—'}
          </code>
        </div>
        <details className="group rounded-lg border border-white/10 bg-black/30">
          <summary className="cursor-pointer select-none rounded-lg px-3 py-2 font-medium text-gray-200">
            proof.json
          </summary>
          <pre className="max-h-48 overflow-auto px-3 pb-3 text-xs text-gray-100">
            {JSON.stringify(proofData.proof, null, 2)}
          </pre>
        </details>
        <details className="group rounded-lg border border-white/10 bg-black/30">
          <summary className="cursor-pointer select-none rounded-lg px-3 py-2 font-medium text-gray-200">
            public.json
          </summary>
          <pre className="max-h-48 overflow-auto px-3 pb-3 text-xs text-gray-100">
            {JSON.stringify(proofData.publicSignals, null, 2)}
          </pre>
        </details>
      </motion.div>
    )}
  </motion.section>
);

export default ProofGenerator;
