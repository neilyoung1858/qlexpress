import { useState, useEffect, useCallback } from 'react'
import { Select, Input, InputNumber, Switch, Tag, Button, Divider, Checkbox, Radio, Space, message, DatePicker, TimePicker } from 'antd'
import { CopyOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import useStore from '../store/useStore'
import {
  NODE_TYPES, OPERATORS_BY_TYPE, TYPE_OPTIONS, POINT_RATIOS,
  POINT_MULTIPLIERS, SYSTEM_FIELDS,
} from '../config/nodes'

function RightPanel() {
  const [activeTab, setActiveTab] = useState('config')
  const selectedNode = useStore((s) => s.selectedNode)
  const graph = useStore((s) => s.graph)
  const qlExpression = useStore((s) => s.qlExpression)
  const setQlExpression = useStore((s) => s.setQlExpression)
  const getAllFields = useStore((s) => s.getAllFields)
  const customFields = useStore((s) => s.customFields)
  const pushHistory = useStore((s) => s.pushHistory)

  const node = selectedNode && graph ? graph.getCellById(selectedNode.id) : null
  const nodeData = node ? (node.getData() || {}) : {}
  const allFields = getAllFields()

  // Migrate old conditions format to groups format
  const initGroups = () => {
    if (nodeData.conditionGroups && nodeData.conditionGroups.length > 0) return nodeData.conditionGroups
    if (nodeData.conditions && nodeData.conditions.length > 0) {
      return [{ logicOp: '&&', conditions: nodeData.conditions }]
    }
    return []
  }

  const [groups, setGroups] = useState(initGroups())
  const [groupLogicOp, setGroupLogicOp] = useState(nodeData.logicOp || '&&')

  useEffect(() => {
    setGroups(initGroups())
    setGroupLogicOp(nodeData.logicOp || '&&')
  }, [selectedNode?.id])

  const updateNodeData = useCallback((key, value) => {
    if (!node) return
    const current = node.getData() || {}
    node.setData({ ...current, [key]: value })
    pushHistory(graph.toJSON())
  }, [node, graph, pushHistory])

  const TYPE_LABEL_MAP = {
    number: '数字(整数)', decimal: '数字(小数)', string: '文本',
    boolean: '布尔', date: '日期', time: '时间',
  }

  const getCondFieldType = (cond) => {
    if (cond.fieldType) return cond.fieldType
    const f = allFields.find((ff) => ff.id === cond.fieldId)
    return f?.type || 'string'
  }

  const isBetween = (op) => op === 'between'

  const renderConditionConfig = () => {
    const renderValueInput = (cond, onChange) => {
      const ft = getCondFieldType(cond)
      if (isBetween(cond.operator)) {
        return (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <InputNumber size="small" style={{ flex: 1 }} value={cond.value} onChange={(v) => onChange('value', v)} placeholder="最小值" />
            <span style={{ color: '#999' }}>~</span>
            <InputNumber size="small" style={{ flex: 1 }} value={cond.value2} onChange={(v) => onChange('value2', v)} placeholder="最大值" />
          </div>
        )
      }
      if (ft === 'number' || ft === 'decimal') {
        return <InputNumber size="small" style={{ width: '100%' }} value={cond.value} onChange={(v) => onChange('value', v)} placeholder="输入数值" step={ft === 'decimal' ? 0.01 : 1} />
      }
      if (ft === 'boolean') {
        return (
          <Select size="small" style={{ width: '100%' }}
            value={cond.value === true || cond.value === 'true' ? 'true' : cond.value === false || cond.value === 'false' ? 'false' : undefined}
            onChange={(v) => onChange('value', v === 'true')} placeholder="选择">
            <Select.Option value="true">是</Select.Option>
            <Select.Option value="false">否</Select.Option>
          </Select>
        )
      }
      if (ft === 'date') {
        return <DatePicker size="small" style={{ width: '100%' }} value={cond.value ? dayjs(cond.value) : null} onChange={(d) => onChange('value', d ? d.format('YYYY-MM-DD') : '')} placeholder="选择日期" />
      }
      if (ft === 'time') {
        return <TimePicker size="small" style={{ width: '100%' }} value={cond.value ? dayjs(cond.value, 'HH:mm') : null} onChange={(t) => onChange('value', t ? t.format('HH:mm') : '')} placeholder="选择时间" format="HH:mm" />
      }
      return (
        <input className="ant-input" style={{ padding: '1px 8px', fontSize: 12, width: '100%', height: 24, borderRadius: 4, border: '1px solid #d9d9d9', outline: 'none' }}
          value={cond.value ?? ''} onChange={(e) => onChange('value', e.target.value)} placeholder="输入值" />
      )
    }

    const updateCond = (gIdx, cIdx, key, val) => {
      const newGroups = groups.map((g, gi) => {
        if (gi !== gIdx) return g
        const newConds = g.conditions.map((c, ci) => {
          if (ci !== cIdx) return c
          let nc = { ...c, [key]: val }
          if (key === 'fieldType' || key === 'fieldId') nc = { ...nc, operator: '', value: '', value2: '' }
          if (key === 'fieldId') { const f = allFields.find((ff) => ff.id === val); nc.fieldType = f?.type || 'string' }
          if (key === 'fieldName') nc.fieldId = ''
          return nc
        })
        return { ...g, conditions: newConds }
      })
      saveGroups(newGroups)
    }

    const removeGroup = (gIdx) => {
      saveGroups(groups.filter((_, gi) => gi !== gIdx))
    }

    const setGroupLogic = (gIdx, op) => {
      const newGroups = groups.map((g, gi) => gi !== gIdx ? g : { ...g, logicOp: op })
      saveGroups(newGroups)
    }

    const saveGroups = (newGroups) => {
      setGroups(newGroups)
      try {
        if (node) {
          node.setData({ ...(node.getData() || {}), conditionGroups: newGroups })
          pushHistory(graph.toJSON())
          // Update Y/N edge labels
          const edges = graph?.getEdges().filter((e) => e.getSourceCellId() === node.id) || []
          edges.forEach((edge, idx) => {
            if (idx > 1) return
            const label = idx === 0 ? 'Y' : 'N'
            const color = idx === 0 ? '#52c41a' : '#ff4d4f'
            const bgColor = idx === 0 ? '#f6ffed' : '#fff2f0'
            edge.setLabels([{
              markup: [{ tagName: 'rect', selector: 'labelBg' }, { tagName: 'text', selector: 'labelText' }],
              attrs: {
                labelBg: { ref: 'labelText', refWidth: '200%', refHeight: '200%', refX: '-50%', refY: '-50%', fill: bgColor, stroke: color, rx: 4, strokeWidth: 1.5 },
                labelText: { text: label, fontSize: 14, fill: color, textAnchor: 'middle', fontWeight: 'bold' },
              },
              position: 0.5,
            }])
            edge.setData({ ...(edge.getData() || {}), label })
          })
        }
      } catch (e) { console.error('saveGroups error:', e) }
    }

    const addCondToGroup = (gIdx) => {
      const newGroups = groups.map((g, gi) => gi !== gIdx ? g : { ...g, conditions: [...g.conditions, { fieldName: '', fieldType: 'string', operator: '', value: '', value2: '' }] })
      saveGroups(newGroups)
    }

    const removeCondFromGroup = (gIdx, cIdx) => {
      const newGroups = groups.map((g, gi) => gi !== gIdx ? g : { ...g, conditions: g.conditions.filter((_, ci) => ci !== cIdx) })
      saveGroups(newGroups)
    }

    const addGroup = () => {
      saveGroups([...groups, { logicOp: '&&', conditions: [{ fieldName: '', fieldType: 'string', operator: '', value: '', value2: '' }] }])
    }

    const handleTitleChange = (title) => {
      if (!node) return
      node.setData({ ...node.getData(), label: title })
      pushHistory(graph.toJSON())
    }

    try {
      return (
        <div>
          <div className="config-section">
            <div className="config-section-title">节点名称</div>
            <Input size="small" value={nodeData.label || ''} onChange={(e) => handleTitleChange(e.target.value)} placeholder="交易条件分流" />
          </div>
          <div className="config-section">
            <div className="config-section-title">Y (条件成立) 配置</div>
            <div className="config-logic-row">
              <span className="config-row-label">组间关系</span>
              <Radio.Group value={groupLogicOp} size="small" onChange={(e) => { setGroupLogicOp(e.target.value); updateNodeData('logicOp', e.target.value) }}>
                <Radio.Button value="&&">全部组满足(AND)</Radio.Button>
                <Radio.Button value="||">任一组满足(OR)</Radio.Button>
              </Radio.Group>
            </div>
          </div>
          {groups.map((group, gIdx) => (
            <div key={gIdx} className="config-section" style={{ position: 'relative', border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>条件组 {gIdx + 1}</span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#999' }}>组内关系</span>
                  <Radio.Group value={group?.logicOp || '&&'} size="small" onChange={(e) => setGroupLogic(gIdx, e.target.value)}>
                    <Radio.Button value="&&">AND</Radio.Button>
                    <Radio.Button value="||">OR</Radio.Button>
                  </Radio.Group>
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeGroup(gIdx)} />
                </div>
              </div>
              {(group?.conditions || []).map((cond, cIdx) => {
                const ft = cond ? getCondFieldType(cond) : 'string'
                const operators = OPERATORS_BY_TYPE[ft] || []
                return (
                  <div key={cIdx} className="config-condition-item" style={{ marginBottom: 6 }}>
                    <div className="condition-header">
                      <Tag color="orange">条件 {cIdx + 1}</Tag>
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeCondFromGroup(gIdx, cIdx)} />
                    </div>
                    <div className="config-row">
                      <span className="config-row-label">判断对象</span>
                      <div className="config-row-value">
                        <Input size="small" value={cond?.fieldName || cond?.fieldId || ''} onChange={(e) => updateCond(gIdx, cIdx, 'fieldName', e.target.value)} placeholder="输入字段名" />
                      </div>
                    </div>
                    <div className="config-row">
                      <span className="config-row-label">字段类型</span>
                      <div className="config-row-value">
                        <Select size="small" style={{ width: '100%' }} value={ft} onChange={(v) => updateCond(gIdx, cIdx, 'fieldType', v)}>
                          {TYPE_OPTIONS.map((t) => (<Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>))}
                        </Select>
                      </div>
                    </div>
                    <div className="config-row">
                      <span className="config-row-label">运算符</span>
                      <div className="config-row-value">
                        <Select size="small" style={{ width: '100%' }} value={cond?.operator || undefined} placeholder="选择运算符" onChange={(v) => updateCond(gIdx, cIdx, 'operator', v)}>
                          {operators.map((op) => (<Select.Option key={op.value} value={op.value}>{op.label}</Select.Option>))}
                        </Select>
                      </div>
                    </div>
                    <div className="config-row">
                      <span className="config-row-label">{cond?.operator && isBetween(cond?.operator) ? '区间范围' : '匹配值'}</span>
                      <div className="config-row-value">
                        {renderValueInput(cond || {}, (key, val) => updateCond(gIdx, cIdx, key, val))}
                      </div>
                    </div>
                  </div>
                )
              })}
              <Button type="dashed" icon={<PlusOutlined />} block size="small" onClick={() => addCondToGroup(gIdx)}>添加条件到本组</Button>
            </div>
          ))}
          <Button type="dashed" icon={<PlusOutlined />} block size="small" style={{ marginTop: 4 }} onClick={addGroup}>添加条件组</Button>
          <Divider />
        </div>
      )
    } catch (e) {
      console.error('ConditionConfig render error:', e)
      return <div style={{ color: 'red', padding: 16 }}>配置渲染错误: {e.message}</div>
    }
  }

  const renderCalculateConfig = () => {
    const amountField = nodeData.amountField || ''
    const rate = nodeData.rate ?? ''

    return (
      <div>
        <div className="config-section">
          <div className="config-section-title">积分计算配置</div>
          <div className="config-row">
            <span className="config-row-label">金额字段名</span>
            <div className="config-row-value">
              <Input size="small" value={amountField} onChange={(e) => updateNodeData('amountField', e.target.value)} placeholder="如 tradeAmt" />
            </div>
          </div>
          <div className="config-row">
            <span className="config-row-label">积分比率</span>
            <div className="config-row-value">
              <InputNumber size="small" style={{ width: '100%' }} value={rate} onChange={(v) => updateNodeData('rate', v)} placeholder="如 1（每1元1分）" step={0.01} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const updateNopData = (key, val) => {
    if (!node) return
    const current = node.getData() || {}
    node.setData({ ...current, [key]: val })
    pushHistory(graph.toJSON())
    // Update Y/N edge labels (no_points: Y=NOT met, N=met)
    const edges = graph?.getEdges().filter((e) => e.getSourceCellId() === node.id) || []
    edges.forEach((edge, idx) => {
      if (idx > 1) return
      const label = idx === 0 ? 'Y' : 'N'
      const color = idx === 0 ? '#52c41a' : '#ff4d4f'
      const bgColor = idx === 0 ? '#f6ffed' : '#fff2f0'
      edge.setLabels([{
        markup: [{ tagName: 'rect', selector: 'labelBg' }, { tagName: 'text', selector: 'labelText' }],
        attrs: {
          labelBg: { ref: 'labelText', refWidth: '200%', refHeight: '200%', refX: '-50%', refY: '-50%', fill: bgColor, stroke: color, rx: 4, strokeWidth: 1.5 },
          labelText: { text: label, fontSize: 14, fill: color, textAnchor: 'middle', fontWeight: 'bold' },
        },
        position: 0.5,
      }])
      edge.setData({ ...(edge.getData() || {}), label })
    })
  }

  const renderNoPointsConfig = () => {
    const nopField = nodeData.nopField || ''
    const nopValue = nodeData.nopValue ?? ''
    return (
      <div>
        <div className="config-section">
          <div className="config-section-title">无积分拦截配置</div>
          <div className="config-row">
            <span className="config-row-label">条件字段名</span>
            <div className="config-row-value">
              <Input size="small" value={nopField} onChange={(e) => updateNopData('nopField', e.target.value)} placeholder="如 mcc" />
            </div>
          </div>
          <div className="config-row">
            <span className="config-row-label">拦截条件值</span>
            <div className="config-row-value">
              <Input size="small" value={nopValue} onChange={(e) => updateNopData('nopValue', e.target.value)} placeholder="如 1520（房产MCC）" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderReturnConfig = () => {
    const returnValue = nodeData.returnValue ?? ''
    return (
      <div className="config-section">
        <div className="config-section-title">失败响应配置</div>
        <div className="config-row">
          <span className="config-row-label">响应表达式</span>
          <div className="config-row-value">
            <Input size="small" value={returnValue} onChange={(e) => updateNodeData('returnValue', e.target.value)}
              placeholder="输入表达式，如 0、point、-1" />
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>
          N(不成立)分支指向此节点时输出该表达式结果
        </div>
      </div>
    )
  }

  const renderConfig = () => {
    if (!selectedNode || !node) {
      return (
        <div className="config-empty">
          <div className="config-empty-icon">👈</div>
          <p>点击画布上的节点<br />查看和配置属性</p>
        </div>
      )
    }
    switch (selectedNode.shape) {
      case 'condition': return renderConditionConfig()
      case 'calculate': return renderCalculateConfig()
      case 'no_points': return renderNoPointsConfig()
      case 'return': return renderReturnConfig()
      default:
        return (
          <div className="config-empty">
            <div className="config-empty-icon">ℹ️</div>
            <p>该节点无需配置</p>
          </div>
        )
    }
  }

  const handleCopyQL = () => {
    navigator.clipboard.writeText(qlExpression)
    message.success('已复制到剪贴板')
  }

  return (
    <div className="right-panel">
      <div className="right-panel-tabs">
        <div
          className={`right-panel-tab ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          节点配置
        </div>
        <div
          className={`right-panel-tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          QL 预览
        </div>
      </div>
      <div className="right-panel-content">
        {activeTab === 'config' ? renderConfig() : (
          <div>
            <div className="ql-preview-header">
              <h4>QLExpress 表达式</h4>
              {qlExpression && (
                <Button size="small" icon={<CopyOutlined />} onClick={handleCopyQL}>复制</Button>
              )}
            </div>
            <div className="ql-preview-box">
              {qlExpression ? (
                <SyntaxHighlight code={qlExpression} />
              ) : (
                <div className="ql-preview-empty">暂无表达式，请在画布搭建规则</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SyntaxHighlight({ code }) {
  const lines = code.split('\n')
  return (
    <>
      {lines.map((line, i) => {
        if (line.trim().startsWith('//')) {
          return <div key={i} className="ql-comment">{line}</div>
        }
        const parts = line.split(/(\/\/.*)/g)
        return (
          <div key={i}>
            {parts.map((part, j) => {
              if (part.startsWith('//')) {
                return <span key={j} className="ql-comment">{part}</span>
              }
              return <span key={j}>{part}</span>
            })}
          </div>
        )
      })}
    </>
  )
}

export default RightPanel
