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
}

export const ModernDatePicker: React.FC<ModernDatePickerProps> = React.memo(({ label, value, onChange, disabled }) => {
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
          "flex flex-col sm:flex-row sm:items-center gap-[0.25rem] sm:gap-[0.75rem] bg-white border border-transparent rounded-[0.5rem] shadow-sm px-[1rem] py-[0.75rem] cursor-pointer transition-all hover:border-[#141414]/10",
          isOpen && "ring-2 ring-[#141414]/5 border-[#141414]/10",
          disabled && "cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-[0.5rem] flex-shrink-0">
          <CalendarIcon className="w-[1rem] h-[1rem] opacity-40" />
          <span className="text-[0.65rem] sm:text-[0.7rem] font-bold uppercase tracking-widest text-[#141414]/40">{label}</span>
        </div>
        <div className="text-[0.8rem] sm:text-[0.875rem] font-medium text-[#141414] truncate">
          {selectedDate && isValid(selectedDate) ? format(selectedDate, 'MMM d, yyyy') : 'Select date'}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-[1000] top-full left-0 mt-[0.5rem] bg-white border border-[#141414]/10 rounded-[1rem] shadow-xl p-[1rem]"
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
                head_cell: { color: '#14141440', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' },
                day: { borderRadius: '100%', transition: 'all 0.2s' },
              }}
            />
            <div className="mt-[0.5rem] pt-[0.5rem] border-t border-[#141414]/5 flex justify-between items-center">
              <button 
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="text-[0.75rem] font-bold text-[#141414]/40 hover:text-[#141414] transition-colors"
              >
                Clear
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-[0.75rem] font-bold text-[#141414] hover:opacity-70 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
