import { Shield, AlertTriangle, CheckCircle2, XCircle, Clock, Lock, UserCheck } from 'lucide-react';

const STATUS_CLASSES = {
  OPEN: 'badge badge-blue',
  CLOSED: 'badge badge-gray',
  ARCHIVED: 'badge badge-gray',
  PENDING: 'badge badge-amber',
  APPROVED: 'badge badge-green',
  REJECTED: 'badge badge-red',
  ADMIN: 'badge badge-purple',
  SUPERVISOR: 'badge badge-blue',
  INVESTIGATOR: 'badge badge-teal',
  LOW: 'badge badge-gray',
  MEDIUM: 'badge badge-amber',
  HIGH: 'badge badge-red',
  CRITICAL: 'badge badge-critical',
  SUCCESS: 'badge badge-green',
  FAILURE: 'badge badge-red',
  BLOCKED: 'badge badge-red',
  true: 'badge badge-green',
  false: 'badge badge-red',
};

const STATUS_ICONS = {
  APPROVED: <CheckCircle2 size={12} />,
  SUCCESS: <CheckCircle2 size={12} />,
  true: <CheckCircle2 size={12} />,
  REJECTED: <XCircle size={12} />,
  FAILURE: <XCircle size={12} />,
  BLOCKED: <XCircle size={12} />,
  false: <XCircle size={12} />,
  PENDING: <Clock size={12} />,
  MEDIUM: <AlertTriangle size={12} />,
  HIGH: <AlertTriangle size={12} />,
  CRITICAL: <AlertTriangle size={12} />,
  ADMIN: <Shield size={12} />,
  SUPERVISOR: <Lock size={12} />,
  INVESTIGATOR: <UserCheck size={12} />,
};

export default function Badge({ value, children }) {
  const cls = STATUS_CLASSES[value] || 'badge badge-gray';
  const icon = STATUS_ICONS[value];
  const displayValue = children ?? value;

  return (
    <span className={cls}>
      {icon}
      <span>{displayValue === true ? 'VERIFIED' : displayValue === false ? 'FAILED' : displayValue}</span>
    </span>
  );
}
