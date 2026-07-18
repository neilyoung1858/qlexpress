import { useEffect, useCallback } from 'react'
import { ConfigProvider, Button, Tooltip, message } from 'antd'
import { UndoOutlined, RedoOutlined, NodeIndexOutlined, SaveOutlined, SettingOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { getProvider } from '@antv/x6-react-shape'
import Sidebar from './components/Sidebar'
import Canvas from './components/Canvas'
import RightPanel from './components/RightPanel'
import FieldModal from './components/FieldModal'
import SimulatePanel from './components/SimulatePanel'
import useStore from './store/useStore'
import './App.css'

const PortalProvider = getProvider()

function App() {
  const graph = useStore((s) => s.graph)
  const setFieldModalVisible = useStore((s) => s.setFieldModalVisible)
  const setSimulateVisible = useStore((s) => s.setSimulateVisible)
  const simulateVisible = useStore((s) => s.simulateVisible)
  const pushHistory = useStore((s) => s.pushHistory)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const historyIndex = useStore((s) => s.historyIndex)
  const history = useStore((s) => s.history)

  const handleAutoLayout = useCallback(() => {
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
    pushHistory(graph.toJSON())
    message.success('自动排版完成')
  }, [graph, pushHistory])

  const handleSave = useCallback(() => {
    if (!graph) return
    const data = graph.toJSON()
    localStorage.setItem('ruleCanvasData', JSON.stringify(data, null, 2))
    message.success('规则已保存到本地')
  }, [graph])

  const handleUndo = useCallback(() => {
    if (!graph || historyIndex <= 0) return
    const data = undo()
    if (data) { graph.fromJSON(data); message.info('已撤销') }
  }, [graph, historyIndex, undo])

  const handleRedo = useCallback(() => {
    if (!graph || historyIndex >= history.length - 1) return
    const data = redo()
    if (data) { graph.fromJSON(data); message.info('已重做') }
  }, [graph, historyIndex, history, redo])

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4f6ef7',
          borderRadius: 6,
          fontSize: 13,
        },
      }}
    >
      <div className="app-header">
        <div className="app-header-left">
          <div className="brand">
            <h1>积分规则引擎</h1>
            <span className="subtitle">QLExpress 可视化配置平台</span>
          </div>
        </div>
        <div className="app-header-center">
          <Tooltip title="撤销 Ctrl+Z">
            <Button size="small" icon={<UndoOutlined />} disabled={historyIndex <= 0} onClick={handleUndo} />
          </Tooltip>
          <Tooltip title="重做 Ctrl+Shift+Z">
            <Button size="small" icon={<RedoOutlined />} disabled={historyIndex >= history.length - 1} onClick={handleRedo} />
          </Tooltip>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
          <Tooltip title="一键自动排版">
            <Button size="small" icon={<NodeIndexOutlined />} onClick={handleAutoLayout}>自动排版</Button>
          </Tooltip>
        </div>
        <div className="app-header-right">
          <Tooltip title="管理自定义字段">
            <Button size="small" icon={<SettingOutlined />} onClick={() => setFieldModalVisible(true)}>管理字段</Button>
          </Tooltip>
          <Tooltip title="模拟试算交易">
            <Button size="small" icon={<ThunderboltOutlined />} onClick={() => setSimulateVisible(!simulateVisible)}>模拟试算</Button>
          </Tooltip>
          <Tooltip title="保存规则到本地">
            <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleSave}>保存</Button>
          </Tooltip>
        </div>
      </div>
      <div className="app-body">
        <Sidebar />
        <Canvas />
        <RightPanel />
      </div>
      <FieldModal />
      {simulateVisible && <SimulatePanel />}
      <PortalProvider />
    </ConfigProvider>
  )
}

export default App
