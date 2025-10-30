"use client";
import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  type Node as RFNode,
  type Edge as RFEdge,
  Position,
  ConnectionLineType,
  Handle,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Search,
  Trash2,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const sampleJSON = `{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "country": "USA"
    }
  },
  "items": [
    {
      "name": "Laptop",
      "price": 999
    },
    {
      "name": "Mouse",
      "price": 25
    }
  ],
  "active": true,
  "score": 95.5
}`;

type NodeKind = "object" | "array" | "primitive" | "highlighted";

interface NodeData {
  label: string;
  value?: unknown;
  type: Exclude<NodeKind, "highlighted">;
  path: string;
  isDark: boolean;
  isHighlighted: boolean;
}

const getNodeColor = (type: NodeKind, isDark: boolean) => {
  const colors = {
    object: isDark ? "#8b5cf6" : "#a78bfa",
    array: isDark ? "#10b981" : "#34d399",
    primitive: isDark ? "#f59e0b" : "#fbbf24",
    highlighted: "#ef4444",
  };
  return colors[type] || colors.primitive;
};

const CustomNode: React.FC<{ data: NodeData }> = ({ data }) => {
  const bgColor = data.isHighlighted
    ? getNodeColor("highlighted", data.isDark)
    : getNodeColor(data.type as NodeKind, data.isDark);

  return (
    <div
      className={`px-4 py-2 rounded-lg shadow-lg border-2 transition-all ${
        data.isDark ? "border-gray-600" : "border-gray-300"
      }`}
      style={{
        backgroundColor: bgColor,
        minWidth: "120px",
        transform: data.isHighlighted ? "scale(1.1)" : "scale(1)",
      }}
      title={`${data.path}${
        data.value !== undefined ? `: ${String(data.value)}` : ""
      }`}
    >
      {/* target handle at the top for incoming edges */}
      <Handle
        id="t"
        type="target"
        position={Position.Top}
        style={{ opacity: 0 }}
      />
      <div className="text-white font-medium text-sm">{data.label}</div>
      {data.value !== undefined && (
        <div className="text-white text-xs opacity-90 mt-1">
          {String(data.value)}
        </div>
      )}
      {/* source handle at the bottom for outgoing edges */}
      <Handle
        id="b"
        type="source"
        position={Position.Bottom}
        style={{ opacity: 0 }}
      />
    </div>
  );
};

// memoize nodeTypes so its reference stays stable between renders/fast refreshes
// this prevents React Flow warning 002 about changing nodeTypes objects

function JSONTreeVisualizer() {
  const [jsonInput, setJsonInput] = useState(sampleJSON);
  const [searchPath, setSearchPath] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge[]>([]);
  const [error, setError] = useState("");
  const [searchResult, setSearchResult] = useState("");
  const [isDark, setIsDark] = useState(true);
  // React Flow instance for view controls (onInit provides the instance)
  const [rfInstance, setRfInstance] = useState<{
    setCenter: (
      x: number,
      y: number,
      opts?: { zoom?: number; duration?: number }
    ) => void;
    getNode: (id: string) => RFNode<NodeData> | undefined;
  } | null>(null);

  const nodeTypes = React.useMemo(() => ({ custom: CustomNode }), []);

  const createTree = useCallback(
    (
      obj: unknown,
      parentId: string | null = null,
      key: string = "root",
      path: string = "$"
    ) => {
      const nodeList: RFNode<NodeData>[] = [];
      const edgeList: RFEdge[] = [];
      let nodeId = 0;

      const traverse = (
        value: unknown,
        parent: string | null,
        label: string,
        currentPath: string
      ) => {
        const id = `node-${nodeId++}`;
        let nodeType: NodeData["type"] = "primitive";

        if (Array.isArray(value)) {
          nodeType = "array";
        } else if (typeof value === "object" && value !== null) {
          nodeType = "object";
        }

        const node: RFNode<NodeData> = {
          id,
          type: "custom",
          data: {
            label,
            value: nodeType === "primitive" ? value : undefined,
            type: nodeType,
            path: currentPath,
            isDark,
            isHighlighted: false,
          },
          position: { x: 0, y: 0 },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        };

        nodeList.push(node);

        if (parent) {
          edgeList.push({
            id: `edge-${parent}-${id}`,
            source: parent,
            target: id,
          });
        }

        if (nodeType === "object") {
          Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
            traverse(v, id, k, `${currentPath}.${k}`);
          });
        } else if (nodeType === "array") {
          (value as unknown[]).forEach((item: unknown, idx: number) => {
            traverse(item, id, `[${idx}]`, `${currentPath}[${idx}]`);
          });
        }
      };

      traverse(obj, parentId, key, path);
      return { nodes: nodeList, edges: edgeList };
    },
    [isDark]
  );

  // Update node theme when dark mode changes
  useEffect(() => {
    if (nodes.length > 0) {
      setNodes(
        nodes.map((n) => ({
          ...n,
          data: { ...n.data, isDark },
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  const layoutNodes = (nodes: RFNode<NodeData>[], edges: RFEdge[]) => {
    const levels: Record<number, string[]> = {};
    const visited = new Set<string>();

    const findLevel = (nodeId: string, level: number = 0) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      if (!levels[level]) levels[level] = [];
      levels[level].push(nodeId);

      edges.forEach((edge) => {
        if (edge.source === nodeId) {
          findLevel(edge.target as string, level + 1);
        }
      });
    };

    const rootNode = nodes.find((n) => !edges.some((e) => e.target === n.id));
    if (rootNode) findLevel(rootNode.id);

    Object.entries(levels).forEach(([level, nodeIds]) => {
      const levelNum = parseInt(level);
      nodeIds.forEach((nodeId, index) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (node) {
          node.position = {
            x: (index - nodeIds.length / 2) * 200,
            y: levelNum * 150,
          };
        }
      });
    });

    return nodes;
  };

  const handleVisualize = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setError("");
      setSearchResult("");

      const { nodes: newNodes, edges: newEdges } = createTree(parsed);
      const layoutedNodes = layoutNodes(newNodes, newEdges);

      setNodes(layoutedNodes);
      setEdges(newEdges);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError("Invalid JSON: " + message);
      setNodes([]);
      setEdges([]);
    }
  };

  const handleSearch = () => {
    if (!searchPath.trim()) {
      setSearchResult("");
      setNodes(
        nodes.map((n) => ({ ...n, data: { ...n.data, isHighlighted: false } }))
      );
      return;
    }

    const normalizedPath = searchPath.trim().startsWith("$")
      ? searchPath.trim()
      : `$.${searchPath.trim()}`;

    const matchedNode = nodes.find((n) => n.data.path === normalizedPath);

    if (matchedNode) {
      setNodes(
        nodes.map((n) => ({
          ...n,
          data: {
            ...n.data,
            isHighlighted: n.id === matchedNode.id,
          },
        }))
      );
      setSearchResult("Match found!");
      // center viewport using React Flow instance
      if (rfInstance) {
        const latest = rfInstance.getNode(matchedNode.id);
        if (latest) {
          rfInstance.setCenter(latest.position.x, latest.position.y, {
            zoom: 1.5,
            duration: 800,
          });
        }
      }
    } else {
      setNodes(
        nodes.map((n) => ({ ...n, data: { ...n.data, isHighlighted: false } }))
      );
      setSearchResult("No match found");
    }
  };

  const handleClear = () => {
    setJsonInput("");
    setNodes([]);
    setEdges([]);
    setError("");
    setSearchResult("");
    setSearchPath("");
  };

  return (
    <div
      className={`h-screen flex flex-col ${
        isDark ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      {/* Header */}
      <div
        className={`${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } border-b p-4`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1
              className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              JSON Tree Visualizer
            </h1>
            <button
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-lg ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              } transition-colors`}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* JSON Input */}
            <div className="lg:col-span-2">
              <textarea
                aria-label="JSON input"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste your JSON here..."
                className={`w-full h-32 p-3 rounded-lg font-mono text-sm ${
                  isDark
                    ? "bg-gray-700 text-gray-100 border-gray-600"
                    : "bg-white text-gray-900 border-gray-300"
                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleVisualize}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Generate Tree
                </button>
                <button
                  onClick={handleClear}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </div>

            {/* Search */}
            <div>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={searchPath}
                  onChange={(e) => setSearchPath(e.target.value)}
                  placeholder="e.g., $.user.address.city"
                  className={`w-full p-3 rounded-lg text-sm ${
                    isDark
                      ? "bg-gray-700 text-gray-100 border-gray-600"
                      : "bg-white text-gray-900 border-gray-300"
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <button
                  onClick={handleSearch}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>

              {searchResult && (
                <div
                  className={`mt-2 p-2 rounded-lg text-sm flex items-center gap-2 ${
                    searchResult.includes("found!")
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {searchResult.includes("found!") ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {searchResult}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-2 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Tree View */}
      <div className="flex-1 relative">
        {nodes.length > 0 ? (
          <ReactFlow
            onInit={setRfInstance}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            className={isDark ? "bg-gray-900" : "bg-gray-50"}
            defaultEdgeOptions={{
              type: "smoothstep",
              animated: false,
              style: {
                stroke: isDark ? "#cbd5e1" : "#334155",
                strokeWidth: 2.25,
              },
            }}
            connectionLineType={ConnectionLineType.SmoothStep}
            onNodeClick={(_, node) => {
              const path = (node.data as NodeData).path;
              if (path) {
                navigator.clipboard?.writeText(path).catch(() => {});
                setSearchPath(path);
                setNodes(
                  nodes.map((n) => ({
                    ...n,
                    data: { ...n.data, isHighlighted: n.id === node.id },
                  }))
                );
              }
            }}
          >
            <Background color={isDark ? "#374151" : "#e5e7eb"} />
            <Controls
              className={isDark ? "bg-gray-800 border-gray-700" : "bg-white"}
            />
            <MiniMap
              className={isDark ? "bg-gray-800" : "bg-gray-200"}
              maskColor={
                isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.6)"
              }
            />
            <Panel position="top-right" className="bg-transparent">
              <div
                className={`p-3 rounded-lg shadow-lg ${
                  isDark
                    ? "bg-gray-800 text-gray-200"
                    : "bg-white text-gray-800"
                }`}
              >
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{
                        backgroundColor: getNodeColor("object", isDark),
                      }}
                    />
                    <span>Object</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: getNodeColor("array", isDark) }}
                    />
                    <span>Array</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{
                        backgroundColor: getNodeColor("primitive", isDark),
                      }}
                    />
                    <span>Primitive</span>
                  </div>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div
              className={`text-center ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <p className="text-lg mb-2">No tree to display</p>
              <p className="text-sm">
                Enter JSON and click Generate Tree to visualize
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default JSONTreeVisualizer;
