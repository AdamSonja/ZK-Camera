import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import UploadSection from './components/UploadSection.jsx';
import MetadataDisplay from './components/MetadataDisplay.jsx';
import ProofGenerator from './components/ProofGenerator.jsx';
import Verifier from './components/Verifier.jsx';
import ResultCard from './components/ResultCard.jsx';
import { uploadImage, generateProof, verifyProof } from './api.js';

const steps = [
  { key: 0, label: 'Uploading' },
  { key: 1, label: 'Commitment Created' },
  { key: 2, label: 'Generating Proof' },
  { key: 3, label: 'Verified ✅' },
];

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [commitmentData, setCommitmentData] = useState(null);
  const [commitmentStatus, setCommitmentStatus] = useState({ loading: false, error: null });

  const [proofData, setProofData] = useState(null);
  const [proofStatus, setProofStatus] = useState({ loading: false, error: null });

  const [verifyStatus, setVerifyStatus] = useState({ loading: false, error: null });
  const [manifest, setManifest] = useState(null);

  const [stepIndex, setStepIndex] = useState(-1);
  const [verificationOutcome, setVerificationOutcome] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState('');

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleFileSelect = useCallback((file) => {
    setSelectedFile(file);
    setCommitmentData(null);
    setProofData(null);
    setManifest(null);
    setVerificationOutcome(null);
    setVerificationMessage('');
    setCommitmentStatus({ loading: false, error: null });
    setProofStatus({ loading: false, error: null });
    setVerifyStatus({ loading: false, error: null });
    setStepIndex(0);

    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }, []);

  // STEP 1: Upload + Commitment
  const handleUploadAndCommit = useCallback(async () => {
    if (!selectedFile) return;

    setCommitmentStatus({ loading: true, error: null });

    try {
      const { data } = await uploadImage(selectedFile);

      setCommitmentData({
        commitment: data.commitment,
        publicKey: data.publicKey,
        signature: data.signature,
      });

      setStepIndex(1);
    } catch (err) {
      setCommitmentStatus({
        loading: false,
        error: err?.message || 'Failed to create commitment',
      });
      return;
    }

    setCommitmentStatus({ loading: false, error: null });
  }, [selectedFile]);

  // STEP 2: Proof
  const handleGenerateProof = useCallback(async () => {
    if (!commitmentData) return;

    setProofStatus({ loading: true, error: null });

    try {
      const { data } = await generateProof({
        commitment: commitmentData.commitment,
      });

      setProofData({
        commitmentHash: data.commitment || commitmentData.commitment,
        proof: data.proof || null,
        publicSignals: data.publicSignals || null,
      });

      setStepIndex(2);
    } catch (err) {
      setProofStatus({
        loading: false,
        error: err?.message || 'Proof generation failed',
      });
      return;
    }

    setProofStatus({ loading: false, error: null });
  }, [commitmentData]);

  // STEP 3: Verify
  const handleVerify = useCallback(async () => {
    if (!proofData) return;

    setVerifyStatus({ loading: true, error: null });

    try {
      const { data } = await verifyProof(proofData);
      const verified = data?.verified ?? false;

      if (verified) {
        setVerificationOutcome('success');
        setVerificationMessage('Image authenticity verified.');
        setStepIndex(3);
      } else {
        setVerificationOutcome('failure');
        setVerificationMessage('Verification failed.');
      }

      setManifest(data?.manifest || null);
    } catch (err) {
      setVerificationOutcome('failure');
      setVerificationMessage(err?.message || 'Verification error');
      setVerifyStatus({ loading: false, error: err?.message });
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
        <div className="mx-auto max-w-6xl px-6 py-5">
          <h1 className="text-2xl font-semibold">
            ZK-Camera <span className="text-brand-400">|</span> Proof of Authenticity
          </h1>

          <div className="mt-4">
            <div className="flex justify-between text-xs uppercase text-gray-500">
              {steps.map((s, i) => (
                <span key={s.key} className={i <= stepIndex ? 'text-brand-300' : ''}>
                  {s.label}
                </span>
              ))}
            </div>
            <div className="mt-2 h-2 rounded bg-white/10">
              <motion.div
                animate={{ width: `${progressPercent}%` }}
                className="h-2 rounded bg-brand-500"
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
          onExtractMetadata={handleUploadAndCommit}
          isLoading={commitmentStatus.loading}
          canProceed={Boolean(selectedFile)}
        />

        <MetadataDisplay
          metadata={commitmentData}
          isLoading={commitmentStatus.loading}
          error={commitmentStatus.error}
        />

        <ProofGenerator
          metadata={commitmentData}
          onGenerateProof={handleGenerateProof}
          proofData={proofData}
          isLoading={proofStatus.loading}
          error={proofStatus.error}
          disabled={!commitmentData}
        />

        <Verifier
          proofData={proofData}
          onVerify={handleVerify}
          isLoading={verifyStatus.loading}
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
