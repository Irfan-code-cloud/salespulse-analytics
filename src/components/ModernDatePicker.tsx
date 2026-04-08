import React, { useState, useRef, useEffect } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ModernDatePickerProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  disabled?: boolean;
  align?: 'left' | 'right';
}

export const ModernDatePicker: React.FC<ModernDatePickerProps> = React.memo(({ label, value, onChange, disabled, align = 'left' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? parseISO(value) : undefined;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full z-50", disabled && "opacity-50 pointer-events-none")} ref={containerRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex flex-col sm:flex-row sm:items-center gap-[0.125rem] sm:gap-[0.75rem] bg-white border border-transparent rounded-[0.75rem] shadow-sm px-[0.75rem] sm:px-[1rem] py-[0.5rem] sm:py-[0.75rem] cursor-pointer transition-all hover:border-[#141414]/10",
          isOpen && "ring-2 ring-[#141414]/5 border-[#141414]/10",
          disabled && "cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-[0.375rem] flex-shrink-0">
          <CalendarIcon className="w-[0.875rem] h-[0.875rem] sm:w-[1rem] sm:h-[1rem] text-[#141414]/60" />
          <span className="text-[0.6rem] sm:text-[0.7rem] font-bold uppercase tracking-widest text-[#141414]/60 hidden xl:inline">{label}</span>
        </div>
        <div className="text-[0.75rem] sm:text-[0.875rem] font-bold text-[#141414] truncate">
          {selectedDate && isValid(selectedDate) ? format(selectedDate, 'MMM d, yyyy') : 'Select'}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "absolute z-[9999] top-full mt-[0.25rem] bg-white border border-[#141414]/10 rounded-[1rem] shadow-2xl p-[0.25rem] sm:p-[0.5rem] w-max max-w-[calc(100vw-2rem)]",
              align === "right" ? "right-0" : "left-0"
            )}
          >
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  onChange(format(date, 'yyyy-MM-dd'));
                  setIsOpen(false);
                }
              }}
              captionLayout="dropdown-buttons"
              fromYear={2020}
              toYear={2040}
              className="m-0"
              modifiersClassNames={{
                selected: "bg-[#141414] text-white rounded-full",
                today: "text-[#F27D26] font-bold"
              }}
              styles={{
                head_cell: { color: '#14141440', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', padding: '0.25rem' },
                day: { borderRadius: '100%', transition: 'all 0.2s', width: '2rem', height: '2rem', fontSize: '0.75rem' },
                table: { borderCollapse: 'separate', borderSpacing: '0.125rem' }
              }}
            />
            <div className="mt-[0.5rem] pt-[0.75rem] border-t border-[#141414]/5 flex gap-[0.5rem]">
              <button 
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="flex-1 py-[0.5rem] text-[0.75rem] font-bold text-[#141414]/40 bg-[#141414]/5 rounded-[0.5rem] hover:text-[#141414] transition-colors"
              >
                Clear
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="flex-1 py-[0.5rem] text-[0.75rem] font-bold text-white bg-[#141414] rounded-[0.5rem] hover:opacity-90 transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
