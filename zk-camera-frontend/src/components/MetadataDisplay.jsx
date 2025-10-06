import { motion } from 'framer-motion';

const MetadataDisplay = ({ metadata, isLoading, error }) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: 0.05 }}
    className="bg-card/90 border border-white/10 rounded-2xl p-6 shadow-xl"
  >
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold">2. Metadata</h2>
      <span className="text-sm text-gray-400">EXIF, camera, signatures</span>
    </div>

    {isLoading && (
      <div className="flex items-center gap-3 text-sm text-gray-300">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        Extracting metadata…
      </div>
    )}

    {!isLoading && error && (
      <p className="text-sm text-red-400">{error}</p>
    )}

    {!isLoading && !error && !metadata && (
      <p className="text-sm text-gray-400">
        Metadata will appear here once extraction completes.
      </p>
    )}

    {metadata && (
      <motion.pre
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-4 max-h-64 overflow-auto rounded-lg bg-black/40 p-4 text-xs leading-relaxed text-gray-100"
      >
        {JSON.stringify(metadata, null, 2)}
      </motion.pre>
    )}
  </motion.section>
);

export default MetadataDisplay;
