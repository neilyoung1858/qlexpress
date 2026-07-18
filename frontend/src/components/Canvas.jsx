import { useEffect, useRef, useCallback, useState } from 'react'
import { Graph, Shape } from '@antv/x6'
import { register } from '@antv/x6-react-shape'
import { Button, Tooltip, message, AutoComplete, Input, Modal } from 'antd'
import { ZoomInOutlined, ZoomOutOutlined, ExpandOutlined, NodeIndexOutlined, SearchOutlined, UploadOutlined, DownloadOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { CirclePlay, Diamond, Calculator, Ban, CircleCheckBig, CornerDownLeft } from 'lucide-react'
import useStore from '../store/useStore'
import { NODE_DEFINITIONS } from '../config/nodes'
import { generateQLFromCanvas } from '../utils/qlGenerator'

const NODE_GLYPH = {
  start: CirclePlay, condition: Diamond, calculate: Calculator,
  no_points: Ban, end: CircleCheckBig, return: CornerDownLeft,
}

const OP_SYMBOLS = {
  '>': '>', '>=': '≥', '<': '<', '<=': '≤', '==': '=', '!=': '≠',
  between: '∈', in: '∈', notIn: '∉',
  contains: '∋', notContains: '⊅', startsWith: '↗', endsWith: '↘',
}

function condText(cond) {
  const name = cond.fieldName || cond.fieldId || '?'
  const op = OP_SYMBOLS[cond.operator] || cond.operator
  if (cond.operator === 'between') return `${name}∈[${cond.value ?? '?'},${cond.value2 ?? '?'}]`
  if (cond.operator === 'in' || cond.operator === 'notIn') {
    const v = Array.isArray(cond.value) ? cond.value.join(',') : (cond.value ?? '')
    return `${name}${op}(${v})`
  }
  return `${name}${op}${cond.value ?? ''}`
}

const NodeContainer = ({ node }) => {
  const selectedNode = useStore((s) => s.selectedNode)
  const data = node.getData() || {}
  const def = NODE_DEFINITIONS.find((d) => d.type === node.shape)
  const color = data.color || (def ? def.color : '#999')
  const sub = data.sub || ''
  const GlyphIcon = NODE_GLYPH[node.shape]

  const isStart = node.shape === 'start'
  const isEnd = node.shape === 'end'
  const isCondition = node.shape === 'condition'
  const isSelected = selectedNode?.id === node.id
  const displayLabel = data.label != null && data.label !== '' ? data.label : (def ? def.label : '')

  // Build summary display lines
  let summaryRows = []
  if (isCondition) {
    const groups = data.conditionGroups || []
    if (groups.length > 0) {
      groups.forEach((g, gi) => {
        const conds = g.conditions || []
        if (conds.length > 0) {
          const text = conds.map((c) => condText(c)).join(` ${g.logicOp === '||' ? 'OR' : 'AND'} `)
          summaryRows.push({ text, groupIdx: gi })
        }
      })
    } else if (data.conditions) {
      const text = data.conditions.map((c) => condText(c)).join(' AND ')
      summaryRows.push({ text, groupIdx: 0 })
    }
  } else if (node.shape === 'calculate') {
    const af = data.amountField || 'tradeAmt'
    const r = data.rate != null ? data.rate : 1
    summaryRows.push({ text: `${af} × ${r}`, groupIdx: 0 })
  } else if (node.shape === 'no_points') {
    const nf = data.nopField
    const nv = data.nopValue
    if (nf && nv) summaryRows.push({ text: `${nf} != ${isNaN(nv) ? `"${nv}"` : nv}`, groupIdx: 0 })
  } else if (node.shape === 'return') {
    const rv = data.returnValue
    if (rv) summaryRows.push({ text: rv, groupIdx: 0 })
  }

  return (
    <div
      className={`node-container${isSelected ? ' selected' : ''}`}
      data-shape={node.shape}
      style={{
        background: '#fff',
        border: `2px solid ${color}`,
        borderTop: `4px solid ${color}`,
        color: '#1f2937',
        borderRadius: 10,
        minWidth: isStart || isEnd ? '90px' : isCondition ? '200px' : '140px',
        padding: isStart || isEnd ? '4px 8px' : '8px 10px',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <div className="node-label" style={{ fontSize: 12, marginBottom: summaryRows.length > 0 ? 3 : 0, flexShrink: 0, gap: 5, fontWeight: 500 }}>
        <span className="node-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
          {GlyphIcon ? <GlyphIcon size={15} color={color} strokeWidth={2.5} /> : null}
        </span>
        <span>{displayLabel}</span>
      </div>
      {summaryRows.length > 0 && (
        <div style={{ fontSize: 10, lineHeight: 1.4, width: '100%', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden', marginTop: 2 }}>
          {summaryRows.map((row, i) => (
            <div key={i} style={{ width: '100%', flexShrink: 0 }}>
              {i > 0 && <div style={{ fontSize: 8, color: '#9ca3af', textAlign: 'center', lineHeight: '12px' }}>
                {data.logicOp === '||' ? '── OR ──' : '── AND ──'}
              </div>}
              <div style={{
                background: '#f3f4f6',
                borderRadius: 4,
                padding: '1px 6px',
                textAlign: 'center',
                fontSize: 10,
                color: '#4b5563',
              }}>
                {row.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function selectCell(graph, cellId) {
  if (!graph) return
  graph.getNodes().forEach((n) => {
    graph.findViewByCell(n.id)?.removeClass('selected')
  })
  graph.getEdges().forEach((e) => {
    graph.findViewByCell(e.id)?.removeClass('selected')
  })
  if (cellId) {
    graph.findViewByCell(cellId)?.addClass('selected')
  }
}

function adjustColor(hex, amount) {
  try {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, Math.max(0, ((num >> 16) & 0xFF) + amount))
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + amount))
    const b = Math.min(255, Math.max(0, (num & 0xFF) + amount))
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
  } catch { return hex }
}

const PORT_ATTRS = {
  circle: { r: 5, magnet: true, fill: '#fff', stroke: '#94a3b8', strokeWidth: 2.5, cursor: 'crosshair' },
}

function getPortDef(shape) {
  return {
    groups: {
      top: { position: 'top', attrs: PORT_ATTRS, zIndex: 10 },
      right: { position: 'right', attrs: PORT_ATTRS, zIndex: 10 },
      bottom: { position: 'bottom', attrs: PORT_ATTRS, zIndex: 10 },
      left: { position: 'left', attrs: PORT_ATTRS, zIndex: 10 },
    },
    items: [
      { group: 'top', id: 'top' },
      { group: 'right', id: 'right' },
      { group: 'bottom', id: 'bottom' },
      { group: 'left', id: 'left' },
    ],
  }
}

NODE_DEFINITIONS.forEach((def) => {
  const isCond = def.type === 'condition'
  const isSmall = def.type === 'start' || def.type === 'end'
  const isReturn = def.type === 'return'
  register({
    shape: def.type,
    component: NodeContainer,
    width: isCond ? 210 : isReturn ? 140 : isSmall ? 110 : 150,
    height: isCond ? 200 : isReturn ? 80 : isSmall ? 50 : 80,
    inherit: 'react-shape',
    ports: getPortDef(def.type),
    effect: ['data'],
  })
})

function Canvas() {
  const containerRef = useRef(null)
  const graphRef = useRef(null)
  const dragOverCount = useRef(0)

  const setGraph = useStore((s) => s.setGraph)
  const setSelectedNode = useStore((s) => s.setSelectedNode)
  const pushHistory = useStore((s) => s.pushHistory)
  const setQlExpression = useStore((s) => s.setQlExpression)
  const customFields = useStore((s) => s.customFields)
  const canvasData = useStore((s) => s.canvasData)
  const qlExpression = useStore((s) => s.qlExpression)
  const currentRuleId = useStore((s) => s.currentRuleId)
  const setCurrentRuleId = useStore((s) => s.setCurrentRuleId)
  const setRules = useStore((s) => s.setRules)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const historyIndex = useStore((s) => s.historyIndex)
  const history = useStore((s) => s.history)

  const generateQL = useCallback(() => {
    const g = graphRef.current
    if (!g) return
    try {
      const raw = g.toJSON()
      // X6 v3 toJSON() returns { cells: [...] }, convert to { nodes, edges }
      const cells = raw.cells || raw
      const nodes = []
      const edges = []
      if (Array.isArray(cells)) {
        cells.forEach((c) => {
          if (c.shape === 'edge' || c.edge === true) {
            edges.push(c)
          } else {
            nodes.push(c)
          }
        })
      }
      setQlExpression(generateQLFromCanvas({ nodes, edges }, customFields))
    } catch (e) { console.warn('QL error:', e) }
  }, [customFields, setQlExpression])

  useEffect(() => {
    if (!containerRef.current || graphRef.current) return

    const container = containerRef.current
    const graph = new Graph({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 600,
      grid: { visible: true, size: 20, type: 'doubleMesh' },
      panning: { enabled: true, eventTypes: ['leftMouseDown', 'rightMouseDown'] },
      mousewheel: { enabled: true, zoomAtMousePosition: true, factor: 1.1 },
      connecting: {
        allowBlank: false,
        allowLoop: false,
        allowMulti: true,
        highlight: true,
        router: { name: 'manhattan' },
        connector: { name: 'rounded' },
        createEdge() {
          return new Shape.Edge({
            attrs: {
              line: { stroke: '#91d5ff', strokeWidth: 2.5, targetMarker: { name: 'block', args: { size: 8 } }, strokeDasharray: null },
            },
            zIndex: 100,
          })
        },
        validateConnection({ sourceView, targetView, sourceMagnet, targetMagnet }) {
          if (!sourceMagnet) return false
          if (!targetMagnet && !targetView) return false
          if (sourceView === targetView) return false

          const sourceNode = sourceView.cell
          const targetNode = targetView.cell
          const g = sourceView.graph

          if (targetNode.shape === 'start') return false
          if (sourceNode.shape === 'end' || sourceNode.shape === 'return') return false

          if (hasCycle(g, sourceNode.id, targetNode.id)) return false

          const committedEdges = g.getEdges().filter(
            (e) => e.getSourceCellId() && e.getTargetCellId()
          )

          // Sibling check: nodes sharing same parent cannot connect (exception: return node)
          if (targetNode.shape !== 'return') {
            const sourceParents = committedEdges.filter((e) => e.getTargetCellId() === sourceNode.id).map((e) => e.getSourceCellId())
            const targetParents = committedEdges.filter((e) => e.getTargetCellId() === targetNode.id).map((e) => e.getSourceCellId())
            if (sourceParents.some((pid) => targetParents.includes(pid))) return false
          }

          const outEdges = committedEdges.filter((e) => e.getSourceCellId() === sourceNode.id)
          const outToNonReturn = outEdges.filter((e) => {
            const t = g.getCellById(e.getTargetCellId())
            return t && t.shape !== 'return'
          })
          if (sourceNode.shape === 'condition' || sourceNode.shape === 'no_points') {
            if (outEdges.length >= 2) return false
            if (targetNode.shape === 'return' && outEdges.length === 0) return false
            if (targetNode.shape === 'end') return false
          } else {
            if (outToNonReturn.length > 0) return false
          }

          const inEdges = committedEdges.filter((e) => e.getTargetCellId() === targetNode.id)
          if (targetNode.shape === 'end' && inEdges.length >= 1) return false

          return true
        },

      },
      interacting: { edgeLabelMovable: false },
    })

    graphRef.current = graph
    setGraph(graph)

    // Force resize after layout settles
    const doResize = () => {
      if (containerRef.current && graphRef.current) {
        const c = containerRef.current
        graphRef.current.resize(c.clientWidth || 800, c.clientHeight || 600)
      }
    }
    requestAnimationFrame(doResize)
    setTimeout(doResize, 500)

    graph.on('node:click', ({ node }) => {
      selectCell(graph, node.id)
      setSelectedNode({ id: node.id, shape: node.shape, data: node.getData() })
    })
    graph.on('edge:click', ({ edge }) => {
      selectCell(graph, edge.id)
      setSelectedNode({ id: edge.id, shape: 'edge', data: edge.getData() })
    })
    graph.on('blank:click', () => {
      selectCell(graph, null)
      setSelectedNode(null)
    })
    graph.on('node:added', generateQL)
    graph.on('node:removed', () => { setSelectedNode(null); generateQL() })
    graph.on('edge:added', (args) => { generateQL(); onEdgeAdded(args, graph) })
    graph.on('cell:change:target', ({ cell }) => {
      if (cell.isEdge()) onEdgeAdded({ edge: cell }, graph)
    })
    graph.on('edge:removed', generateQL)
    graph.on('node:change:data', generateQL)
    graph.on('edge:change:data', generateQL)

    graph.on('node:added', () => pushHistory(graph.toJSON()))
    graph.on('node:removed', () => pushHistory(graph.toJSON()))
    graph.on('edge:added', () => pushHistory(graph.toJSON()))
    graph.on('edge:removed', () => pushHistory(graph.toJSON()))

    graph.on('edge:dblclick', ({ edge }) => {
      const labels = edge.getLabels()
      const current = labels[0]?.attrs?.labelText?.text || '分支说明'
      const newLabel = prompt('编辑分支说明:', current)
      if (newLabel && newLabel !== current) {
        edge.setLabels([{
          ...labels[0],
          attrs: {
            labelBg: { ...labels[0]?.attrs?.labelBg, fill: '#fff', stroke: '#d9d9d9', rx: 3 },
            labelText: { ...labels[0]?.attrs?.labelText, text: newLabel },
          },
        }])
        edge.setData({ ...(edge.getData() || {}), label: newLabel })
        generateQL()
        pushHistory(graph.toJSON())
      }
    })

    const handleDragOver = (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
      const indicator = container.querySelector('.canvas-drop-indicator')
      if (indicator) indicator.classList.add('active')
      dragOverCount.current++
    }
    const handleDragLeave = (e) => {
      dragOverCount.current--
      if (dragOverCount.current <= 0) {
        const indicator = container.querySelector('.canvas-drop-indicator')
        if (indicator) indicator.classList.remove('active')
        dragOverCount.current = 0
      }
    }
    const handleDrop = (e) => {
      e.preventDefault()
      const indicator = container.querySelector('.canvas-drop-indicator')
      if (indicator) indicator.classList.remove('active')
      dragOverCount.current = 0

      try {
        const nodeDef = JSON.parse(e.dataTransfer.getData('application/json'))
        if (!nodeDef.draggable) { message.info('该节点已固定在画布上'); return }
        const rect = container.getBoundingClientRect()
        const x = e.clientX - rect.left - 75
        const y = e.clientY - rect.top - 25
        graph.addNode({
          shape: nodeDef.type,
          id: `${nodeDef.type}_${Date.now()}`,
          x: Math.max(0, x), y: Math.max(0, y),
          data: { label: nodeDef.label, color: nodeDef.color },
        })
      } catch (err) { console.warn('Drop error:', err) }
    }

    container.addEventListener('dragover', handleDragOver)
    container.addEventListener('dragleave', handleDragLeave)
    container.addEventListener('drop', handleDrop)

    graph.addNode({
      shape: 'start', id: 'start_default',
      x: 280, y: 40,
      data: { label: '开始-交易积分核算', color: '#22c55e' },
    })
    graph.addNode({
      shape: 'end', id: 'end_default',
      x: 280, y: 560,
      data: { label: '输出最终积分', color: '#6366f1' },
    })

    pushHistory(graph.toJSON())

    setTimeout(() => {
      if (graphRef.current && containerRef.current) {
        const c = containerRef.current
        if (c.clientWidth > 0 && c.clientHeight > 0) {
          graphRef.current.resize(c.clientWidth, c.clientHeight)
        }
      }
    }, 300)

    const handleResize = () => {
      if (graphRef.current && containerRef.current) {
        graphRef.current.resize(containerRef.current.clientWidth, containerRef.current.clientHeight)
      }
    }
    const ro = new ResizeObserver(handleResize)
    ro.observe(container)
    window.addEventListener('resize', handleResize)

    return () => {
      container.removeEventListener('dragover', handleDragOver)
      container.removeEventListener('dragleave', handleDragLeave)
      container.removeEventListener('drop', handleDrop)
      ro.disconnect()
      window.removeEventListener('resize', handleResize)
      graphRef.current = null
      setGraph(null)
      graph.dispose()
    }
  }, [])

  function resizeGraph() {
    if (graphRef.current && containerRef.current) {
      graphRef.current.resize(containerRef.current.clientWidth || containerRef.current.offsetWidth, containerRef.current.clientHeight || containerRef.current.offsetHeight)
    }
  }

  useEffect(() => {
    if (!graphRef.current) return
    const saved = localStorage.getItem('ruleCanvasData')
    const loadData = canvasData || (saved ? JSON.parse(saved) : null)
    if (loadData) {
      try { graphRef.current.fromJSON(loadData); resizeGraph(); generateQL() } catch (e) { /* ignore */ }
    }
  }, [graphRef.current])

  useEffect(() => {
    if (!graphRef.current || !canvasData) return
    try {
      graphRef.current.fromJSON(canvasData)
      pushHistory(canvasData)
      setTimeout(() => { resizeGraph(); generateQL() }, 100)
    } catch (e) { /* ignore */ }
  }, [canvasData])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!graphRef.current) return
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (historyIndex > 0) { const data = undo(); if (data) graphRef.current.fromJSON(data) }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        if (historyIndex < history.length - 1) { const data = redo(); if (data) graphRef.current.fromJSON(data) }
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.target.closest('input, textarea, [contenteditable]')) {
        const sn = useStore.getState().selectedNode
        if (!sn) return
        const cell = graphRef.current.getCellById(sn.id)
        if (!cell) return
        if (sn.id === 'start_default' || sn.id === 'end_default') {
          message.warning('开始和终点节点不能删除'); return
        }
        if (cell.shape === 'start' || cell.shape === 'end') {
          message.warning('开始和终点节点不能删除'); return
        }
        // If deleting one edge from paired Y/N, remove both
        if (cell.isEdge && cell.isEdge()) {
          const srcId = cell.getSourceCellId()
          if (srcId) {
            const src = graphRef.current.getCellById(srcId)
            if (src && (src.shape === 'condition' || src.shape === 'no_points')) {
              const all = graphRef.current.getEdges().filter((e) => e.getSourceCellId() === srcId)
              if (all.length === 2) {
                all.forEach((e) => graphRef.current.removeCell(e.id))
                selectCell(graphRef.current, null)
                setSelectedNode(null)
                message.info('已同时删除 Y/N 两条分支')
                return
              }
            }
          }
        }
        graphRef.current.removeCell(sn.id)
        selectCell(graphRef.current, null)
        setSelectedNode(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [historyIndex, history.length, undo, redo])

  const handleZoomIn = () => { if (graphRef.current) graphRef.current.zoom(0.1) }
  const handleZoomOut = () => { if (graphRef.current) graphRef.current.zoom(-0.1) }
  const handleZoomFit = () => { if (graphRef.current) graphRef.current.zoomToFit({ padding: 20 }) }

  const handleAutoLayout = useCallback(() => {
    const g = graphRef.current
    if (!g) return
    const nodes = g.getNodes()
    if (nodes.length === 0) return
    const edges = g.getEdges()
    const nodeMap = {}
    nodes.forEach((n) => { nodeMap[n.id] = n })
    const inDeg = {}
    nodes.forEach((n) => { inDeg[n.id] = 0 })
    edges.forEach((e) => {
      const target = e.getTargetCellId()
      if (inDeg[target] !== undefined) inDeg[target]++
    })
    const startNode = nodes.find((n) => inDeg[n.id] === 0 && n.shape === 'start')
    const startId = startNode ? startNode.id : nodes[0].id
    
    // BFS assign levels
    const levels = {}
    const parentMap = {}
    const queue = [{ id: startId, level: 0 }]
    const visited = new Set()
    while (queue.length > 0) {
      const { id, level } = queue.shift()
      if (visited.has(id)) continue
      visited.add(id)
      if (!levels[level]) levels[level] = []
      levels[level].push(id)
      const outEdges = edges.filter((e) => e.getSourceCellId() === id)
      outEdges.forEach((e) => {
        const tid = e.getTargetCellId()
        if (!visited.has(tid)) {
          queue.push({ id: tid, level: level + 1 })
          if (!parentMap[tid]) parentMap[tid] = []
          parentMap[tid].push(id)
        }
      })
    }

    // Order nodes per level to minimize edge crossings (barycenter heuristic)
    const sortedLevels = Object.keys(levels).sort((a, b) => a - b)
    sortedLevels.forEach((level) => {
      const lvl = parseInt(level)
      if (lvl === 0) return
      const ids = levels[level]
      // Calculate barycenter: average X position of parent nodes
      ids.sort((a, b) => {
        const parentsA = parentMap[a] || []
        const parentsB = parentMap[b] || []
        const avgX = (ids) => {
          const positions = ids.map((id) => {
            const p = nodeMap[id]
            return p ? p.getPosition().x : 0
          }).filter((x) => x > 0)
          return positions.length > 0 ? positions.reduce((s, x) => s + x, 0) / positions.length : 0
        }
        return avgX(parentsA) - avgX(parentsB)
      })
      levels[level] = ids
    })

    // Position nodes
    const gap = 180
    const vGap = 110
    sortedLevels.forEach((level) => {
      const ids = levels[level]
      const totalW = ids.length * gap
      ids.forEach((id, i) => {
        const n = nodeMap[id]
        if (n) {
          n.position(80 + i * gap - totalW / 2 + gap / 2, 40 + parseInt(level) * (60 + vGap))
        }
      })
    })
    pushHistory(g.toJSON())
    message.success('自动排版完成')
  }, [pushHistory])

  const fileInputRef = useRef(null)
  const [searchText, setSearchText] = useState('')
  const [searchOptions, setSearchOptions] = useState([])
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [ruleName, setRuleName] = useState('')
  const [creator, setCreator] = useState('admin')
  const [saving, setSaving] = useState(false)

  const handleSearchChange = useCallback((value) => {
    setSearchText(value)
    if (!value.trim() || !graphRef.current) {
      setSearchOptions([])
      return
    }
    const q = value.trim().toLowerCase()
    const cells = graphRef.current.getCells()
    const results = []
    cells.forEach((cell) => {
      if (cell.shape !== 'condition') return
      const data = cell.getData() || {}
      const label = (data.label || '').toLowerCase()
      if (label.includes(q)) {
        results.push({ value: cell.id, label: data.label || '交易条件分流' })
      }
    })
    setSearchOptions(results)
  }, [])

  const handleSaveClick = useCallback(() => {
    if (!graphRef.current) return
    setSaveModalOpen(true)
    if (!ruleName) {
      const nodes = graphRef.current.getCells()
      const start = nodes.find((n) => n.shape === 'start')
      setRuleName(start?.getData()?.label || '未命名规则')
    }
  }, [ruleName])

  useEffect(() => {
    if (currentRuleId && !creator) {
      setCreator('admin')
    }
  }, [currentRuleId])

  const handleSubmit = useCallback(async () => {
    if (!graphRef.current || !ruleName.trim()) {
      message.warning('请输入规则名称')
      return
    }
    setSaving(true)
    try {
      const canvasJson = JSON.stringify(graphRef.current.toJSON())
      const url = currentRuleId ? `/api/rules/${currentRuleId}` : '/api/rules'
      const method = currentRuleId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ruleName.trim(),
          creator: creator.trim() || 'admin',
          canvasJson,
          qlExpression,
          customFields: customFields.map((f) => ({
            id: f.id, name: f.name, type: f.type, category: f.category, preset: f.preset,
          })),
        }),
      })
      if (res.ok) {
        const saved = await res.json()
        if (!currentRuleId) setCurrentRuleId(saved.id)
        message.success('规则已保存')
        setSaveModalOpen(false)
        fetch('/api/rules').then((r) => r.json()).then(setRules).catch(() => {})
      } else {
        message.error('保存失败')
      }
    } catch (e) {
      message.error('保存失败: ' + e.message)
    } finally {
      setSaving(false)
    }
  }, [ruleName, qlExpression, customFields, currentRuleId, setCurrentRuleId, setRules])

  const handleSearchSelect = useCallback((value) => {
    if (!graphRef.current) return
    const cell = graphRef.current.getCellById(value)
    if (cell) {
      graphRef.current.centerCell(cell)
      graphRef.current.cleanSelection()
      graphRef.current.select(cell)
    }
    setSearchText('')
    setSearchOptions([])
  }, [])

  return (
    <div className="canvas-wrapper">
      <div className="canvas-toolbar">
        <div className="canvas-toolbar-left">
          <Tooltip title="缩小"><Button size="small" icon={<ZoomOutOutlined />} onClick={handleZoomOut} /></Tooltip>
          <Tooltip title="放大"><Button size="small" icon={<ZoomInOutlined />} onClick={handleZoomIn} /></Tooltip>
          <Tooltip title="适应画布"><Button size="small" icon={<ExpandOutlined />} onClick={handleZoomFit} /></Tooltip>
          <Tooltip title="自动排版"><Button size="small" icon={<NodeIndexOutlined />} onClick={handleAutoLayout}>排版</Button></Tooltip>
          <span className="info-text">← 拖组件 · 节点圆圈拖出连线 · 拖拽空白平移 · 滚轮缩放 · 选中后Delete删除</span>
        </div>
        <div className="canvas-toolbar-right">
          <AutoComplete
            value={searchText}
            options={searchOptions}
            onSearch={handleSearchChange}
            onSelect={handleSearchSelect}
            style={{ width: 160 }}
            placeholder="搜索条件分流节点..."
            allowClear
          >
            <Input size="small" prefix={<SearchOutlined />} />
          </AutoComplete>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = (ev) => {
                try {
                  const data = JSON.parse(ev.target.result)
                  graphRef.current?.fromJSON(data)
                  pushHistory(data)
                  setTimeout(() => { resizeGraph(); generateQL() }, 100)
                  message.success('规则导入成功')
                } catch (err) {
                  message.error('导入失败：JSON格式错误')
                }
              }
              reader.readAsText(file)
              e.target.value = ''
            }}
          />
          <Button size="small" icon={<DownloadOutlined />} onClick={() => {
            if (!graphRef.current) return
            const json = JSON.stringify(graphRef.current.toJSON(), null, 2)
            const blob = new Blob([json], { type: 'application/json' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `rule_${Date.now()}.json`
            a.click()
            URL.revokeObjectURL(a.href)
            message.success('规则JSON已导出')
          }}>导出</Button>
          <Button size="small" icon={<FolderOpenOutlined />} onClick={() => fileInputRef.current?.click()}>导入</Button>
          <Button size="small" type="primary" icon={<UploadOutlined />} onClick={handleSaveClick}>提交</Button>
        </div>
      </div>
      <div className="canvas-container" ref={containerRef}>
        <div className="canvas-drop-indicator" />
      </div>
      <Modal
        title="提交规则"
        open={saveModalOpen}
        onOk={handleSubmit}
        onCancel={() => setSaveModalOpen(false)}
        confirmLoading={saving}
        okText="提交"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>规则名称</div>
            <Input
              placeholder="请输入规则名称"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              onPressEnter={handleSubmit}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>创建人</div>
            <Input
              placeholder="请输入创建人"
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
            />
          </div>
          {currentRuleId && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>规则 ID</div>
              <Input value={String(currentRuleId)} disabled />
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

function onEdgeAdded({ edge }, graph) {
  if (!edge.isEdge()) return
  const sourceId = edge.getSourceCellId()
  const targetId = edge.getTargetCellId()
  if (!sourceId || !targetId) return

  const labels = edge.getLabels()
  if (labels.length > 0) return

  const sourceCell = graph.getCellById(sourceId)
  if (!sourceCell || (sourceCell.shape !== 'condition' && sourceCell.shape !== 'no_points')) return

  const edges = graph.getEdges().filter((e) => e.getSourceCellId() === sourceId)
  const idx = edges.indexOf(edge)
  if (idx < 0 || idx > 1) return

  const label = idx === 0 ? 'Y' : 'N'
  const color = idx === 0 ? '#52c41a' : '#ff4d4f'
  const bgColor = idx === 0 ? '#f6ffed' : '#fff2f0'
  edge.setLabels([{
    markup: [
      { tagName: 'rect', selector: 'labelBg' },
      { tagName: 'text', selector: 'labelText' },
    ],
    attrs: {
      labelBg: { ref: 'labelText', refWidth: '200%', refHeight: '200%', refX: '-50%', refY: '-50%', fill: bgColor, stroke: color, rx: 4, strokeWidth: 1.5 },
      labelText: { text: label, fontSize: 14, fill: color, textAnchor: 'middle', fontWeight: 'bold' },
    },
    position: 0.5,
  }])
  edge.setData({ ...(edge.getData() || {}), label })
}

function hasCycle(graph, sourceId, targetId) {
  const visited = new Set()
  function dfs(nodeId) {
    if (nodeId === sourceId) return true
    if (visited.has(nodeId)) return false
    visited.add(nodeId)
    const outEdges = graph.getEdges().filter((e) => e.getSourceCellId() === nodeId)
    for (const e of outEdges) {
      if (dfs(e.getTargetCellId())) return true
    }
    return false
  }
  return dfs(targetId)
}

// Auto-layout helper (exposed to App.jsx via store or ref)
Canvas.handleAutoLayout = (graph, containerWidth) => {
  if (!graph) return
  const nodes = graph.getNodes()
  if (nodes.length === 0) return
  const edges = graph.getEdges()
  const nodeMap = {}
  nodes.forEach((n) => { nodeMap[n.id] = n })
  const inDeg = {}
  nodes.forEach((n) => { inDeg[n.id] = 0 })
  edges.forEach((e) => {
    const target = e.getTargetCellId()
    if (inDeg[target] !== undefined) inDeg[target]++
  })
  const startNode = nodes.find((n) => inDeg[n.id] === 0 && n.shape === 'start')
  const startId = startNode ? startNode.id : nodes[0].id
  const levels = {}
  const queue = [{ id: startId, level: 0 }]
  const visited = new Set()
  while (queue.length > 0) {
    const { id, level } = queue.shift()
    if (visited.has(id)) continue
    visited.add(id)
    if (!levels[level]) levels[level] = []
    levels[level].push(id)
    const outEdges = edges.filter((e) => e.getSourceCellId() === id)
    outEdges.forEach((e) => {
      const tid = e.getTargetCellId()
      if (!visited.has(tid)) queue.push({ id: tid, level: level + 1 })
    })
  }
  const gap = 160
  const vGap = 100
  Object.keys(levels).forEach((level) => {
    const ids = levels[level]
    const totalW = ids.length * gap
    ids.forEach((id, i) => {
      const n = nodeMap[id]
      if (n) {
        n.position(80 + i * gap - totalW / 2 + gap / 2, 40 + parseInt(level) * (60 + vGap))
      }
    })
  })
  message.success('自动排版完成')
}

export default Canvas
