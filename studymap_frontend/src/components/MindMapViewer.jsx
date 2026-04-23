import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

const viewerCss = `
  .mindmap-node {
    background: rgba(139,92,246,0.15);
    border: 1px solid rgba(139,92,246,0.3);
  }
  .mindmap-node.selected {
    border-color: #a78bfa;
    box-shadow: 0 0 12px rgba(139,92,246,0.4);
  }
  .mindmap-controls {
    background: rgba(17,24,39,0.95) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
  }
  .mindmap-controls button {
    background: rgba(255,255,255,0.05) !important;
    border-color: rgba(255,255,255,0.08) !important;
  }
  .mindmap-controls button:hover {
    background: rgba(255,255,255,0.1) !important;
  }
  .mindmap-controls button svg {
    fill: #94a3b8 !important;
  }
  .mindmap-minimap {
    background: rgba(17,24,39,0.95) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
  }
`;

const nodeWidth = 140;
const nodeHeight = 50;

const LayoutedNode = ({ data, selected }) => {
  return (
    <>
      <style>{viewerCss}</style>
      <div
        className={`px-3 py-2 rounded-lg shadow-lg border transition-all mindmap-node ${
          selected ? 'selected' : ''
        }`}
        style={{
          backgroundColor: data.color || '#8b5cf6',
          minWidth: nodeWidth,
          maxWidth: nodeWidth,
        }}
      >
        <Handle type="target" position={Position.Top} className="!bg-white/50" />
        <div className="text-white font-semibold text-center text-xs truncate">{data.label}</div>
        {data.summary && (
          <div className="text-white/70 text-[10px] text-center truncate">
            {data.summary}
          </div>
        )}
        <Handle type="source" position={Position.Bottom} className="!bg-white/50" />
      </div>
    </>
  );
};

const nodeTypes = { layouted: LayoutedNode };

const getLayoutedElements = (nodes, edges) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 40, ranksep: 50, rankbarseperation: 30 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });
};

export default function MindMapViewer({ data, onExport }) {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  useEffect(() => {
    if (!data) return;

    const buildNodes = (node, parentId = null, level = 0) => {
      const result = [
        {
          id: node.id,
          type: 'layouted',
          data: { label: node.label, color: node.color, summary: node.summary },
          position: { x: 0, y: 0 },
        },
      ];

      if (node.children) {
        node.children.forEach((child) => {
          result.push(...buildNodes(child, node.id, level + 1));
        });
      }

      return result;
    };

    const buildEdges = (node) => {
      const result = [];
      if (node.children) {
        node.children.forEach((child) => {
          result.push({
            id: `${node.id}-${child.id}`,
            source: node.id,
            target: child.id,
            type: 'smoothstep',
            style: { stroke: child.color || '#8b5cf6', strokeWidth: 2 },
          });
          result.push(...buildEdges(child));
        });
      }
      return result;
    };

    const initialNodes = buildNodes(data);
    const initialEdges = buildEdges(data);
    const layoutedNodes = getLayoutedElements(initialNodes, initialEdges);

    setNodes(layoutedNodes);
    setEdges(initialEdges);
  }, [data]);

  const onFitView = useCallback(() => {
    reactFlowInstance?.fitView({ padding: 0.2 });
  }, [reactFlowInstance]);

  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={setReactFlowInstance}
        fitView
        nodeTypes={nodeTypes}
        className="bg-gray-900"
      >
        <Background color="#374151" gap={20} />
        <Controls className="mindmap-controls" />
        <MiniMap
          nodeColor={(n) => n.data?.color || '#8b5cf6'}
          maskColor="rgba(0,0,0,0.5)"
          className="mindmap-minimap"
        />
      </ReactFlow>
    </div>
  );
}