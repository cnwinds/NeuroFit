import React from 'react';

interface PageNavigatorProps {
  patternLength: number;
  currentPage: number;
  isPlaying: boolean;
  currentStep: number;
  onPageChange: (page: number) => void;
}

/**
 * 分页导航器组件
 * 用于显示和切换节拍编辑器的页面
 */
const PageNavigator: React.FC<PageNavigatorProps> = ({
  patternLength,
  currentPage,
  isPlaying,
  currentStep,
  onPageChange,
}) => {
  const totalPages = Math.ceil(patternLength / 4);

  return (
    <div className="flex items-center gap-1 p-0.5 bg-white/5 rounded-lg border border-white/5 w-full sm:w-auto overflow-x-auto no-scrollbar">
      {Array.from({ length: totalPages }).map((_, idx) => {
        const isCurrentPage = currentPage === idx;
        const hasActiveInPage = isPlaying && Math.floor(currentStep / 4) === idx;

        return (
          <button
            key={idx}
            onClick={() => onPageChange(idx)}
            className={`flex-1 sm:flex-none px-2 py-1.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase transition-all whitespace-nowrap leading-tight ${
              isCurrentPage
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/10'
                : 'bg-white/5 text-white/30 hover:bg-white/10'
            } ${
              hasActiveInPage
                ? 'ring-2 ring-teal-400 ring-offset-1 ring-offset-[#020617]'
                : ''
            }`}
          >
            Page {idx + 1}
          </button>
        );
      })}
    </div>
  );
};

export default PageNavigator;


