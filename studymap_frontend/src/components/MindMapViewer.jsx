import { useEffect, useRef, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

const viewerCss = `
  .react-flow__pane {
    /* Critical: tell the browser this element handles its own touch events */
    touch-action: none !important;
  }
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
  .mindmap-controls button svg {
    fill: #94a3b8 !important;
  }
`;

const NODE_W = 140;
const NODE_H = 50;

const LayoutedNode = ({ data, selected }) => (
  <>
    <style>{viewerCss}</style>
    <div
      className={`px-3 py-2 rounded-lg shadow-lg border transition-all mindmap-node ${selected ? 'selected' : ''}`}
      style={{ backgroundColor: data.color || '#8b5cf6', minWidth: NODE_W, maxWidth: NODE_W }}
    >
      <Handle type="target" position={Position.Top} className="!bg-white/50" />
      <div className="text-white font-semibold text-center text-xs truncate">{data.label}</div>
      {data.summary && (
        <div className="text-white/70 text-[10px] text-center truncate">{data.summary}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-white/50" />
    </div>
  </>
);

const nodeTypes = { layouted: LayoutedNode };

function layout(nodes, edges) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 40, ranksep: 50 });
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map((n) => {
    const { x, y } = g.node(n.id);
    return { ...n, position: { x: x - NODE_W / 2, y: y - NODE_H / 2 } };
  });
}

function buildGraph(data) {
  const nodes = [];
  const edges = [];
  function walk(node) {
    nodes.push({
      id: node.id,
      type: 'layouted',
      data: { label: node.label, color: node.color, summary: node.summary },
      position: { x: 0, y: 0 },
    });
    node.children?.forEach((child) => {
      edges.push({
        id: `${node.id}-${child.id}`,
        source: node.id,
        target: child.id,
        type: 'smoothstep',
        style: { stroke: child.color || '#8b5cf6', strokeWidth: 2 },
      });
      walk(child);
    });
  }
  walk(data);
  return { nodes: layout(nodes, edges), edges };
}

function FlowInner({ data }) {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const fitted = useRef(false);

  useEffect(() => {
    if (!data) return;
    fitted.current = false;
    const { nodes: n, edges: e } = buildGraph(data);
    setNodes(n);
    setEdges(e);
  }, [data]);

  useEffect(() => {
    if (nodes.length === 0 || fitted.current) return;
    // Two rAF frames: first waits for React to commit, second for browser paint
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        fitted.current = true;
        fitView({ padding: 0.15, duration: 400 });
      })
    );
    return () => cancelAnimationFrame(id);
  }, [nodes, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      className="bg-gray-900"
      fitView={false}
      // pan with finger (touch) or mouse button 1
      panOnDrag={true}
      // pinch zoom on mobile
      zoomOnPinch={true}
      // scroll to zoom on desktop
      zoomOnScroll={true}
      // don't let the page scroll while interacting with the map
      preventScrolling={true}
      // no boundary — user can pan freely in all directions
      translateExtent={[[-Infinity, -Infinity], [Infinity, Infinity]]}
    >
      <Background color="#374151" gap={20} />
      <Controls className="mindmap-controls" showInteractive={false} />
    </ReactFlow>
  );
}

export default function MindMapViewer({ data }) {
  return (
    <ReactFlowProvider>
      {/* touch-action:none here ensures no ancestor scroll container steals the gesture */}
      <div style={{ width: '100%', height: '100%', touchAction: 'none' }}>
        <FlowInner data={data} />
      </div>
    </ReactFlowProvider>
  );
}