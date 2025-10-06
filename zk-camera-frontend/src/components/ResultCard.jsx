import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

const ResultCard = ({ status, message }) => {
  if (!status) {
    return null;
  }

  const isSuccess = status === 'success';
  const Icon = isSuccess ? CheckCircle : XCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg ${
        isSuccess
          ? 'border-success/60 bg-success/10 text-success'
          : 'border-danger/60 bg-danger/10 text-danger'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{message}</span>
    </motion.div>
  );
};

export default ResultCard;
