"use client";

import { useState } from "react";
import { NodeTree } from "./NodeTree";
import { NodeDetailsPanel } from "./NodeDetailsPanel";
import type { ScoringNode } from "@/lib/types/scoring-grid";

interface ScoringGridSplitProps {
  nodes: ScoringNode[];
  versionId: string;
  onDirtyChange: (dirty: boolean) => void;
  onNodesChange: (nodes: ScoringNode[]) => void;
}

export function ScoringGridSplit({
  nodes,
  versionId,
  onDirtyChange,
  onNodesChange,
}: ScoringGridSplitProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = selectedNodeId ? findNodeById(nodes, selectedNodeId) : null;

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const handleNodeUpdate = (updatedNode: ScoringNode) => {
    const updateNodeRecursive = (node: ScoringNode): ScoringNode => {
      if (node.id === updatedNode.id) {
        return updatedNode;
      }
      if (node.childNodes && node.childNodes.length > 0) {
        return {
          ...node,
          childNodes: node.childNodes.map(updateNodeRecursive),
        };
      }
      return node;
    };

    const updatedNodes = nodes.map(updateNodeRecursive);
    onNodesChange(updatedNodes);
    onDirtyChange(true);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left pane: Node Tree */}
      <div className="w-1/4 bg-slate-900 border-r border-slate-700 overflow-y-auto">
        <NodeTree
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onNodeSelect={handleNodeSelect}
        />
      </div>

      {/* Right pane: Node Details */}
      <div className="flex-1 bg-slate-950 overflow-y-auto">
        {selectedNode ? (
          <NodeDetailsPanel
            node={selectedNode}
            versionId={versionId}
            onNodeUpdate={handleNodeUpdate}
            onDirtyChange={onDirtyChange}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p>Sélectionnez un nœud pour afficher les détails</p>
          </div>
        )}
      </div>
    </div>
  );
}

function findNodeById(nodes: ScoringNode[], id: string): ScoringNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.childNodes && node.childNodes.length > 0) {
      const found = findNodeById(node.childNodes, id);
      if (found) return found;
    }
  }
  return null;
}
