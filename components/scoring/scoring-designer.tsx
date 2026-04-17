"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Eye, ChevronDown, ChevronRight, Save } from "lucide-react";

interface ScoringModel {
  id: string;
  code: string;
  label: string;
  businessSegment: string;
  projectType: string;
  status: string;
  versions?: ScoringVersion[];
}

interface ScoringVersion {
  id: string;
  modelId: string;
  versionNumber: number;
  label: string;
  status: string;
  isPublished: boolean;
  nodeCount: number;
  createdAt: string;
}

interface ScoringNode {
  id: string;
  versionId: string;
  parentNodeId: string | null;
  nodeType: string;
  code: string;
  label: string;
  depth: number;
  isScored: boolean;
  weight: number | null;
  aggregationMethod: string | null;
  childrenCount: number;
  children?: ScoringNode[];
}

export function ScoringDesigner() {
  const [models, setModels] = useState<ScoringModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<ScoringModel | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<ScoringVersion | null>(null);
  const [treeNodes, setTreeNodes] = useState<ScoringNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingModel, setIsCreatingModel] = useState(false);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("models");

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/scoring-models");
      if (!res.ok) throw new Error("Failed to load models");
      const { data } = await res.json();
      setModels(data);
    } catch (err) {
      console.error("Error loading models:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadVersions = async (modelId: string) => {
    try {
      const res = await fetch(`/api/admin/scoring-models/${modelId}/versions`);
      if (!res.ok) throw new Error("Failed to load versions");
      const { data } = await res.json();
      const model = models.find((m) => m.id === modelId);
      if (model) {
        model.versions = data;
        setSelectedModel({ ...model });
      }
    } catch (err) {
      console.error("Error loading versions:", err);
    }
  };

  const loadNodeTree = async (versionId: string) => {
    try {
      const res = await fetch(`/api/admin/scoring-models/versions/${versionId}/nodes`);
      if (!res.ok) throw new Error("Failed to load nodes");
      const { data } = await res.json();
      setTreeNodes(data);
    } catch (err) {
      console.error("Error loading nodes:", err);
    }
  };

  const handleSelectModel = (model: ScoringModel) => {
    setSelectedModel(model);
    setSelectedVersion(null);
    setActiveTab("versions");
    loadVersions(model.id);
  };

  const handleSelectVersion = (version: ScoringVersion) => {
    setSelectedVersion(version);
    setActiveTab("nodes");
    loadNodeTree(version.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Scoring Designer</h1>
        <button
          onClick={() => setIsCreatingModel(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          <Plus className="w-4 h-4" />
          New Model
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab("models")}
          className={`px-4 py-2 border-b-2 font-medium transition ${
            activeTab === "models"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-gray-400 hover:text-gray-300"
          }`}
        >
          Models
        </button>
        <button
          onClick={() => selectedModel && setActiveTab("versions")}
          disabled={!selectedModel}
          className={`px-4 py-2 border-b-2 font-medium transition ${
            !selectedModel ? "opacity-50 cursor-not-allowed" : ""
          } ${
            activeTab === "versions"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-gray-400 hover:text-gray-300"
          }`}
        >
          Versions
        </button>
        <button
          onClick={() => selectedVersion && setActiveTab("nodes")}
          disabled={!selectedVersion}
          className={`px-4 py-2 border-b-2 font-medium transition ${
            !selectedVersion ? "opacity-50 cursor-not-allowed" : ""
          } ${
            activeTab === "nodes"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-gray-400 hover:text-gray-300"
          }`}
        >
          Node Tree
        </button>
        <button
          onClick={() => selectedVersion && setActiveTab("rules")}
          disabled={!selectedVersion}
          className={`px-4 py-2 border-b-2 font-medium transition ${
            !selectedVersion ? "opacity-50 cursor-not-allowed" : ""
          } ${
            activeTab === "rules"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-gray-400 hover:text-gray-300"
          }`}
        >
          Rules
        </button>
        <button
          onClick={() => selectedVersion && setActiveTab("bindings")}
          disabled={!selectedVersion}
          className={`px-4 py-2 border-b-2 font-medium transition ${
            !selectedVersion ? "opacity-50 cursor-not-allowed" : ""
          } ${
            activeTab === "bindings"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-gray-400 hover:text-gray-300"
          }`}
        >
          Bindings
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Models Tab */}
        {activeTab === "models" && (
          isLoading ? (
            <div className="text-center py-8">Loading models...</div>
          ) : (
            <div className="grid gap-4">
              {models.map((model) => (
                <div
                  key={model.id}
                  onClick={() => handleSelectModel(model)}
                  className={`p-4 border rounded cursor-pointer transition ${
                    selectedModel?.id === model.id
                      ? "border-blue-500 bg-blue-900/20"
                      : "border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{model.label}</h3>
                      <p className="text-sm text-gray-400">{model.code}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {model.businessSegment} • {model.projectType}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      model.status === "PUBLISHED"
                        ? "bg-green-900/30 text-green-400"
                        : "bg-yellow-900/30 text-yellow-400"
                    }`}>
                      {model.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Versions Tab */}
        {activeTab === "versions" && (
          <div className="space-y-4">
            {selectedModel && selectedModel.versions && (
              <div className="space-y-4">
                {selectedModel.versions.map((version) => (
                  <div
                    key={version.id}
                    onClick={() => handleSelectVersion(version)}
                    className={`p-4 border rounded cursor-pointer transition ${
                      selectedVersion?.id === version.id
                        ? "border-blue-500 bg-blue-900/20"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">
                          Version {version.versionNumber} - {version.label}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {version.nodeCount} nodes • Created {new Date(version.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {version.isPublished && (
                          <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded">
                            Published
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded ${
                          version.status === "DRAFT"
                            ? "bg-gray-700 text-gray-300"
                            : "bg-blue-700 text-blue-300"
                        }`}>
                          {version.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Node Tree Tab */}
        {activeTab === "nodes" && selectedVersion && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{selectedVersion.label} - Node Structure</h3>
              <button className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded">
                <Plus className="w-4 h-4" />
                Add Node
              </button>
            </div>
            <div className="border border-gray-700 rounded p-4 space-y-2">
              {treeNodes.map((node) => (
                <NodeTreeItem key={node.id} node={node} expandedNodeIds={expandedNodeIds} setExpandedNodeIds={setExpandedNodeIds} />
              ))}
            </div>
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === "rules" && (
          <div className="space-y-4">
            {selectedVersion && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Rules for {selectedVersion.label}</h3>
                  <button className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded">
                    <Plus className="w-4 h-4" />
                    Add Rule
                  </button>
                </div>
                <RulesTable versionId={selectedVersion.id} />
              </div>
            )}
          </div>
        )}

        {/* Bindings Tab */}
        {activeTab === "bindings" && (
          <div className="space-y-4">
            {selectedVersion && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Data Bindings for {selectedVersion.label}</h3>
                  <button className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded">
                    <Plus className="w-4 h-4" />
                    Add Binding
                  </button>
                </div>
                <BindingsTable versionId={selectedVersion.id} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NodeTreeItem({
  node,
  expandedNodeIds,
  setExpandedNodeIds,
}: {
  node: ScoringNode;
  expandedNodeIds: Set<string>;
  setExpandedNodeIds: (ids: Set<string>) => void;
}) {
  const isExpanded = expandedNodeIds.has(node.id);
  const hasChildren = node.childrenCount > 0;

  const toggleExpand = () => {
    const newExpanded = new Set(expandedNodeIds);
    if (newExpanded.has(node.id)) {
      newExpanded.delete(node.id);
    } else {
      newExpanded.add(node.id);
    }
    setExpandedNodeIds(newExpanded);
  };

  return (
    <div className="space-y-1">
      <div
        className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded cursor-pointer"
        style={{ marginLeft: `${node.depth * 20}px` }}
      >
        {hasChildren && (
          <button onClick={toggleExpand} className="p-0">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
        {!hasChildren && <div className="w-4" />}

        <span className={`text-xs px-2 py-0.5 rounded ${
          node.isScored ? "bg-blue-900/40 text-blue-400" : "bg-gray-700 text-gray-300"
        }`}>
          {node.nodeType}
        </span>

        <div className="flex-1">
          <span className="font-medium text-sm">{node.label}</span>
          <span className="text-xs text-gray-500 ml-2">({node.code})</span>
        </div>

        {node.weight && <span className="text-xs text-gray-400">W: {node.weight}%</span>}

        <div className="flex gap-1">
          <button className="p-1 hover:bg-gray-700 rounded">
            <Edit2 className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-red-900/30 rounded">
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <NodeTreeItem
              key={child.id}
              node={child}
              expandedNodeIds={expandedNodeIds}
              setExpandedNodeIds={setExpandedNodeIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RulesTable({ versionId }: { versionId: string }) {
  const [rules, setRules] = useState([]);

  useEffect(() => {
    const loadRules = async () => {
      try {
        const res = await fetch(`/api/admin/scoring-models/versions/${versionId}/rules`);
        if (res.ok) {
          const { data } = await res.json();
          setRules(data);
        }
      } catch (err) {
        console.error("Error loading rules:", err);
      }
    };
    loadRules();
  }, [versionId]);

  return (
    <div className="border border-gray-700 rounded overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-900 border-b border-gray-700">
            <th className="px-4 py-3 text-left">Code</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-left">Severity</th>
            <th className="px-4 py-3 text-center">Penalty</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rules.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                No rules defined
              </td>
            </tr>
          ) : (
            rules.map((rule: any) => (
              <tr key={rule.id} className="border-b border-gray-800 hover:bg-gray-900/30">
                <td className="px-4 py-3 font-medium">{rule.code}</td>
                <td className="px-4 py-3 text-xs">{rule.ruleType}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded ${
                    rule.severity === "HIGH" ? "bg-red-900/30 text-red-400" : "bg-yellow-900/30 text-yellow-400"
                  }`}>
                    {rule.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">{rule.penaltyValue || "-"}</td>
                <td className="px-4 py-3 text-center flex gap-2 justify-center">
                  <button className="p-1 hover:bg-gray-700 rounded">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-1 hover:bg-red-900/30 rounded">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function BindingsTable({ versionId }: { versionId: string }) {
  const [bindings, setBindings] = useState([]);

  useEffect(() => {
    const loadBindings = async () => {
      try {
        const res = await fetch(`/api/admin/scoring-models/versions/${versionId}/bindings`);
        if (res.ok) {
          const { data } = await res.json();
          setBindings(data);
        }
      } catch (err) {
        console.error("Error loading bindings:", err);
      }
    };
    loadBindings();
  }, [versionId]);

  return (
    <div className="border border-gray-700 rounded overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-900 border-b border-gray-700">
            <th className="px-4 py-3 text-left">Node</th>
            <th className="px-4 py-3 text-left">Source</th>
            <th className="px-4 py-3 text-left">Field</th>
            <th className="px-4 py-3 text-left">Mode</th>
            <th className="px-4 py-3 text-left">Transform</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bindings.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                No bindings defined
              </td>
            </tr>
          ) : (
            bindings.map((binding: any) => (
              <tr key={binding.id} className="border-b border-gray-800 hover:bg-gray-900/30">
                <td className="px-4 py-3 font-medium text-sm">{binding.nodeId.substring(0, 8)}</td>
                <td className="px-4 py-3 text-xs">{binding.sourceEntity}</td>
                <td className="px-4 py-3 text-xs">{binding.sourceField || "-"}</td>
                <td className="px-4 py-3 text-xs">{binding.bindingMode}</td>
                <td className="px-4 py-3 text-xs">{binding.transformType}</td>
                <td className="px-4 py-3 text-center flex gap-2 justify-center">
                  <button className="p-1 hover:bg-gray-700 rounded">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-1 hover:bg-red-900/30 rounded">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
