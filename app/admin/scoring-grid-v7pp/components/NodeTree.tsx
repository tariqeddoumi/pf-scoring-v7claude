"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import type { ScoringNode } from "@/lib/types/scoring-grid";

interface NodeTreeProps {
  nodes: ScoringNode[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string) => void;
}

export function NodeTree({ nodes, selectedNodeId, onNodeSelect }: NodeTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  return (
    <div className="p-2">
      {nodes.map((node) => (
        <NodeTreeItem
          key={node.id}
          node={node}
          level={0}
          selectedNodeId={selectedNodeId}
          expandedNodes={expandedNodes}
          onNodeSelect={onNodeSelect}
          onToggleExpand={toggleExpand}
        />
      ))}
    </div>
  );
}

interface NodeTreeItemProps {
  node: ScoringNode;
  level: number;
  selectedNodeId: string | null;
  expandedNodes: Set<string>;
  onNodeSelect: (nodeId: string) => void;
  onToggleExpand: (nodeId: string) => void;
}

function NodeTreeItem({
  node,
  level,
  selectedNodeId,
  expandedNodes,
  onNodeSelect,
  onToggleExpand,
}: NodeTreeItemProps) {
  const hasChildren = node.childNodes && node.childNodes.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedNodeId === node.id;

  const nodeTypeColors: Record<string, string> = {
    DOMAIN: "text-blue-400",
    GROUP: "text-purple-400",
    CRITERION: "text-indigo-400",
    SUB_CRITERION: "text-cyan-400",
    SUB_SUB_CRITERION: "text-emerald-400",
  };

  const nodeColor = nodeTypeColors[node.nodeType] || "text-slate-400";

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-sm transition-colors ${
          isSelected ? "bg-slate-700 text-white" : "hover:bg-slate-800 text-slate-300"
        }`}
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={() => onNodeSelect(node.id)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
            className="p-0 hover:bg-slate-700 rounded"
          >
            {isExpanded ? (
              <ChevronDown size={16} className="text-slate-400" />
            ) : (
              <ChevronRight size={16} className="text-slate-400" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-4" />}

        <span className={`font-medium ${nodeColor}`}>{node.code}</span>
        <span className="text-slate-400 ml-1">{node.label}</span>

        {node.weight !== null && node.weight !== undefined && (
          <span className="ml-auto text-xs text-yellow-400">{node.weight}%</span>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.childNodes!.map((child) => (
            <NodeTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedNodeId={selectedNodeId}
              expandedNodes={expandedNodes}
              onNodeSelect={onNodeSelect}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}
