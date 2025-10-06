import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import UploadSection from './components/UploadSection.jsx';
import MetadataDisplay from './components/MetadataDisplay.jsx';
import ProofGenerator from './components/ProofGenerator.jsx';
import Verifier from './components/Verifier.jsx';
import ResultCard from './components/ResultCard.jsx';
import { extractMetadata, generateProof, verifyProof } from './api.js';

const steps = [
  { key: 0, label: 'Uploading' },
  { key: 1, label: 'Extracting Metadata' },
  { key: 2, label: 'Generating Proof' },
  { key: 3, label: 'Verified ✅' },
];

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [metadata, setMetadata] = useState(null);
  const [metadataStatus, setMetadataStatus] = useState({ loading: false, error: null });

  const [proofData, setProofData] = useState(null);
  const [proofStatus, setProofStatus] = useState({ loading: false, error: null });

  const [verifyStatus, setVerifyStatus] = useState({ loading: false, error: null });
  const [manifest, setManifest] = useState(null);

  const [stepIndex, setStepIndex] = useState(-1);
  const [verificationOutcome, setVerificationOutcome] = useState(null); // success | failure | null
  const [verificationMessage, setVerificationMessage] = useState('');

  useEffect(() => () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  const handleFileSelect = useCallback((file) => {
    setSelectedFile(file);
    setMetadata(null);
    setProofData(null);
    setManifest(null);
    setVerificationOutcome(null);
    setVerificationMessage('');
    setMetadataStatus({ loading: false, error: null });
    setProofStatus({ loading: false, error: null });
    setVerifyStatus({ loading: false, error: null });
    setStepIndex(0);

    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return URL.createObjectURL(file);
    });
  }, []);

  const handleExtractMetadata = useCallback(async () => {
    if (!selectedFile) {
      setMetadataStatus({ loading: false, error: 'Select an image before extracting metadata.' });
      return;
    }

    setMetadataStatus({ loading: true, error: null });
    setVerificationOutcome(null);
    setVerificationMessage('');

    try {
      const { data } = await extractMetadata(selectedFile);
      setMetadata(data);
      setStepIndex((prev) => Math.max(prev, 1));
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to extract metadata. Please try again.';
      setMetadataStatus({ loading: false, error: message });
      return;
    }

    setMetadataStatus({ loading: false, error: null });
  }, [selectedFile]);

  const handleGenerateProof = useCallback(async () => {
    if (!metadata) {
      setProofStatus({ loading: false, error: 'Metadata is required before generating a proof.' });
      return;
    }

    setProofStatus({ loading: true, error: null });
    setVerificationOutcome(null);
    setVerificationMessage('');

    try {
      const payload = { metadata };
      const { data } = await generateProof(payload);

      setProofData({
        commitmentHash: data?.commitmentHash || data?.commitment || data?.hash || null,
        proof: data?.proof || data?.proofJson || data?.proof_data || null,
        publicSignals: data?.public || data?.publicJson || data?.publicSignals || null,
      });
      setStepIndex((prev) => Math.max(prev, 2));
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to generate proof. Please try again.';
      setProofStatus({ loading: false, error: message });
      return;
    }

    setProofStatus({ loading: false, error: null });
  }, [metadata]);

  const handleVerify = useCallback(async () => {
    if (!proofData) {
      setVerifyStatus({ loading: false, error: 'Generate a proof before verifying.' });
      return;
    }

    setVerifyStatus({ loading: true, error: null });
    setVerificationOutcome(null);
    setVerificationMessage('');

    try {
      const payload = {
        proof: proofData.proof,
        publicSignals: proofData.publicSignals,
        commitmentHash: proofData.commitmentHash,
      };

      const { data } = await verifyProof(payload);
      const verified = data?.verified ?? data?.isVerified ?? data?.result ?? false;

      setManifest(data?.manifest || data?.manifestJson || null);

      if (verified) {
        setVerificationOutcome('success');
        setVerificationMessage('Image authenticity verified successfully.');
        setStepIndex(3);
      } else {
        setVerificationOutcome('failure');
        setVerificationMessage(
          data?.message || 'Verification failed. The proof did not match the manifest.'
        );
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Verification failed. Please retry later.';
      setVerifyStatus({ loading: false, error: message });
      setVerificationOutcome('failure');
      setVerificationMessage(message);
      return;
    }

    setVerifyStatus({ loading: false, error: null });
  }, [proofData]);

  const progressPercent = useMemo(() => {
    const clamped = Math.max(-1, Math.min(stepIndex, steps.length - 1));
    return ((clamped + 1) / steps.length) * 100;
  }, [stepIndex]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-surface to-black pb-10">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-5">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              ZK-Camera <span className="text-brand-400">|</span> Proof of Authenticity
            </h1>
            <p className="text-sm text-gray-400">
              Step through zero-knowledge verification for media authenticity in real time.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs font-medium uppercase tracking-wide text-gray-500">
              {steps.map((step, index) => {
                const isActive = index <= stepIndex;
                return (
                  <span
                    key={step.key}
                    className={
                      isActive ? 'text-brand-300' : 'text-gray-600'
                    }
                  >
                    {step.label}
                  </span>
                );
              })}
            </div>
            <div className="h-2 w-full rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ ease: 'easeOut', duration: 0.4 }}
                className="h-2 rounded-full bg-brand-500"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-10 grid max-w-6xl gap-6 px-6 lg:grid-cols-2">
        <UploadSection
          selectedFile={selectedFile}
          previewUrl={previewUrl}
          onFileSelect={handleFileSelect}
          onExtractMetadata={handleExtractMetadata}
          isLoading={metadataStatus.loading}
          canProceed={Boolean(selectedFile)}
        />

        <MetadataDisplay
          metadata={metadata}
          isLoading={metadataStatus.loading}
          error={metadataStatus.error}
        />

        <ProofGenerator
          metadata={metadata}
          onGenerateProof={handleGenerateProof}
          proofData={proofData}
          isLoading={proofStatus.loading}
          error={proofStatus.error}
          disabled={!metadata}
        />

        <Verifier
          proofData={proofData}
          onVerify={handleVerify}
          isLoading={verifyStatus.loading}
          verificationResult={verificationOutcome}
          manifest={manifest}
          error={verifyStatus.error}
        />

        <div className="lg:col-span-2">
          <ResultCard status={verificationOutcome} message={verificationMessage} />
        </div>
      </main>
    </div>
  );
};

export default App;
