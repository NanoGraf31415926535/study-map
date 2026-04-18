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

const nodeWidth = 140;
const nodeHeight = 50;

const LayoutedNode = ({ data, selected }) => {
  return (
    <div
      className={`px-3 py-2 rounded-lg shadow-lg border-2 transition-all ${
        selected ? 'border-primary' : 'border-gray-700'
      }`}
      style={{
        backgroundColor: data.color || '#6C63FF',
        minWidth: nodeWidth,
        maxWidth: nodeWidth,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <div className="text-white font-semibold text-center text-xs truncate">{data.label}</div>
      {data.summary && (
        <div className="text-white/70 text-[10px] text-center truncate">
          {data.summary}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
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
            style: { stroke: child.color || '#6C63FF', strokeWidth: 2 },
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
        className="bg-surface"
      >
        <Background color="#374151" gap={20} />
        <Controls className="!bg-card !border-gray-700 !text-text" />
        <MiniMap
          nodeColor={(n) => n.data?.color || '#6C63FF'}
          maskColor="rgba(0,0,0,0.3)"
          className="!bg-card !border-gray-700"
        />
      </ReactFlow>
    </div>
  );
}