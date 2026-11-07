import React, { useState } from 'react';
import { User, X, Check, Sparkles } from 'lucide-react';

interface NicknameModalProps {
  isOpen: boolean;
  currentNickname: string;
  isFirstTime?: boolean;
  onSave: (nickname: string) => void;
  onClose: () => void;
}

const SUGGESTED_NAMES = [
  '홍길동',
  '1반김토익',
  '열공학생',
  '토익700가자',
  '단어마스터',
  '초급탈출기',
];

export const NicknameModal: React.FC<NicknameModalProps> = ({
  isOpen,
  currentNickname,
  isFirstTime = false,
  onSave,
  onClose,
}) => {
  const [nicknameInput, setNicknameInput] = useState(currentNickname || '');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nicknameInput.trim();
    if (!trimmed) {
      setErrorMsg('학습자 이름을 입력해 주세요.');
      return;
    }
    if (trimmed.length > 20) {
      setErrorMsg('이름은 최대 20자까지 가능합니다.');
      return;
    }
    setErrorMsg('');
    onSave(trimmed);
    onClose();
  };

  const handlePickSuggestion = (suggestion: string) => {
    setNicknameInput(suggestion);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm sm:max-w-md w-full overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                {isFirstTime ? '학습자 이름 등록' : '학습자 이름 변경'}
              </h2>
            </div>
            {!isFirstTime && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="mt-4">
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {isFirstTime ? (
                <>
                  반갑습니다! 문제 풀이를 시작하기 전에
                  <strong className="text-indigo-600 font-bold"> 학습자 이름(학생 이름/학번)</strong>을 등록해 주세요.
                </>
              ) : (
                '학습자 이름을 수정하시면 기존 오답 노트와 통계 기록이 그대로 유지됩니다.'
              )}
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="nickname" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  학습자 이름 (최대 20자)
                </label>
                <div className="relative">
                  <input
                    id="nickname"
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => {
                      setNicknameInput(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="예: 홍길동, 2학년 3반 김토익"
                    autoFocus
                    maxLength={20}
                    className="w-full px-4 py-3.5 text-slate-900 text-base sm:text-lg bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all font-bold"
                  />
                </div>
                {errorMsg && (
                  <p className="mt-2 text-xs sm:text-sm text-rose-600 font-bold">
                    {errorMsg}
                  </p>
                )}
              </div>

              {/* Suggestions */}
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>예시 클릭해서 빠른 입력:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_NAMES.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handlePickSuggestion(name)}
                      className="text-xs sm:text-sm px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-semibold transition-colors cursor-pointer"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                {!isFirstTime && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-3 text-sm text-slate-600 hover:text-slate-800 font-bold transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                )}
                <button
                  type="submit"
                  className="w-full py-3.5 px-5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-base font-black rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-5 h-5" />
                  <span>{isFirstTime ? '등록하고 시작하기' : '저장 완료'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
