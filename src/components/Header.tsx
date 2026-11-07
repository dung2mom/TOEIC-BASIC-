import React from 'react';
import { Volume2, VolumeX, User, BookOpen, PenTool, Award, Sparkles, Gamepad2 } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface HeaderProps {
  currentTab: 'quiz' | 'wrongNotes' | 'cheatsheet' | 'stats';
  onSelectTab: (tab: 'quiz' | 'wrongNotes' | 'cheatsheet' | 'stats') => void;
  nickname: string;
  onOpenNicknameModal: () => void;
  wrongNotesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  nickname,
  onOpenNicknameModal,
  wrongNotesCount,
}) => {
  const [isMuted, setIsMuted] = React.useState<boolean>(soundManager.getMuted());

  const handleToggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setMuted(nextMuted);
    if (!nextMuted) {
      soundManager.playTick();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-lg md:max-w-4xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
        {/* Brand Wordmark */}
        <button
          onClick={() => onSelectTab('quiz')}
          className="flex items-center gap-2 text-left shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl py-1 px-1 cursor-pointer"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs font-black text-sm tracking-tighter group-hover:from-indigo-700 group-hover:to-violet-700 transition-colors">
            <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 whitespace-nowrap">
              TOEIC with Game
            </span>
            <span className="text-[10px] text-indigo-600 font-bold -mt-1 hidden sm:block">
              초급 Part 5 10초 스피드런
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <button
            onClick={() => onSelectTab('quiz')}
            className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'quiz'
                ? 'text-indigo-600 font-black border-b-2 border-indigo-600'
                : 'hover:text-slate-900'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>실전 10초 풀이</span>
          </button>

          <button
            onClick={() => onSelectTab('wrongNotes')}
            className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'wrongNotes'
                ? 'text-indigo-600 font-black border-b-2 border-indigo-600'
                : 'hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>오답 노트</span>
            {wrongNotesCount > 0 && (
              <span className="text-xs font-bold tabular-nums text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">
                {wrongNotesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('cheatsheet')}
            className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'cheatsheet'
                ? 'text-indigo-600 font-black border-b-2 border-indigo-600'
                : 'hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>3초 공식 치트시트</span>
          </button>

          <button
            onClick={() => onSelectTab('stats')}
            className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'stats'
                ? 'text-indigo-600 font-black border-b-2 border-indigo-600'
                : 'hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>학습 리포트</span>
          </button>
        </nav>

        {/* Profile Info & Sound */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={handleToggleSound}
            aria-label={isMuted ? '음소거 해제' : '음소거'}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            title={isMuted ? '효과음 켜기' : '효과음 끄기'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-indigo-600" />}
          </button>

          <button
            onClick={onOpenNicknameModal}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
            title="학습자 이름 변경"
          >
            <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="max-w-[100px] truncate">{nickname || '이름 등록'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
