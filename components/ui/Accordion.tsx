import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
}

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  icon,
}: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 bg-slate-800 hover:bg-slate-750 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center space-x-3">
          {icon && <span className="text-cyan-400">{icon}</span>}
          <h3 className="font-semibold text-white text-left">{title}</h3>
        </div>
        <ChevronDown
          size={20}
          className={`text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-slate-700/30 border-t border-slate-700 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

interface AccordionProps {
  children: React.ReactNode;
  className?: string;
}

export function Accordion({ children, className = "" }: AccordionProps) {
  return <div className={`space-y-3 ${className}`}>{children}</div>;
}
