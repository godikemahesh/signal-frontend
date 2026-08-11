import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Signal, Entity, BehaviorInsight, ChatMessage, initialSignals, mockEntities, mockBehaviorInsights, mockChatHistory, promptResponses } from '../lib/data';
import { LiveIndicator } from './LiveIndicator';
import { OverviewScreen } from './OverviewScreen';
import { FocusScreen } from './FocusScreen';
import { TimelineScreen } from './TimelineScreen';
import { BehaviorScreen } from './BehaviorScreen';
import { AskSignalScreen } from './AskSignalScreen';
import { SignalDetailModal } from './SignalDetailModal';
import { Radio, LogOut, LayoutDashboard, Target, Activity, Brain, MessageSquare, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface AppShellProps {
  onLogout: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'focus' | 'timeline' | 'behavior' | 'ask'>('overview');
  const [signals, setSignals] = useState<Signal[]>(initialSignals);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(mockChatHistory);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // Compute live stats for stats bar
  const newCount = signals.filter((s) => s.status === 'new').length;
  const changedCount = signals.filter((s) => s.status === 'changed').length;
  const archivedCount = signals.filter((s) => s.bucket === 'ignored' || s.bucket === 'completed').length + 29;

  const handleMoveBucket = (id: string, newBucket: Signal['bucket']) => {
    setSignals((prev) =>
      prev.map((s) => (s.id === id ? { ...s, bucket: newBucket, updatedAt: new Date().toISOString() } : s))
    );
  };

  const handleAction = (id: string, actionName: string) => {
    console.log(`Action executed: ${actionName} on signal ${id}`);
    const sig = signals.find((s) => s.id === id);
    if (sig) {
      alert(`Successfully triggered "${actionName}" for "${sig.subject}".`);
    }
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setIsThinking(true);

    setTimeout(() => {
      const matchedResponse = promptResponses[text] ||
        `I searched across your 147 signals and found relevant information regarding "${text}".\n\nBased on your current state, the most relevant items are your Google assessment (due today) and Stripe interview scheduling. Would you like me to take action on these?`;

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: matchedResponse,
        timestamp: new Date().toISOString(),
      };

      setChatHistory((prev) => [...prev, aiMsg]);
      setIsThinking(false);
    }, 700);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'focus', label: 'Focus', icon: <Target className="w-4 h-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <Activity className="w-4 h-4" /> },
    { id: 'behavior', label: 'Behavior', icon: <Brain className="w-4 h-4" /> },
    { id: 'ask', label: 'Ask Signal', icon: <MessageSquare className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500/20 flex flex-col md:flex-row">
      {/* Left Sidebar Navigation for Desktop */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 text-white shrink-0 flex flex-col justify-between p-4 md:h-screen md:sticky md:top-0 z-40">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Radio className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold tracking-tight text-white">Signal</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                    Executive AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Personal AI Assistant</p>
              </div>
            </div>

            {/* Mobile Logout / Live Indicator */}
            <div className="md:hidden flex items-center gap-2">
              <LiveIndicator onSync={handleSync} isSyncing={isSyncing} />
              <button
                onClick={onLogout}
                title="Disconnect Gmail"
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sidebar Navigation Items */}
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 no-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer w-full text-left",
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                  )}
                >
                  <span className={isActive ? "text-white" : "text-slate-400"}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer / Account & Actions */}
        <div className="hidden md:block pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <LiveIndicator onSync={handleSync} isSyncing={isSyncing} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                M
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-200">Mahesh</p>
                <p className="text-[10px] text-slate-400">Gmail Connected</p>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Disconnect Gmail"
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full overflow-y-auto">
        {/* Metric Cards / Stats Pills Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Needs Action</p>
              <p className="text-lg font-bold text-rose-600 mt-0.5">{newCount} <span className="text-xs font-normal text-slate-400">new</span></p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 font-bold text-xs">
              🔥
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Updates</p>
              <p className="text-lg font-bold text-blue-600 mt-0.5">{changedCount} <span className="text-xs font-normal text-slate-400">changed</span></p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              ⚡
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Filtered</p>
              <p className="text-lg font-bold text-slate-700 mt-0.5">{archivedCount} <span className="text-xs font-normal text-slate-400">archived</span></p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
              🛡️
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">AI Efficiency</p>
              <p className="text-xs font-bold text-slate-800 mt-1">147 signals → 4 decisions</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Tab Content View */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <OverviewScreen
              key="overview"
              signals={signals}
              onMoveBucket={handleMoveBucket}
              onAction={handleAction}
              onOpenDetail={(sig) => setSelectedSignal(sig)}
            />
          )}

          {activeTab === 'focus' && (
            <FocusScreen
              key="focus"
              signals={signals}
              onMoveBucket={handleMoveBucket}
              onAction={handleAction}
              onOpenDetail={(sig) => setSelectedSignal(sig)}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineScreen
              key="timeline"
              entities={mockEntities}
            />
          )}

          {activeTab === 'behavior' && (
            <BehaviorScreen
              key="behavior"
              insights={mockBehaviorInsights}
            />
          )}

          {activeTab === 'ask' && (
            <AskSignalScreen
              key="ask"
              chatHistory={chatHistory}
              onSendMessage={handleSendMessage}
              isThinking={isThinking}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Signal Detail Modal */}
      <SignalDetailModal
        signal={selectedSignal}
        onClose={() => setSelectedSignal(null)}
        onMoveBucket={handleMoveBucket}
        onAction={handleAction}
      />
    </div>
  );
};
