import { useState } from 'react'
import { Button, Input, InputNumber, Select, Drawer, message, Divider, Tag } from 'antd'
import { CloseOutlined, ThunderboltOutlined } from '@ant-design/icons'
import useStore from '../store/useStore'
import { SYSTEM_FIELDS } from '../config/nodes'

function SimulatePanel() {
  const visible = useStore((s) => s.simulateVisible)
  const setVisible = useStore((s) => s.setSimulateVisible)
  const graph = useStore((s) => s.graph)
  const customFields = useStore((s) => s.customFields)
  const allFields = [
    ...SYSTEM_FIELDS,
    ...customFields.filter((f) => f.status === 'active').map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      preset: f.preset || [],
    })),
  ]

  const [formValues, setFormValues] = useState({})
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)

  const handleFieldChange = (fieldId, value) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleRun = () => {
    if (!graph) {
      message.warning('画布未初始化')
      return
    }
    setRunning(true)

    // Simulate: walk through the graph and evaluate conditions
    const nodes = graph.getNodes()
    const edges = graph.getEdges()

    const nodeMap = {}
    nodes.forEach((n) => { nodeMap[n.id] = n })

    // Find start node
    const startNode = nodes.find((n) => n.shape === 'start')
    if (!startNode) {
      message.warning('未找到开始节点')
      setRunning(false)
      return
    }

    // Walk the graph
    const path = []
    const highlights = []
    let finalPoints = 0
    let currentNode = startNode
    const visited = new Set()

    while (currentNode) {
      if (visited.has(currentNode.id)) break
      visited.add(currentNode.id)

      const data = currentNode.getData() || {}
      path.push({ id: currentNode.id, shape: currentNode.shape, label: data.label || '', data })

      if (currentNode.shape === 'end') break

      const outEdges = edges.filter((e) => e.getSourceCellId() === currentNode.id)

      if (outEdges.length === 0) break

      let nextEdge = null
      if (currentNode.shape === 'condition') {
        // Evaluate conditions to find matching branch
        const conditions = data.conditions || []
        for (const edge of outEdges) {
          const edgeIdx = outEdges.indexOf(edge)
          const cond = conditions[edgeIdx]
          if (!cond) {
            // Default branch (else)
            nextEdge = edge
            highlights.push({ edgeId: edge.id, match: true, reason: '默认分支（else）' })
            break
          }
          const match = evaluateCondition(cond, formValues, currentNode)
          if (match) {
            nextEdge = edge
            highlights.push({ edgeId: edge.id, match: true, reason: getConditionDesc(cond, allFields) })
            break
          }
          highlights.push({ edgeId: edge.id, match: false, reason: getConditionDesc(cond, allFields) })
        }
        // If no condition matched, use first edge as fallback
        if (!nextEdge && outEdges.length > 0) {
          nextEdge = outEdges[outEdges.length - 1]
          highlights.push({ edgeId: nextEdge.id, match: true, reason: '默认（else）' })
        }
      } else {
        nextEdge = outEdges[0]
        if (currentNode.shape === 'calculate') {
          const amtField = data.amountField || 'tradeAmt'
          const amtVal = parseFloat(formValues[amtField]) || 0
          const rate = (data.rate != null && data.rate !== '') ? parseFloat(data.rate) : 1
          finalPoints = amtVal * rate
        } else if (currentNode.shape === 'no_points') {
          const nopField = data.nopField
          const nopValue = data.nopValue
          if (nopField && nopValue) {
            const fieldVal = String(formValues[nopField] ?? '')
            if (fieldVal !== nopValue) finalPoints = 0
          } else {
            finalPoints = 0
          }
        }
      }

      if (nextEdge) {
        const targetId = nextEdge.getTargetCellId()
        currentNode = nodeMap[targetId]
      } else {
        break
      }
    }

    setResult({ path, highlights, finalPoints })
    setRunning(false)
  }

  const handleReset = () => {
    setFormValues({})
    setResult(null)
  }

  const tradeAmtValue = formValues['tradeAmt']
  const hasTradeAmt = tradeAmtValue !== undefined && tradeAmtValue !== '' && tradeAmtValue !== null

  return (
    <Drawer
      title={
        <span>
          <ThunderboltOutlined style={{ marginRight: 8 }} />
          模拟试算
        </span>
      }
      open={visible}
      onClose={() => setVisible(false)}
      width={420}
      extra={<Button type="text" icon={<CloseOutlined />} onClick={() => setVisible(false)} />}
    >
      <div className="simulate-panel">
        <div style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>
          填写交易参数，模拟积分计算过程
        </div>

        {allFields.map((field) => (
          <div key={field.id} className="simulate-field-item">
            <label>{field.name}</label>
            {field.type === 'number' ? (
              <InputNumber
                style={{ width: '100%' }}
                size="small"
                placeholder={`输入${field.name}`}
                value={formValues[field.id]}
                onChange={(v) => handleFieldChange(field.id, v)}
              />
            ) : field.type === 'boolean' ? (
              <Select
                size="small"
                style={{ width: '100%' }}
                value={formValues[field.id] !== undefined ? (formValues[field.id] === true || formValues[field.id] === 'true' ? '是' : '否') : undefined}
                placeholder={`选择${field.name}`}
                onChange={(v) => handleFieldChange(field.id, v === '是')}
              >
                <Select.Option value="是">是</Select.Option>
                <Select.Option value="否">否</Select.Option>
              </Select>
            ) : field.type === 'enum' ? (
              <Select
                size="small"
                style={{ width: '100%' }}
                value={formValues[field.id]}
                placeholder={`选择${field.name}`}
                onChange={(v) => handleFieldChange(field.id, v)}
                allowClear
              >
                {(field.preset || []).map((opt) => (
                  <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                ))}
              </Select>
            ) : (
              <Input
                size="small"
                placeholder={`输入${field.name}`}
                value={formValues[field.id] || ''}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
              />
            )}
          </div>
        ))}

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={handleRun}
            loading={running}
            disabled={!hasTradeAmt}
          >
            开始试算
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </div>

        {result && (
          <div className="simulate-result">
            <Divider>试算结果</Divider>
            <div className="simulate-result-item highlight">
              <span className="simulate-label">最终积分</span>
              <span className="simulate-value">{Math.round(result.finalPoints * 100) / 100}</span>
            </div>
            <Divider style={{ fontSize: 12 }}>执行路径</Divider>
            {result.path.map((p, i) => (
              <div key={i} className="simulate-result-item" style={{ borderLeft: `3px solid ${getNodeColor(p.shape)}` }}>
                <span className="simulate-label">{i + 1}. {p.label}</span>
                <span className="simulate-value" style={{ fontSize: 12 }}>{getShapeLabel(p.shape)}</span>
              </div>
            ))}
            {result.highlights.length > 0 && (
              <>
                <Divider style={{ fontSize: 12 }}>分支匹配</Divider>
                {result.highlights.map((h, i) => (
                  <div
                    key={i}
                    className="simulate-result-item"
                    style={{ background: h.match ? '#f6ffed' : '#fff' }}
                  >
                    <span className="simulate-label">
                      {h.match ? '✅ ' : '⛔ '}
                      {h.reason}
                    </span>
                    <span>
                      <Tag color={h.match ? 'success' : 'default'} style={{ fontSize: 10 }}>
                        {h.match ? '命中' : '未命中'}
                      </Tag>
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {!hasTradeAmt && (
          <div style={{ marginTop: 12, padding: 8, background: '#fffbe6', borderRadius: 4, fontSize: 12, color: '#ad8b00' }}>
            提示：请至少输入交易金额以开始试算
          </div>
        )}
      </div>
    </Drawer>
  )
}

function evaluateCondition(cond, formValues, node) {
  if (!cond || !cond.fieldId) return true
  const value = formValues[cond.fieldId]
  const condVal = cond.value

  if (value === undefined || value === null || value === '') return false

  switch (cond.operator) {
    case '==':
      return String(value) === String(condVal)
    case '!=':
      return String(value) !== String(condVal)
    case '>':
      return parseFloat(value) > parseFloat(condVal)
    case '>=':
      return parseFloat(value) >= parseFloat(condVal)
    case '<':
      return parseFloat(value) < parseFloat(condVal)
    case '<=':
      return parseFloat(value) <= parseFloat(condVal)
    case 'in':
      if (Array.isArray(condVal)) return condVal.includes(String(value))
      if (typeof condVal === 'string') return condVal.split(',').map((s) => s.trim()).includes(String(value))
      return false
    case 'notIn':
      if (Array.isArray(condVal)) return !condVal.includes(String(value))
      if (typeof condVal === 'string') return !condVal.split(',').map((s) => s.trim()).includes(String(value))
      return true
    default:
      return true
  }
}

function getConditionDesc(cond, allFields) {
  if (!cond || !cond.fieldId) return '无条件'
  const field = allFields.find((f) => f.id === cond.fieldId)
  const fieldName = field ? field.name : cond.fieldId
  const opMap = {
    '>': '大于', '>=': '大于等于', '<': '小于', '<=': '小于等于',
    '==': '等于', '!=': '不等于', in: '属于', notIn: '不属于',
  }
  const op = opMap[cond.operator] || cond.operator
  const val = Array.isArray(cond.value) ? cond.value.join(', ') : cond.value
  return `${fieldName} ${op} ${val}`
}

function getNodeColor(shape) {
  const colors = { start: '#52c41a', condition: '#fa8c16', calculate: '#1890ff', no_points: '#ff4d4f', end: '#52c41a', return: '#ef4444' }
  return colors[shape] || '#999'
}

function getShapeLabel(shape) {
  const labels = { start: '起点', condition: '条件分流', calculate: '积分计算', no_points: '无积分', end: '终点', return: '失败响应' }
  return labels[shape] || shape
}

export default SimulatePanel
