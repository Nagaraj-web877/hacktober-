import React, { useState } from 'react';
import { evaluateCode } from '../../game/economy';
import { playCoinSound, playLevelUpSound, playHitSound, playClickSound } from '../../utils/audio';

interface CampusQuestsViewProps {
  claimedCodes: string[];
  onRedeemCode: (code: string, credits: number, title: string) => void;
  onCompleteCampusQuest: (questId: string, credits: number, xp: number, title: string) => void;
  completedQuests: string[];
}

export const CampusQuestsView: React.FC<CampusQuestsViewProps> = ({
  claimedCodes,
  onRedeemCode,
  onCompleteCampusQuest,
  completedQuests,
}) => {
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [redeemFeedback, setRedeemFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const CAMPUS_QUESTS = [
    {
      id: 'quest_git_commit',
      title: 'Hacktoberfest: Git Mastery',
      category: 'Open Source',
      description: 'Clone the campus open source repository and submit your first verified documentation pull request.',
      rewardCredits: 40,
      rewardXP: 100,
      icon: '🐙',
    },
    {
      id: 'quest_cloud_deploy',
      title: 'Google Cloud Run Sprint',
      category: 'Cloud Engineering',
      description: 'Deploy a containerized microservice to Google Cloud Run with continuous deployment pipeline configured.',
      rewardCredits: 50,
      rewardXP: 120,
      icon: '☁️',
    },
    {
      id: 'quest_flutter_ui',
      title: 'Flutter Mobile Speedrun',
      category: 'App Dev',
      description: 'Build a smooth cross-platform widget layout supporting dark mode and responsive desktop layout.',
      rewardCredits: 35,
      rewardXP: 90,
      icon: '📱',
    },
    {
      id: 'quest_ai_studio',
      title: 'Google AI Studio Prompt Craft',
      category: 'Generative AI',
      description: 'Design structured system instructions and function calling tools using the Gemini 3.8 Flash model.',
      rewardCredits: 60,
      rewardXP: 150,
      icon: '✨',
    },
  ];

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    const evaluation = evaluateCode(promoCodeInput, claimedCodes);
    if (evaluation.valid) {
      playLevelUpSound();
      playCoinSound();
      setRedeemFeedback({
        success: true,
        message: `🎉 Success! Redeemed "${evaluation.title}" for +${evaluation.credits} Credits!`,
      });
      onRedeemCode(promoCodeInput.trim().toUpperCase(), evaluation.credits, evaluation.title);
      setPromoCodeInput('');
    } else {
      playHitSound();
      setRedeemFeedback({
        success: false,
        message: `⚠️ ${evaluation.error || 'Failed to redeem code'}`,
      });
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#0d1c3a] via-[#111936] to-[#071329] border border-blue-600/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🌐</span>
              <h2 className="text-2xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-cyan-300">
                GDG ON CAMPUS QUESTS & AIRDROPS
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">
              Connect your college tech journey with CreditVerse. Complete hackathon milestones,
              build open-source projects, and redeem exclusive event badges!
            </p>
          </div>

          <div className="bg-[#0b102b] border border-blue-500/50 rounded-xl px-4 py-2 text-right">
            <span className="text-[10px] font-orbitron text-blue-300 block uppercase">
              Community Chapter
            </span>
            <span className="text-sm font-bold font-orbitron text-white">
              Google Developer Groups
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Redeem Airdrop Code & Quests List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Event Promo Code Box */}
        <div className="bg-[#0b0f24] border border-blue-900/60 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold font-orbitron text-white mb-1 flex items-center gap-2">
              <span>🎟️</span>
              <span>Campus Airdrop Voucher</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter codes distributed at GDG meetups, workshops, and hackathons.
            </p>

            {/* Starter Promo Codes Hint Box */}
            <div className="bg-[#101738] p-3 rounded-xl border border-slate-800 text-[11px] font-mono-code text-cyan-300 mb-4 space-y-1">
              <div className="font-bold text-slate-400 font-orbitron text-[10px]">
                SAMPLE AIRDROP CODES TO TEST:
              </div>
              <div>• <span className="text-amber-300 font-bold">GDGOC2026</span> (+100 CR)</div>
              <div>• <span className="text-amber-300 font-bold">HACKFEST</span> (+150 CR)</div>
              <div>• <span className="text-amber-300 font-bold">CREDITVERSE</span> (+200 CR)</div>
            </div>

            <form onSubmit={handleRedeem} className="space-y-3 mb-4">
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
                placeholder="Enter event code..."
                className="w-full bg-[#12183b] border border-blue-900/60 rounded-xl px-3.5 py-2.5 text-xs text-white uppercase font-mono-code tracking-wider focus:outline-none focus:border-blue-500"
              />

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-orbitron font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                REDEEM AIRDROP
              </button>
            </form>

            {redeemFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-mono-code text-center border ${
                  redeemFeedback.success
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-500 text-rose-300'
                }`}
              >
                {redeemFeedback.message}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-purple-950 text-[10px] text-slate-500 font-mono-code">
            Total Claimed Codes: {claimedCodes.length}
          </div>
        </div>

        {/* Right 2 Cols: Campus Hackathon & Coding Quests */}
        <div className="lg:col-span-2 bg-[#0b0f24] border border-blue-900/60 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold font-orbitron text-white">
                Tech & Hackathon Missions
              </h3>
              <p className="text-xs text-slate-400">
                Sharpen software engineering skills and build for the campus community.
              </p>
            </div>
            <span className="text-xs font-mono-code text-blue-400 font-bold">
              {completedQuests.length} / {CAMPUS_QUESTS.length} Cleared
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CAMPUS_QUESTS.map((quest) => {
              const isDone = completedQuests.includes(quest.id);

              return (
                <div
                  key={quest.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                    isDone
                      ? 'bg-[#090d21] border-emerald-800/40 opacity-80'
                      : 'bg-[#12183b] border-slate-800 hover:border-blue-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{quest.icon}</span>
                      <div className="flex items-center gap-1.5 text-xs font-mono-code font-bold">
                        <span className="text-amber-400">+{quest.rewardCredits} CR</span>
                        <span className="text-purple-400">+{quest.rewardXP} XP</span>
                      </div>
                    </div>

                    <h4 className="font-bold text-white text-xs font-orbitron mb-1">
                      {quest.title}
                    </h4>
                    <span className="text-[10px] text-blue-400 font-mono-code block mb-2">
                      {quest.category}
                    </span>
                    <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
                      {quest.description}
                    </p>
                  </div>

                  <div>
                    {isDone ? (
                      <div className="text-xs font-orbitron font-bold text-emerald-400 flex items-center gap-1">
                        <span>✓</span>
                        <span>QUEST VERIFIED</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          playLevelUpSound();
                          playCoinSound();
                          onCompleteCampusQuest(
                            quest.id,
                            quest.rewardCredits,
                            quest.rewardXP,
                            quest.title
                          );
                        }}
                        className="w-full py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-orbitron font-bold text-xs rounded-xl shadow cursor-pointer text-center"
                      >
                        SUBMIT VERIFICATION
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
