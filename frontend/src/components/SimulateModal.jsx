import { useState, useEffect } from 'react'
import { Modal, Form, InputNumber, Select, Input, Button, Tag, Card, Divider, Alert, message } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import useStore from '../store/useStore'
import { SYSTEM_FIELDS } from '../config/nodes'

function SimulateModal() {
  const { simulateVisible, setSimulateVisible, graph, customFields, qlExpression } = useStore()
  const [form] = Form.useForm()
  const [result, setResult] = useState(null)
  const [highlightPath, setHighlightPath] = useState([])

  const allFields = [...SYSTEM_FIELDS, ...customFields.filter((f) => f.status !== 'inactive')]

  const handleSimulate = () => {
    form.validateFields().then((values) => {
      if (!graph) return

      const context = { ...values }
      // Simulate traversing the graph
      const nodes = graph.getNodes()
      const edges = graph.getEdges()
      const startNode = nodes.find((n) => n.shape === 'start')
      if (!startNode) {
        message.error('画布中没有起点节点')
        return
      }

      let path = [startNode.id]
      let currentId = startNode.id
      let finalPoints = 0
      let steps = []

      const visited = new Set()
      let maxIter = 50

      while (currentId && maxIter-- > 0) {
        if (visited.has(currentId)) break
        visited.add(currentId)
        const node = graph.getCellById(currentId)
        if (!node) break

        const shape = node.shape
        const nodeData = node.getData() || {}

        if (shape === 'start') {
          steps.push({ node: '开始-交易积分核算', desc: '开始核算', value: '-' })
        } else if (shape === 'condition') {
          const conditions = nodeData.conditions || []
          let matchedBranch = null
          for (let i = 0; i < conditions.length; i++) {
            const cond = conditions[i]
            const field = allFields.find((f) => f.id === cond.fieldId)
            if (!field) continue

            const fieldVal = context[cond.fieldId]
            const op = cond.operator
            const condVal = cond.value
            let matched = false

            if (op === '>') matched = Number(fieldVal) > Number(condVal)
            else if (op === '>=') matched = Number(fieldVal) >= Number(condVal)
            else if (op === '<') matched = Number(fieldVal) < Number(condVal)
            else if (op === '<=') matched = Number(fieldVal) <= Number(condVal)
            else if (op === '==') matched = String(fieldVal) === String(condVal)
            else if (op === '!=') matched = String(fieldVal) !== String(condVal)
            else if (op === 'in') matched = Array.isArray(condVal) && condVal.includes(String(fieldVal))
            else if (op === 'notIn') matched = Array.isArray(condVal) && !condVal.includes(String(fieldVal))

            if (matched) {
              const outEdges = edges.filter((e) => e.getSourceCellId() === currentId)
              matchedBranch = outEdges[i]?.getTargetCellId()
              steps.push({
                node: '条件分流',
                desc: `${field.name} ${op} ${Array.isArray(condVal) ? condVal.join(',') : condVal} ✔`,
                value: '命中',
              })
              break
            }
          }
          if (matchedBranch === null) {
            const outEdges = edges.filter((e) => e.getSourceCellId() === currentId)
            const elseBranch = outEdges[conditions.length]
            if (elseBranch) {
              matchedBranch = elseBranch.getTargetCellId()
              steps.push({ node: '条件分流', desc: '其他情况', value: '命中' })
            }
          }
          currentId = matchedBranch
          if (matchedBranch) path.push(matchedBranch)
          continue
        } else if (shape === 'calculate') {
          const amtField = nodeData.amountField || 'tradeAmt'
          const amtVal = Number(context[amtField] || 0)
          const rate = nodeData.rate != null ? Number(nodeData.rate) : 1
          const points = amtVal * rate
          finalPoints = points
          steps.push({
            node: '多倍积分计算',
            desc: `${amtField}=${amtVal}, 比率=${rate}`,
            value: `${points.toFixed(2)} 分`,
          })
          } else if (shape === 'no_points') {
          const nopField = nodeData.nopField
          const nopValue = nodeData.nopValue
          const matched = nopField && nopValue && String(context[nopField] ?? '') === nopValue
          if (!nopField || !nopValue || matched) finalPoints = 0
          steps.push({
            node: '无积分拦截',
            desc: nopField ? `${nopField}==${nopValue}${matched ? ' ✅' : ' ❌'}` : '拦截',
            value: '0 分',
          })
          } else if (shape === 'end') {
          steps.push({ node: '输出最终积分', desc: '计算完成', value: `${finalPoints.toFixed(2)} 分` })
          break
        }

        const outEdges = edges.filter((e) => e.getSourceCellId() === currentId)
        if (outEdges.length > 0) {
          currentId = outEdges[0].getTargetCellId()
          path.push(currentId)
        } else {
          break
        }
      }

      setHighlightPath(path)
      setResult({
        points: finalPoints.toFixed(2),
        steps,
        context,
      })

      // Highlight edges on canvas
      edges.forEach((edge) => {
        edge.attr('line/stroke', '#91d5ff')
        edge.attr('line/strokeWidth', 2)
      })

      for (let i = 0; i < path.length - 1; i++) {
        const edge = edges.find(
          (e) => e.getSourceCellId() === path[i] && e.getTargetCellId() === path[i + 1]
        )
        if (edge) {
          edge.attr('line/stroke', '#52c41a')
          edge.attr('line/strokeWidth', 3)
        }
      }

      message.success('试算完成')
    })
  }

  const handleClose = () => {
    setSimulateVisible(false)
    setResult(null)
    setHighlightPath([])
    // Reset edge colors
    if (graph) {
      graph.getEdges().forEach((edge) => {
        edge.attr('line/stroke', '#91d5ff')
        edge.attr('line/strokeWidth', 2)
      })
    }
  }

  return (
    <Modal
      title={
        <span><ThunderboltOutlined style={{ color: '#faad14' }} /> 模拟试算</span>
      }
      open={simulateVisible}
      onCancel={handleClose}
      width={600}
      footer={null}
    >
      <Alert
        message="填写交易参数，系统将模拟走完整个流程并计算最终积分"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical" size="small">
        <Card title="系统内置参数" size="small" style={{ marginBottom: 12 }}>
          <Form.Item
            name="tradeAmt"
            label="交易金额"
            rules={[{ required: true, message: '请输入交易金额' }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="例如：1000" min={0} />
          </Form.Item>
          <Form.Item name="mcc" label="商户MCC">
            <Select placeholder="选择商户类型" allowClear>
              <Select.Option value="5812-餐饮">5812-餐饮</Select.Option>
              <Select.Option value="5411-超市">5411-超市</Select.Option>
              <Select.Option value="5311-百货">5311-百货</Select.Option>
              <Select.Option value="1520-房产">1520-房产</Select.Option>
              <Select.Option value="7011-酒店">7011-酒店</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="cardType" label="卡片类型">
            <Select placeholder="选择卡片" allowClear>
              <Select.Option value="白金卡">白金卡</Select.Option>
              <Select.Option value="金卡">金卡</Select.Option>
              <Select.Option value="普通卡">普通卡</Select.Option>
              <Select.Option value="钻石卡">钻石卡</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="isReturn" label="是否退货">
            <Select placeholder="请选择" allowClear>
              <Select.Option value={false}>否</Select.Option>
              <Select.Option value={true}>是</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="isInstallment" label="是否分期">
            <Select placeholder="请选择" allowClear>
              <Select.Option value={false}>否</Select.Option>
              <Select.Option value={true}>是</Select.Option>
            </Select>
          </Form.Item>
        </Card>

        {customFields.filter((f) => f.status !== 'inactive').length > 0 && (
          <Card title="自定义字段参数" size="small" style={{ marginBottom: 12 }}>
            {customFields
              .filter((f) => f.status !== 'inactive')
              .map((field) => (
                <Form.Item
                  key={field.id}
                  name={field.id}
                  label={field.name}
                >
                  {field.type === 'number' ? (
                    <InputNumber style={{ width: '100%' }} placeholder={`输入${field.name}`} />
                  ) : field.type === 'boolean' ? (
                    <Select placeholder="请选择" allowClear>
                      <Select.Option value={true}>是</Select.Option>
                      <Select.Option value={false}>否</Select.Option>
                    </Select>
                  ) : (
                    <Select placeholder={`选择${field.name}`} allowClear mode={field.type === 'enum' ? undefined : undefined}>
                      {(field.preset || []).map((p) => (
                        <Select.Option key={p} value={p}>{p}</Select.Option>
                      ))}
                    </Select>
                  )}
                </Form.Item>
              ))}
          </Card>
        )}

        <Button type="primary" onClick={handleSimulate} block icon={<ThunderboltOutlined />}>
          开始试算
        </Button>
      </Form>

      {result && (
        <>
          <Divider />
          <Card
            title="试算结果"
            size="small"
            extra={
              <Tag color="green" style={{ fontSize: 16, padding: '4px 12px' }}>
                最终积分: {result.points}
              </Tag>
            }
          >
            {result.steps.map((step, idx) => (
              <div key={idx} className="simulate-step">
                <div className="simulate-step-label">
                  <Tag color="blue">步骤{idx + 1}</Tag>
                  <strong>{step.node}</strong>
                </div>
                <div className="simulate-step-desc">{step.desc}</div>
                <div className="simulate-step-value">
                  <Tag color={step.value === '命中' ? 'success' : 'processing'}>{step.value}</Tag>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </Modal>
  )
}

export default SimulateModal
