import React, { useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import {
  formatShortDay,
  formatDateToISO,
  formatFriendlyDate,
  getWorkingDaysList,
} from '../utils/dateUtils';

interface DateCarouselProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const DateCarousel: React.FC<DateCarouselProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayISO = formatDateToISO(new Date());

  const workingDays = React.useMemo(() => {
    return getWorkingDaysList(new Date(), 25);
  }, []);

  const handlePrev = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const selectedEl = document.getElementById(`date-chip-${selectedDate}`);
    if (selectedEl && scrollRef.current) {
      selectedEl.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [selectedDate]);

  return (
    <div className="w-full">
      {/* Date Header Info */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#E60026] dark:text-[#FF2B4D]" />
          <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
            {formatFriendlyDate(selectedDate)}
          </span>
          {selectedDate === todayISO && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#E60026]/15 text-[#E60026] dark:text-[#FF2B4D] border border-[#E60026]/30 dark:border-[#FF2B4D]/30">
              Hoje
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {selectedDate !== todayISO && (
            <button
              onClick={() => onSelectDate(todayISO)}
              className="text-[11px] font-black text-[#E60026] dark:text-[#FF2B4D] hover:underline px-2.5 py-1 rounded-xl neu-btn"
            >
              Ir para Hoje
            </button>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-xl neu-btn text-[var(--text-secondary)] hover:text-[#E60026] dark:hover:text-[#FF2B4D]"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-xl neu-btn text-[var(--text-secondary)] hover:text-[#E60026] dark:hover:text-[#FF2B4D]"
              title="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Days Strip */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto py-2 px-1 no-scrollbar scroll-smooth"
      >
        {workingDays.map((dateStr) => {
          const { dayName, dayNumber, isToday } = formatShortDay(dateStr);
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={dateStr}
              id={`date-chip-${dateStr}`}
              onClick={() => onSelectDate(dateStr)}
              className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[62px] sm:min-w-[72px] py-2.5 px-2 rounded-2xl transition-all select-none relative ${
                isSelected
                  ? 'neu-pressed text-[#E60026] dark:text-[#FF2B4D] border-2 border-[#E60026]/50 dark:border-[#FF2B4D]/50 shadow-inner'
                  : 'neu-btn text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {isToday && (
                <span className="absolute -top-1 w-2 h-2 rounded-full bg-[#E60026] dark:bg-[#FF2B4D]" />
              )}
              <span
                className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider ${
                  isSelected ? 'text-[#E60026] dark:text-[#FF2B4D]' : 'text-[var(--text-secondary)]'
                }`}
              >
                {dayName}
              </span>
              <span
                className={`text-base sm:text-lg font-black mt-0.5 leading-none ${
                  isSelected ? 'text-[#E60026] dark:text-[#FF2B4D] scale-110' : 'text-[var(--text-primary)]'
                }`}
              >
                {dayNumber}
              </span>
              {isSelected && (
                <span className="w-4 h-1 rounded-full bg-[#E60026] dark:bg-[#FF2B4D] mt-1.5 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
