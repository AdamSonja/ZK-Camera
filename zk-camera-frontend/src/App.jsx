import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import UploadSection from "./components/UploadSection.jsx";
import MetadataDisplay from "./components/MetadataDisplay.jsx";
import ProofGenerator from "./components/ProofGenerator.jsx";
import Verifier from "./components/Verifier.jsx";
import ResultCard from "./components/ResultCard.jsx";
import { uploadImage, proveQuery, verifyProof } from "./api.js";

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
  const [minTimestamp, setMinTimestamp] = useState("");
  const [maxTimestamp, setMaxTimestamp] = useState("");
  const [expectedState, setExpectedState] = useState("");
  const [uploadStateValue, setUploadStateValue] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

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

  // Upload (commitment only)
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    // Old behaviour: the frontend previously expected the backend to return a proof
    // together with the upload. That is incorrect for the new API: /upload only
    // returns the commitment. Proofs must be generated later via /prove/query.
    setUploadLoading(true);
    setUploadError(null);
    try {
      const { data } = await uploadImageWithState(selectedFile, { state: uploadStateValue });
      // Store only the commitment in state. Do NOT expect proof/publicSignals here.
      setCommitmentData({ commitment: data.commitment });
      setProofData(null);

      // Advance to 'Commitment Created'
      setStepIndex(1);
    } catch (err) {
      console.error(err);
      setUploadError(err?.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setUploadLoading(false);
    }
  }, [selectedFile]);

  const handleVerify = useCallback(async () => {
    // Verify flow now does two things:
    // 1) If a proof has not been generated yet for the stored commitment,
    //    call /prove/query to request a proof for the verifier-specified query.
    // 2) Call /verify/query with the proof+publicSignals and show the boolean result.

    if (!commitmentData || !commitmentData.commitment) {
      setVerificationOutcome("failure");
      setVerificationMessage("No commitment available. Upload an image first.");
      return;
    }

    try {
      // Ensure verifier provided query parameters
      if (!minTimestamp || !maxTimestamp || !expectedState) {
        setVerificationOutcome("failure");
        setVerificationMessage("Please provide minTimestamp, maxTimestamp and expectedState before verifying.");
        return;
      }

      // Convert timestamp inputs (ISO or numeric) into epoch seconds integers
      const parseToEpoch = (v) => {
        // if it's numeric string, use it directly
        if (/^\d+$/.test(v)) return Number(v);
        const d = new Date(v);
        return Math.floor(d.getTime() / 1000);
      };

      const minTsNum = parseToEpoch(minTimestamp);
      const maxTsNum = parseToEpoch(maxTimestamp);
      const expectedStateNum = Number(expectedState);

      // If no proof yet, request proof generation from server
      let localProofData = proofData;
      if (!localProofData) {
        const { data: proveRes } = await proveQuery({
          commitment: commitmentData.commitment,
          minTimestamp: minTsNum,
          maxTimestamp: maxTsNum,
          expectedState: expectedStateNum,
        });
        localProofData = { proof: proveRes.proof, publicSignals: proveRes.publicSignals, commitmentHash: commitmentData.commitment };
        setProofData(localProofData);
        setStepIndex(2);
      }

      // Use the (newly-created) proofData to verify
      const { data: verifyRes } = await verifyProof({ proof: localProofData.proof, publicSignals: localProofData.publicSignals });

      const validBool = (verifyRes && (verifyRes.valid === true || verifyRes.valid === 'true' || verifyRes.valid === 1));
      if (validBool) {
        setVerificationOutcome("success");
        setVerificationMessage("Image authenticity verified.");
        setStepIndex(3);
      } else {
        setVerificationOutcome("failure");
        setVerificationMessage("Verification failed.");
      }
    } catch (err) {
      console.error(err);
      setVerificationOutcome("failure");
      setVerificationMessage(err?.response?.data?.error || err.message || "Verification failed");
    }
  }, [proofData, commitmentData, minTimestamp, maxTimestamp, expectedState]);

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
          isLoading={uploadLoading}
          stateValue={uploadStateValue}
          setStateValue={setUploadStateValue}
        />

        <MetadataDisplay metadata={commitmentData} />

        <ProofGenerator proofData={proofData} disabled />

        <Verifier
          proofData={proofData}
          onVerify={handleVerify}
          minTimestamp={minTimestamp}
          setMinTimestamp={setMinTimestamp}
          maxTimestamp={maxTimestamp}
          setMaxTimestamp={setMaxTimestamp}
          expectedState={expectedState}
          setExpectedState={setExpectedState}
        />

        <div className="lg:col-span-2">
          <ResultCard status={verificationOutcome} message={verificationMessage} />
        </div>
      </main>
    </div>
  );
}
