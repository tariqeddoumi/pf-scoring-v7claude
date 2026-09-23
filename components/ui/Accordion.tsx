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
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 bg-card hover:bg-surface flex items-center justify-between transition-colors"
      >
        <div className="flex items-center space-x-3">
          {icon && <span className="text-cyan-400">{icon}</span>}
          <h3 className="font-semibold text-foreground text-left">{title}</h3>
        </div>
        <ChevronDown
          size={20}
          className={`text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-muted/30 border-t border-border space-y-4">
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
