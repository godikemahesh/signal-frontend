import React from 'react';
import { motion } from 'motion/react';
import { Signal } from '../lib/data';
import { SectionHeader } from './SectionHeader';
import { SignalCard } from './SignalCard';
import { CheckCircle } from 'lucide-react';

interface OverviewScreenProps {
  signals: Signal[];
  onMoveBucket: (id: string, newBucket: Signal['bucket']) => void;
  onAction: (id: string, actionName: string) => void;
  onOpenDetail: (signal: Signal) => void;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  signals,
  onMoveBucket,
  onAction,
  onOpenDetail
}) => {
  // Filter signals according to Overview categories
  const needsActionSignals = signals.filter(
    (s) => s.id === '1' || s.id === '2' || (s.bucket === 'do-now' && s.bucket !== 'completed')
  );

  const changedSignals = signals.filter(
    (s) => s.id === '3' || (s.status === 'changed' && s.bucket !== 'do-now')
  );

  const dueSoonSignals = signals.filter(
    (s) => s.id === '4' || (s.deadlineText?.includes('Due') && s.bucket !== 'do-now' && s.id !== '2')
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Hero Section */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              hey, Mahesh.
            </h1>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-md border border-blue-100 uppercase tracking-wider">
              Executive View
            </span>
          </div>
          <p className="text-sm text-slate-600 font-medium">
            Since your last visit, <strong className="text-slate-900">3 things</strong> require executive decision or reply.
          </p>
        </div>
      </div>

      {/* Section: 🔥 Needs Action */}
      <div>
        <SectionHeader
          title="Needs action"
          color="#E11D48"
          count={needsActionSignals.length}
        />
        <div className="space-y-3">
          {needsActionSignals.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              onMoveBucket={onMoveBucket}
              onAction={onAction}
              onOpenDetail={onOpenDetail}
              primaryButtonText={signal.id === '1' ? 'Reply now' : signal.id === '2' ? 'Start now' : undefined}
              secondaryButtonText={signal.id === '1' ? 'Suggest slots' : signal.id === '2' ? 'Snooze 1h' : undefined}
            />
          ))}
        </div>
      </div>

      {/* Section: ⚡ Changed */}
      <div>
        <SectionHeader
          title="Changed since you last checked"
          color="#2563EB"
          count={changedSignals.length}
        />
        <div className="space-y-3">
          {changedSignals.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              onMoveBucket={onMoveBucket}
              onAction={onAction}
              onOpenDetail={onOpenDetail}
              secondaryButtonText="Track package"
            />
          ))}
        </div>
      </div>

      {/* Section: 💳 Due Soon */}
      <div>
        <SectionHeader
          title="Due soon"
          color="#D97706"
          count={dueSoonSignals.length}
        />
        <div className="space-y-3">
          {dueSoonSignals.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              onMoveBucket={onMoveBucket}
              onAction={onAction}
              onOpenDetail={onOpenDetail}
              primaryButtonText="Pay now"
              secondaryButtonText="Remind tonight"
            />
          ))}
        </div>
      </div>

      {/* Section: 📥 Handled Automatically */}
      <div>
        <SectionHeader
          title="Handled automatically"
          color="#64748B"
        />
        <div className="rounded-xl bg-white border border-slate-200/90 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between text-sm text-slate-700 hover:text-slate-900 transition-colors py-0.5">
            <span className="flex items-center gap-2.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              34 newsletters summarized
            </span>
            <span className="text-xs text-slate-500 font-mono font-semibold">→ 2 min read</span>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-700 hover:text-slate-900 transition-colors py-0.5">
            <span className="flex items-center gap-2.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
              12 marketing emails archived
            </span>
            <span className="text-xs text-slate-500 font-semibold">Auto-filtered</span>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-700 hover:text-slate-900 transition-colors py-0.5">
            <span className="flex items-center gap-2.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              6 GitHub notifications (none critical)
            </span>
            <span className="text-xs text-slate-500 font-semibold">Non-blocking</span>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-700 hover:text-slate-900 transition-colors py-0.5">
            <span className="flex items-center gap-2.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
              3 Flipkart offers archived (you ignore these)
            </span>
            <span className="text-xs text-slate-500 font-semibold">Behavior matched</span>
          </div>
        </div>
      </div>

      {/* Calming Footer */}
      <div className="mt-8 p-4 rounded-xl bg-slate-100/90 border border-slate-200 text-center shadow-2xs">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Nothing else needs your attention. All systems clear.</span>
        </div>
      </div>
    </motion.div>
  );
};
