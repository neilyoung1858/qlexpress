import { useEffect, useRef, useCallback } from 'react'
import { Graph, Shape } from '@antv/x6'
import { Button, message, Tooltip } from 'antd'
import { 
  UndoOutlined, RedoOutlined, 
  AlignCenterOutlined, CopyOutlined, 
  PlayCircleOutlined, SaveOutlined 
} from '@ant-design/icons'
import useStore from '../store/useStore'
import { NODE_TYPES, SYSTEM_FIELDS } from '../config/nodes'
import { generateQLFromCanvas, generateQLShort } from '../utils/qlGenerator'

// Register custom nodes
function registerNodes() {
  Graph.registerNode('start', {
    inherit: 'rect',
    width: 180,
    height: 50,
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'text', selector: 'label' },
    ],
    attrs: {
      body: {
        fill: '#f6ffed',
        stroke: '#52c41a',
        strokeWidth: 2,
        rx: 25,
        ry: 25,
      },
      label: {
        text: '开始-交易积分核算',
        fill: '#135200',
        fontSize: 14,
        fontWeight: 'bold',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
      },
    },
    ports: {
      groups: {
        bottom: {
          position: 'bottom',
          attrs: { circle: { r: 6, magnet: true, stroke: '#52c41a', fill: '#fff', strokeWidth: 2 } },
        },
      },
      items: [{ group: 'bottom' }],
    },
  })

  Graph.registerNode('condition', {
    inherit: 'polygon',
    width: 180,
    height: 70,
    markup: [
      { tagName: 'polygon', selector: 'body' },
      { tagName: 'text', selector: 'label' },
    ],
    attrs: {
      body: {
        fill: '#fff7e6',
        stroke: '#fa8c16',
        strokeWidth: 2,
        refPoints: '0,35 90,0 180,35 90,70',
      },
      label: {
        text: '交易条件分流',
        fill: '#d46b08',
        fontSize: 12,
        fontWeight: 'bold',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
      },
    },
    ports: {
      groups: {
        top: {
          position: 'top',
          attrs: { circle: { r: 6, magnet: true, stroke: '#fa8c16', fill: '#fff', strokeWidth: 2 } },
        },
        bottom: {
          position: {
            name: 'absolute',
            args: { x: '50%' },
          },
          attrs: { circle: { r: 6, magnet: true, stroke: '#fa8c16', fill: '#fff', strokeWidth: 2 } },
        },
      },
      items: [
        { group: 'top' },
        { group: 'bottom', id: 'b1' },
      ],
    },
  })

  Graph.registerNode('calculate', {
    inherit: 'rect',
    width: 180,
    height: 60,
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'text', selector: 'label' },
    ],
    attrs: {
      body: {
        fill: '#e6f7ff',
        stroke: '#1890ff',
        strokeWidth: 2,
        rx: 4,
        ry: 4,
      },
      label: {
        text: '多倍积分计算',
        fill: '#0050b3',
        fontSize: 13,
        fontWeight: 'bold',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
      },
    },
    ports: {
      groups: {
        top: { position: 'top', attrs: { circle: { r: 6, magnet: true, stroke: '#1890ff', fill: '#fff', strokeWidth: 2 } } },
        bottom: { position: 'bottom', attrs: { circle: { r: 6, magnet: true, stroke: '#1890ff', fill: '#fff', strokeWidth: 2 } } },
      },
      items: [{ group: 'top' }, { group: 'bottom' }],
    },
  })

  Graph.registerNode('no_points', {
    inherit: 'rect',
    width: 180,
    height: 60,
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'text', selector: 'label' },
    ],
    attrs: {
      body: {
        fill: '#fff2f0',
        stroke: '#ff4d4f',
        strokeWidth: 2,
        rx: 4,
        ry: 4,
      },
      label: {
        text: '无积分拦截',
        fill: '#a8071a',
        fontSize: 13,
        fontWeight: 'bold',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
      },
    },
    ports: {
      groups: {
        top: { position: 'top', attrs: { circle: { r: 6, magnet: true, stroke: '#ff4d4f', fill: '#fff', strokeWidth: 2 } } },
        bottom: { position: 'bottom', attrs: { circle: { r: 6, magnet: true, stroke: '#ff4d4f', fill: '#fff', strokeWidth: 2 } } },
      },
      items: [{ group: 'top' }, { group: 'bottom' }],
    },
  })

  Graph.registerNode('deduction', {
    inherit: 'rect',
    width: 180,
    height: 60,
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'text', selector: 'label' },
    ],
    attrs: {
      body: {
        fill: '#f9f0ff',
        stroke: '#722ed1',
        strokeWidth: 2,
        rx: 4,
        ry: 4,
      },
      label: {
        text: '积分扣减',
        fill: '#391063',
        fontSize: 13,
        fontWeight: 'bold',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
      },
    },
    ports: {
      groups: {
        top: { position: 'top', attrs: { circle: { r: 6, magnet: true, stroke: '#722ed1', fill: '#fff', strokeWidth: 2 } } },
        bottom: { position: 'bottom', attrs: { circle: { r: 6, magnet: true, stroke: '#722ed1', fill: '#fff', strokeWidth: 2 } } },
      },
      items: [{ group: 'top' }, { group: 'bottom' }],
    },
  })

  Graph.registerNode('end', {
    inherit: 'circle',
    width: 60,
    height: 60,
    markup: [
      { tagName: 'circle', selector: 'body' },
      { tagName: 'text', selector: 'label' },
    ],
    attrs: {
      body: {
        fill: '#f6ffed',
        stroke: '#52c41a',
        strokeWidth: 2,
      },
      label: {
        text: '输出\n最终积分',
        fill: '#135200',
        fontSize: 12,
        fontWeight: 'bold',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
      },
    },
    ports: {
      groups: {
        top: { position: 'top', attrs: { circle: { r: 6, magnet: true, stroke: '#52c41a', fill: '#fff', strokeWidth: 2 } } },
      },
      items: [{ group: 'top' }],
    },
  })
}

registerNodes()

function FlowCanvas() {
  const containerRef = useRef(null)
  const graphRef = useRef(null)
  const {
    graph, setGraph, setSelectedNode, selectedNode,
    customFields, setQlExpression, setSimulateVisible,
    pushHistory, undo, redo, historyIndex, history,
  } = useStore()

  const updateQL = useCallback((g) => {
    const data = g.toJSON({ diff: true })
    const expr = generateQLFromCanvas(data, customFields)
    setQlExpression(expr)
  }, [customFields, setQlExpression])

  useEffect(() => {
    if (!containerRef.current || graphRef.current) return

    const graph = new Graph({
      container: containerRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      grid: { visible: true, type: 'doubleMesh', args: [{ color: '#f0f0f0', thickness: 1 }, { color: '#e0e0e0', thickness: 1 }] },
      panning: { enabled: true, eventTypes: ['rightMouseDown'] },
      mousewheel: { enabled: true, zoomAtMousePosition: true },
      connecting: {
        router: { name: 'manhattan' },
        connector: { name: 'rounded' },
        anchor: 'center',
        sourceAnchor: { name: 'bottom' },
        targetAnchor: { name: 'top' },
        allowBlank: false,
        allowLoop: false,
        allowNode: true,
        allowEdge: false,
        allowMulti: false,
        validateConnection({ sourceView, targetView, sourceMagnet, targetMagnet }) {
          if (sourceView === targetView) return false
          if (!targetMagnet) return false
          const targetNode = targetView.cell
          const sourceNode = sourceView.cell
          if (targetNode.shape === 'start') return false
          if (sourceNode.shape === 'end') return false
          if (targetNode.shape === 'condition' && targetMagnet.getAttribute('port') !== 'top') return false
          if (sourceNode.shape === 'condition') {
            const edges = graph.getEdges().filter((e) => e.getSourceCellId() === sourceNode.id)
            const conditionConfig = sourceNode.getData() || {}
            const maxBranches = conditionConfig.maxBranches || 4
            if (edges.length >= maxBranches) {
              message.warning(`条件分流最多 ${maxBranches} 条分支`)
              return false
            }
          }
          return true
        },
        createEdge() {
          return new Shape.Edge({
            attrs: {
              line: { stroke: '#91d5ff', strokeWidth: 2, targetMarker: { name: 'block', args: { size: 8 } } },
            },
            labels: [{
              attrs: {
                text: { text: '请输入分支说明...', fill: '#666', fontSize: 12 },
                rect: { fill: '#fff', stroke: '#91d5ff', rx: 4, ry: 4 },
              },
              position: 0.5,
            }],
          })
        },
      },
      highlighting: {
        magnetAvailable: { name: 'stroke', args: { color: '#52c41a', padding: 4 } },
      },
      interacting: {
        nodeMovable: (view) => {
          const node = view.cell
          return node.shape !== 'start'
        },
      },
    })

    // Plugins available in X6 v3: clipboard, history, snapline, selection
    // Install @antv/x6-plugin-* packages and use graph.use() to enable them

    // Add start node at the top center
    const startNode = graph.addNode({
      shape: 'start',
      id: 'start',
      x: (containerRef.current.clientWidth - 180) / 2,
      y: 40,
      data: { label: '开始-交易积分核算' },
    })

    // Add end node
    graph.addNode({
      shape: 'end',
      id: 'end',
      x: (containerRef.current.clientWidth - 60) / 2,
      y: 600,
      data: { label: '输出最终积分' },
    })

    // Node click - select
    graph.on('node:click', ({ node }) => {
      setSelectedNode(node)
    })

    graph.on('blank:click', () => {
      setSelectedNode(null)
    })

    // After add node
    graph.on('node:added', ({ node }) => {
      setSelectedNode(node)
      updateQL(graph)
    })

    graph.on('node:moveend', () => updateQL(graph))

    graph.on('edge:connected', ({ edge }) => {
      const label = `分支${graph.getEdges().filter((e) => e.getSourceCellId() === edge.getSourceCellId()).length}`
      edge.setLabels([{
        attrs: {
          text: { text: label, fill: '#666', fontSize: 12 },
          rect: { fill: '#fff', stroke: '#91d5ff', rx: 4, ry: 4 },
        },
      }])
      setTimeout(() => updateQL(graph), 100)
    })

    graph.on('edge:label:dblclick', ({ edge }) => {
      edge.setLabels([{
        attrs: {
          text: { text: '', fill: '#666', fontSize: 12 },
          rect: { fill: '#fff', stroke: '#91d5ff', rx: 4, ry: 4 },
        },
      }])
    })

    graph.on('change:*', () => updateQL(graph))

    graphRef.current = graph
    setGraph(graph)

    // Drop handler
    const container = containerRef.current
    const handleDrop = (e) => {
      e.preventDefault()
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'))
        const rect = container.getBoundingClientRect()
        const x = e.clientX - rect.left - 90
        const y = e.clientY - rect.top - 25

        const nodeMap = {
          condition: { shape: 'condition', w: 180, h: 70, color: '#fa8c16', label: '交易条件分流' },
          calculate: { shape: 'calculate', w: 180, h: 60, color: '#1890ff', label: '多倍积分计算' },
          no_points: { shape: 'no_points', w: 180, h: 60, color: '#ff4d4f', label: '无积分拦截' },
          deduction: { shape: 'deduction', w: 180, h: 60, color: '#722ed1', label: '积分扣减' },
        }

        const cfg = nodeMap[data.type]
        if (!cfg) return

        const node = graph.addNode({
          shape: cfg.shape,
          x: Math.max(0, Math.min(x, container.clientWidth - cfg.w)),
          y: Math.max(80, y),
          data: { label: cfg.label, maxBranches: 4, conditions: [] },
        })

        graph.cleanSelection()
        graph.select(node)
      } catch (err) {
        // ignore
      }
    }

    const handleDragOver = (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }

    container.addEventListener('drop', handleDrop)
    container.addEventListener('dragover', handleDragOver)

    return () => {
      container.removeEventListener('drop', handleDrop)
      container.removeEventListener('dragover', handleDragOver)
      graphRef.current = null
    }
  }, [])

  const handleUndo = () => {
    if (graphRef.current) {
      graphRef.current.undo()
      updateQL(graphRef.current)
    }
  }

  const handleRedo = () => {
    if (graphRef.current) {
      graphRef.current.redo()
      updateQL(graphRef.current)
    }
  }

  const handleAutoLayout = () => {
    if (!graphRef.current) return
    const nodes = graphRef.current.getNodes()
    const edges = graphRef.current.getEdges()

    const startNode = nodes.find((n) => n.shape === 'start')
    const endNode = nodes.find((n) => n.shape === 'end')
    const otherNodes = nodes.filter((n) => n.shape !== 'start' && n.shape !== 'end')

    if (startNode) {
      startNode.setPosition((containerRef.current.clientWidth - 180) / 2, 40)
    }

    const levels = {}
    function assignLevel(nodeId, level) {
      if (levels[nodeId] !== undefined && levels[nodeId] <= level) return
      levels[nodeId] = level
      const outEdges = edges.filter((e) => e.getSourceCellId() === nodeId)
      outEdges.forEach((edge) => {
        assignLevel(edge.getTargetCellId(), level + 1)
      })
    }

    if (startNode) assignLevel(startNode.id, 0)

    const levelNodes = {}
    Object.entries(levels).forEach(([nodeId, level]) => {
      if (!levelNodes[level]) levelNodes[level] = []
      const node = graphRef.current.getCellById(nodeId)
      if (node && node.shape !== 'start') {
        levelNodes[level].push(node)
      }
    })

    Object.entries(levelNodes).forEach(([level, levelNodeList]) => {
      const lvl = parseInt(level)
      const y = 120 + lvl * 130
      const count = levelNodeList.length
      const spacing = Math.min(250, (containerRef.current.clientWidth - 100) / Math.max(count, 1))
      const totalWidth = (count - 1) * spacing
      const startX = (containerRef.current.clientWidth - totalWidth) / 2

      levelNodeList.forEach((node, idx) => {
        const w = node.shape === 'end' ? 60 : 180
        node.setPosition(startX + idx * spacing - w / 2 + spacing / 2, y)
      })
    })

    if (endNode) {
      const lastLevel = Math.max(...Object.keys(levelNodes).map(Number), 0)
      endNode.setPosition((containerRef.current.clientWidth - 60) / 2, 120 + (lastLevel + 1) * 130)
    }

    updateQL(graphRef.current)
    message.success('自动排版完成')
  }

  const handleSave = async () => {
    if (!graphRef.current) return
    const data = graphRef.current.toJSON({ diff: true })
    try {
      const resp = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '积分规则_' + new Date().toLocaleString(),
          canvasJson: JSON.stringify(data),
          customFields: customFields,
          qlExpression: generateQLShort(data, customFields),
        }),
      })
      if (resp.ok) {
        message.success('规则保存成功')
      } else {
        message.error('保存失败')
      }
    } catch {
      message.error('后端服务未启动，请在本地保存')
      // Local save as fallback
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'rule.json'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleSimulate = () => {
    setSimulateVisible(true)
  }

  return (
    <div className="flow-canvas-wrapper">
      <div className="canvas-toolbar">
        <div className="toolbar-group">
          <Tooltip title="撤销">
            <Button icon={<UndoOutlined />} size="small" onClick={handleUndo} />
          </Tooltip>
          <Tooltip title="重做">
            <Button icon={<RedoOutlined />} size="small" onClick={handleRedo} />
          </Tooltip>
        </div>
        <div className="toolbar-group">
          <Tooltip title="自动排版">
            <Button icon={<AlignCenterOutlined />} size="small" onClick={handleAutoLayout}>自动排版</Button>
          </Tooltip>
        </div>
        <div className="toolbar-group">
          <Tooltip title="模拟试算">
            <Button icon={<PlayCircleOutlined />} size="small" onClick={handleSimulate}>模拟试算</Button>
          </Tooltip>
        </div>
        <div className="toolbar-group">
          <Tooltip title="保存规则">
            <Button icon={<SaveOutlined />} size="small" type="primary" onClick={handleSave}>保存</Button>
          </Tooltip>
        </div>
      </div>
      <div className="flow-canvas-container" ref={containerRef} />
    </div>
  )
}

export default FlowCanvas
