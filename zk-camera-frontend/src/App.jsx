import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import UploadSection from "./components/UploadSection.jsx";
import MetadataDisplay from "./components/MetadataDisplay.jsx";
import ProofGenerator from "./components/ProofGenerator.jsx";
import Verifier from "./components/Verifier.jsx";
import ResultCard from "./components/ResultCard.jsx";
import { uploadImage, verifyProof } from "./api.js";

const steps = [
  { key: 0, label: "Uploading" },
  { key: 1, label: "Commitment Created" },
  { key: 2, label: "Proof Generated" },
  { key: 3, label: "Verified ✅" },
];

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [commitmentData, setCommitmentData] = useState(null);
  const [proofData, setProofData] = useState(null);

  const [stepIndex, setStepIndex] = useState(-1);
  const [verificationOutcome, setVerificationOutcome] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState("");

  useEffect(() => {
    return () => previewUrl && URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleFileSelect = useCallback((file) => {
    setSelectedFile(file);
    setCommitmentData(null);
    setProofData(null);
    setVerificationOutcome(null);
    setVerificationMessage("");
    setStepIndex(0);

    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }, []);

  // Upload + Proof (ONE STEP)
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    const { data } = await uploadImage(selectedFile);

    setCommitmentData({ commitment: data.commitment });
    setProofData({
      proof: data.proof,
      publicSignals: data.publicSignals,
    });

    setStepIndex(2);
  }, [selectedFile]);

  const handleVerify = useCallback(async () => {
    if (!proofData) return;

    const { data } = await verifyProof({
      proof: proofData.proof,
      publicSignals: proofData.publicSignals,
    });

    if (data.verified) {
      setVerificationOutcome("success");
      setVerificationMessage("Image authenticity verified.");
      setStepIndex(3);
    } else {
      setVerificationOutcome("failure");
      setVerificationMessage("Verification failed.");
    }
  }, [proofData]);

  const progressPercent = useMemo(
    () => ((stepIndex + 1) / steps.length) * 100,
    [stepIndex]
  );

  return (
    <div className="min-h-screen bg-black pb-10">
      <header className="border-b border-white/10 bg-black p-6">
        <h1 className="text-2xl font-semibold">
          ZK-Camera <span className="text-brand-400">|</span> Proof of Authenticity
        </h1>

        <div className="mt-4 h-2 bg-white/10 rounded">
          <motion.div
            animate={{ width: `${progressPercent}%` }}
            className="h-2 bg-brand-500 rounded"
          />
        </div>
      </header>

      <main className="mx-auto mt-10 grid max-w-6xl gap-6 px-6 lg:grid-cols-2">
        <UploadSection
          selectedFile={selectedFile}
          previewUrl={previewUrl}
          onFileSelect={handleFileSelect}
          onExtractMetadata={handleUpload}
          canProceed={Boolean(selectedFile)}
        />

        <MetadataDisplay metadata={commitmentData} />

        <ProofGenerator proofData={proofData} disabled />

        <Verifier proofData={proofData} onVerify={handleVerify} />

        <div className="lg:col-span-2">
          <ResultCard status={verificationOutcome} message={verificationMessage} />
        </div>
      </main>
    </div>
  );
}
