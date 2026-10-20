import React, { useState, useEffect, useRef } from 'react';
import { Character, CharacterDialogueNode } from '../../types/game';
import { playClickSound, playCoinSound, playCompanionChirp } from '../../utils/audio';

interface CharacterDialogueModalProps {
  character: Character;
  onClose: () => void;
  onRewardClaimed: (credits: number, reason: string) => void;
  onStartDungeon?: () => void;
  claimedSecrets: string[];
  onMarkSecretClaimed: (secretKey: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'character' | 'player';
  text: string;
  timestamp: string;
}

export const CharacterDialogueModal: React.FC<CharacterDialogueModalProps> = ({
  character,
  onClose,
  onRewardClaimed,
  onStartDungeon,
  claimedSecrets,
  onMarkSecretClaimed,
}) => {
  const [currentNodeId, setCurrentNodeId] = useState<string>('root');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentNode: CharacterDialogueNode =
    character.dialogueTree[currentNodeId] || character.dialogueTree['root'];

  // Initialize chat greeting
  useEffect(() => {
    setMessages([
      {
        id: 'msg_init',
        sender: 'character',
        text: character.dialogueGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    if (voiceEnabled) {
      speakText(character.dialogueGreeting);
    }
  }, [character]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingAi]);

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = character.voicePitch || 1.0;
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSelectOption = (opt: CharacterDialogueNode['options'][0]) => {
    playClickSound();

    // 1. Add player message to history
    const playerMsg: ChatMessage = {
      id: `p_${Date.now()}`,
      sender: 'player',
      text: opt.label,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, playerMsg]);

    // Check special actions
    if (opt.action === 'claim_secret_reward' && opt.rewardCredits) {
      const secretKey = `${character.id}_${currentNodeId}`;
      if (!claimedSecrets.includes(secretKey)) {
        onRewardClaimed(opt.rewardCredits, `Secret Lore with ${character.name}`);
        onMarkSecretClaimed(secretKey);
        playCoinSound();
      }
    } else if (opt.action === 'start_dungeon' && onStartDungeon) {
      onClose();
      onStartDungeon();
      return;
    } else if (opt.action === 'close') {
      onClose();
      return;
    }

    // 2. Advance dialogue node
    const targetNodeId = opt.nextNodeId || 'root';
    setCurrentNodeId(targetNodeId);

    const nextNode = character.dialogueTree[targetNodeId];
    if (nextNode) {
      setTimeout(() => {
        const charMsg: ChatMessage = {
          id: `c_${Date.now()}`,
          sender: 'character',
          text: nextNode.speakerText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, charMsg]);
        if (voiceEnabled) speakText(nextNode.speakerText);
      }, 400);
    }
  };

  // AI-Powered Conversation (calling /api/chat)
  const handleSendCustomMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim() || isLoadingAi) return;

    const userInput = customInput.trim();
    setCustomInput('');

    const playerMsg: ChatMessage = {
      id: `p_${Date.now()}`,
      sender: 'player',
      text: userInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, playerMsg]);
    setIsLoadingAi(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName: character.name,
          characterUniverse: character.universe,
          bio: character.bio,
          catchphrase: character.signatureCatchphrase,
          message: userInput,
        }),
      });

      if (!res.ok) throw new Error('API offline');
      const data = await res.json();
      const reply = data.reply || `${character.signatureCatchphrase} (The cosmos vibrates with your inquiry, Hunter!)`;

      const charMsg: ChatMessage = {
        id: `c_${Date.now()}`,
        sender: 'character',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, charMsg]);
      if (voiceEnabled) speakText(reply);
    } catch {
      // Graceful fallback to rich in-universe response
      const fallbackReplies = [
        `*${character.name} nods with acute focus* "A fascinating observation! ${character.signatureCatchphrase} Keep training your mind, Hunter."`,
        `"In the realm of ${character.universe}, questions like that lead directly into legendary dungeon quests! Shall we test your reflexes on the board?"`,
        `"Our mana frequency connects deeply. Keep climbing the ranks from Beginner to Sovereign!"`,
      ];
      const fallback = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];

      const charMsg: ChatMessage = {
        id: `c_${Date.now()}`,
        sender: 'character',
        text: fallback,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, charMsg]);
      if (voiceEnabled) speakText(fallback);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const secretKey = `${character.id}_${currentNodeId}`;
  const isSecretClaimed = claimedSecrets.includes(secretKey);

  return (
    <div className="fixed inset-0 z-50 bg-[#060814]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 font-sans">
      <div className="max-w-2xl w-full h-[90vh] max-h-[720px] bg-[#0b0f26] border-2 border-purple-800/70 rounded-2xl flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header Bar */}
        <div className="bg-[#10163a] px-4 py-3 border-b border-purple-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-2xl shadow">
              {character.avatarIcon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold font-orbitron text-white text-sm sm:text-base">
                  {character.name}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-orbitron uppercase tracking-wider font-bold bg-purple-900/70 text-purple-300 border border-purple-700/50">
                  {character.rarity}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono-code">{character.universe}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Voice synth toggle */}
            <button
              onClick={() => {
                const next = !voiceEnabled;
                setVoiceEnabled(next);
                if (next) speakText("Voice synthesis enabled.");
              }}
              className={`p-2 rounded-xl text-xs font-orbitron flex items-center gap-1 border transition cursor-pointer ${
                voiceEnabled
                  ? 'bg-purple-600 text-white border-purple-400'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Toggle character voice reading"
            >
              <span>{voiceEnabled ? '🔊' : '🔈'}</span>
              <span className="hidden sm:inline">Voice</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition cursor-pointer text-sm"
              aria-label="Close conversation"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Disclaimer banner as instructed */}
        <div className="bg-[#0e1333] px-4 py-1.5 border-b border-slate-800 text-[10px] text-purple-300/80 font-mono-code flex items-center justify-between">
          <span>✨ Fictional Character Roleplay Simulation · Powered by CreditVerse Engine</span>
          <span className="text-amber-400 font-bold">{character.title}</span>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-[#0b0f26] to-[#080b1e]">
          {messages.map((m) => {
            const isChar = m.sender === 'character';
            return (
              <div
                key={m.id}
                className={`flex items-start gap-2.5 ${isChar ? 'justify-start' : 'justify-end'}`}
              >
                {isChar && (
                  <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-500/40 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                    {character.avatarIcon}
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                    isChar
                      ? 'bg-[#151c44] text-slate-100 border border-purple-900/60'
                      : 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-medium'
                  }`}
                >
                  <p>{m.text}</p>
                  <span
                    className={`block text-[9px] mt-1 font-mono-code ${
                      isChar ? 'text-slate-400' : 'text-purple-200 text-right'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoadingAi && (
            <div className="flex items-center gap-2 text-xs text-purple-400 font-mono-code animate-pulse">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <span>{character.name} is formulating a cosmic response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Interactive Dialogue Options Tray */}
        <div className="p-3 bg-[#0d122e] border-t border-purple-900/50">
          <div className="text-[11px] font-orbitron text-slate-400 mb-2 flex items-center justify-between">
            <span>DIALOGUE CHOICES</span>
            <span className="text-[10px] text-purple-400">Select to explore lore or earn secrets</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 max-h-36 overflow-y-auto pr-1">
            {currentNode.options.map((opt, idx) => {
              const isSecretOption = opt.action === 'claim_secret_reward';
              const alreadyClaimed = isSecretOption && isSecretClaimed;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(opt)}
                  disabled={alreadyClaimed}
                  className={`text-left p-2.5 rounded-xl border text-xs transition cursor-pointer font-medium flex items-center justify-between ${
                    isSecretOption
                      ? alreadyClaimed
                        ? 'border-slate-800 bg-slate-900/50 text-slate-500 cursor-not-allowed'
                        : 'border-amber-500/70 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40'
                      : 'border-purple-800/50 bg-[#141b42] text-purple-200 hover:bg-[#1f275e] hover:border-purple-500'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSecretOption && (
                    <span className="text-[10px] font-bold font-mono-code text-amber-400 ml-2 whitespace-nowrap">
                      {alreadyClaimed ? '✓ Claimed' : `+${opt.rewardCredits} CR`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom User Chat Form */}
          <form onSubmit={handleSendCustomMessage} className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder={`Ask ${character.name} anything about lore, exams, or training...`}
              className="flex-1 bg-[#151c44] border border-purple-900/60 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={isLoadingAi || !customInput.trim()}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-orbitron font-bold text-xs rounded-xl shadow cursor-pointer"
            >
              SEND
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
