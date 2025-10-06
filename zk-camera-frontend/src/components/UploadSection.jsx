import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';

const UploadSection = ({
  selectedFile,
  previewUrl,
  onFileSelect,
  onExtractMetadata,
  isLoading,
  canProceed,
}) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card/90 border border-white/10 rounded-2xl p-6 shadow-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">1. Upload Image</h2>
        <span className="text-sm text-gray-400">PNG, JPG, JPEG</span>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        Select an image to begin the authenticity workflow. Your file stays on this device until you submit it.
      </p>
      <div
        onClick={() => fileInputRef.current?.click()}
        className="group relative flex flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 p-8 text-center transition hover:border-brand-500 hover:bg-brand-500/10 cursor-pointer"
      >
        <Upload className="h-12 w-12 text-brand-500 transition group-hover:scale-105" />
        <p className="mt-4 text-base font-medium">
          {selectedFile ? selectedFile.name : 'Drag & drop or click to browse'}
        </p>
        <p className="text-xs text-gray-500 mt-1">Max 15MB</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {previewUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6"
        >
          <p className="text-sm text-gray-300 mb-2">Preview</p>
          <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black/30">
            <img
              src={previewUrl}
              alt="Selected preview"
              className="w-full h-64 object-contain bg-black"
            />
          </div>
        </motion.div>
      )}
      <button
        type="button"
        onClick={onExtractMetadata}
        disabled={!canProceed || isLoading}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-medium text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-gray-600"
      >
        {isLoading && (
          <span className="inline-flex h-4 w-4 items-center justify-center">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </span>
        )}
        Extract Metadata
      </button>
    </motion.section>
  );
};

export default UploadSection;
