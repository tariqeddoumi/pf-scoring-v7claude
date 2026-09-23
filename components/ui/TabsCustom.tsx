import { ReactNode, useState } from "react";

interface TabItem {
  label: string;
  value: string;
  icon?: ReactNode;
  badge?: string | number;
}

interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  children: ReactNode;
}

export function Tabs({ items, defaultValue, onChange, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue || items[0]?.value);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onChange?.(value);
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border overflow-x-auto">
        {items.map((item) => (
          <button
            key={item.value}
            onClick={() => handleTabChange(item.value)}
            type="button"
            className={`px-4 py-3 font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === item.value
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
            }`}
          >
            {item.icon && <span>{item.icon}</span>}
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span className="ml-2 px-2 py-1 text-xs bg-muted rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {Array.isArray(children)
          ? children.find((child: any) => child?.props?.value === activeTab)
          : children}
      </div>
    </div>
  );
}

interface TabPaneProps {
  value: string;
  children: ReactNode;
}

export function TabPane({ value, children }: TabPaneProps) {
  return <div className="animate-in fade-in-50 duration-200">{children}</div>;
}
