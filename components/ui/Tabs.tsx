"use client";

import React, { useState } from "react";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-slate-700 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === tab.id
                ? "border-b-blue-500 text-blue-400"
                : "border-b-transparent text-slate-400 hover:text-slate-300"
            }`}
          >
            {tab.icon && <span className="text-base">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">{activeTabData?.content}</div>
    </div>
  );
}
