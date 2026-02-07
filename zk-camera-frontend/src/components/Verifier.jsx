import { motion } from 'framer-motion';
import { Fingerprint } from 'lucide-react';

const JsonViewer = ({ title, data }) => (
  <details className="group overflow-hidden rounded-xl border border-white/10 bg-black/30">
    <summary className="cursor-pointer select-none bg-black/40 px-4 py-3 text-sm font-medium text-gray-200 outline-none transition group-hover:text-white">
      {title}
    </summary>
    <pre className="max-h-64 overflow-auto px-4 pb-4 text-xs leading-relaxed text-gray-100">
      {JSON.stringify(data, null, 2)}
    </pre>
  </details>
);

const Verifier = ({ proofData, onVerify, isLoading, manifest, error, minTimestamp, setMinTimestamp, maxTimestamp, setMaxTimestamp, expectedState, setExpectedState }) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: 0.15 }}
    className="bg-card/90 border border-white/10 rounded-2xl p-6 shadow-xl"
  >
    <div className="flex items-center justify-between mb-4">
  <h2 className="text-xl font-semibold">4. Verify Authenticity</h2>
  <Fingerprint className="h-5 w-5 text-brand-500" />
    </div>
    <p className="text-sm text-gray-400">
      Submit the generated proof to confirm image authenticity against the expected manifest.
    </p>

    <div className="mt-4 space-y-2">
      <label className="block text-xs text-gray-300">Min timestamp (ISO or seconds)</label>
      <input value={minTimestamp || ''} onChange={(e) => setMinTimestamp && setMinTimestamp(e.target.value)} className="w-full rounded bg-black/60 px-3 py-2 text-sm text-gray-100 border border-white/5" />

      <label className="block text-xs text-gray-300">Max timestamp (ISO or seconds)</label>
      <input value={maxTimestamp || ''} onChange={(e) => setMaxTimestamp && setMaxTimestamp(e.target.value)} className="w-full rounded bg-black/60 px-3 py-2 text-sm text-gray-100 border border-white/5" />

      <label className="block text-xs text-gray-300">Expected state (integer code)</label>
      <input value={expectedState || ''} onChange={(e) => setExpectedState && setExpectedState(e.target.value)} className="w-full rounded bg-black/60 px-3 py-2 text-sm text-gray-100 border border-white/5" />
    </div>

    <button
      type="button"
      onClick={onVerify}
      disabled={isLoading}
      className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-medium text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-gray-600"
    >
      {isLoading && (
        <span className="inline-flex h-4 w-4 items-center justify-center">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </span>
      )}
      Verify Authenticity
    </button>

    {isLoading && (
      <p className="mt-3 text-sm text-gray-300">Verifying proof and manifest…</p>
    )}

    {!isLoading && error && (
      <p className="mt-3 text-sm text-red-400">{error}</p>
    )}

    {manifest && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 space-y-4"
      >
        <h3 className="text-sm font-semibold text-gray-200">Verification Manifest</h3>
        <JsonViewer title="manifest.json" data={manifest} />
      </motion.div>
    )}
  </motion.section>
);

export default Verifier;
