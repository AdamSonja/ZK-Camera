import { motion } from 'framer-motion';

const MetadataDisplay = ({ metadata, isLoading, error }) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card/90 border border-white/10 rounded-2xl p-6 shadow-xl"
  >
    <h2 className="text-xl font-semibold mb-4">2. Commitment Receipt</h2>

    {isLoading && <p className="text-sm text-gray-300">Creating commitment…</p>}
    {error && <p className="text-sm text-red-400">{error}</p>}
    {!isLoading && !error && metadata && metadata.commitment && (
      <p className="text-sm text-green-300 mt-2">Commitment created.</p>
    )}

    {!isLoading && !metadata && (
      <p className="text-sm text-gray-400">
        A cryptographic commitment will appear here.
      </p>
    )}

    {metadata && (
      <pre className="mt-4 rounded-lg bg-black/40 p-4 text-xs text-gray-100">
{JSON.stringify(metadata, null, 2)}
      </pre>
    )}
  </motion.section>
);

export default MetadataDisplay;
