import { useEffect, useState, useMemo } from 'react'
import { Form, Select, InputNumber, Checkbox, Radio, Input, Divider, Tag, Empty, Button, message, DatePicker, TimePicker } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import useStore from '../store/useStore'
import { OPERATORS_BY_TYPE, TYPE_OPTIONS, POINT_RATIOS, POINT_MULTIPLIERS } from '../config/nodes'

const TYPE_LABEL_MAP = {
  number: '数字(整数)', decimal: '数字(小数)', string: '文本',
  boolean: '布尔', enum: '枚举', date: '日期', time: '时间',
}

function ConditionConfig({ node, fields }) {
  const [conditions, setConditions] = useState(node.data?.conditions || [])
  const [logicOp, setLogicOp] = useState(node.data?.logicOp || '&&')

  useEffect(() => {
    setConditions(node.data?.conditions || [])
    setLogicOp(node.data?.logicOp || '&&')
  }, [node.id])

  const updateNode = (newConditions, newLogicOp) => {
    const data = { ...node.data, conditions: newConditions, logicOp: newLogicOp }
    node.setData(data)
    node.setLabelText(
      newConditions.length > 0
        ? `条件分流(${newConditions.length})`
        : '交易条件分流'
    )
  }

  const updateCondition = (idx, field, value) => {
    let newConds = conditions.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    if (field === 'fieldType' || field === 'fieldId') {
      newConds = newConds.map((c, i) => (i === idx ? { ...c, operator: '', value: '', value2: '' } : c))
    }
    if (field === 'fieldId') {
      const f = fields.find((ff) => ff.id === value)
      newConds = newConds.map((c, i) => (i === idx ? { ...c, fieldType: f?.type || 'string' } : c))
    }
    if (field === 'fieldName') {
      newConds = newConds.map((c, i) => (i === idx ? { ...c, fieldId: '' } : c))
    }
    setConditions(newConds)
    updateNode(newConds, logicOp)
  }

  const addCondition = () => {
    if (conditions.length >= 4) {
      message.warning('最多4个条件')
      return
    }
    const newConds = [...conditions, { fieldId: '', fieldType: 'string', fieldName: '', operator: '', value: '', value2: '' }]
    setConditions(newConds)
    updateNode(newConds, logicOp)
  }

  const removeCondition = (idx) => {
    const newConds = conditions.filter((_, i) => i !== idx)
    setConditions(newConds)
    updateNode(newConds, logicOp)
  }

  const getFieldType = (cond) => {
    if (cond.fieldType) return cond.fieldType
    const f = fields.find((ff) => ff.id === cond.fieldId)
    return f?.type || 'string'
  }

  const isBetween = (op) => op === 'between'

  const renderValueInput = (cond, operators, idx) => {
    const ft = getFieldType(cond)
    if (isBetween(cond.operator)) {
      return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <InputNumber
            style={{ flex: 1 }}
            value={cond.value}
            onChange={(v) => updateCondition(idx, 'value', v)}
            placeholder="最小值"
          />
          <span style={{ color: '#999' }}>~</span>
          <InputNumber
            style={{ flex: 1 }}
            value={cond.value2}
            onChange={(v) => updateCondition(idx, 'value2', v)}
            placeholder="最大值"
          />
        </div>
      )
    }

    if (ft === 'number' || ft === 'decimal') {
      return (
        <InputNumber
          style={{ width: '100%' }}
          value={cond.value}
          onChange={(v) => updateCondition(idx, 'value', v)}
          placeholder="输入数值"
          step={ft === 'decimal' ? 0.01 : 1}
        />
      )
    }

    if (ft === 'boolean') {
      return (
        <Radio.Group
          value={cond.value === true || cond.value === 'true' ? true : cond.value === false || cond.value === 'false' ? false : cond.value}
          onChange={(e) => updateCondition(idx, 'value', e.target.value)}
        >
          <Radio value={true}>是</Radio>
          <Radio value={false}>否</Radio>
        </Radio.Group>
      )
    }

    if (ft === 'date') {
      return (
        <DatePicker
          style={{ width: '100%' }}
          value={cond.value ? dayjs(cond.value) : null}
          onChange={(d) => updateCondition(idx, 'value', d ? d.format('YYYY-MM-DD') : '')}
          placeholder="选择日期"
        />
      )
    }

    if (ft === 'time') {
      return (
        <TimePicker
          style={{ width: '100%' }}
          value={cond.value ? dayjs(cond.value, 'HH:mm') : null}
          onChange={(t) => updateCondition(idx, 'value', t ? t.format('HH:mm') : '')}
          placeholder="选择时间"
          format="HH:mm"
        />
      )
    }

    if (ft === 'enum') {
      const presets = cond.fieldId ? (fields.find((f) => f.id === cond.fieldId)?.preset || []) : []
      if (cond.operator === 'in' || cond.operator === 'notIn') {
        return (
          <Select
            mode="multiple"
            value={Array.isArray(cond.value) ? cond.value : []}
            onChange={(v) => updateCondition(idx, 'value', v)}
            placeholder="选择多个值"
            style={{ width: '100%' }}
          >
            {presets.map((p) => (
              <Select.Option key={p} value={p}>{p}</Select.Option>
            ))}
          </Select>
        )
      }
      return (
        <Select
          value={cond.value || undefined}
          onChange={(v) => updateCondition(idx, 'value', v)}
          placeholder="选择值"
          style={{ width: '100%' }}
          allowClear
          showSearch
        >
          {presets.map((p) => (
            <Select.Option key={p} value={p}>{p}</Select.Option>
          ))}
        </Select>
      )
    }

    return (
      <Input
        value={cond.value}
        onChange={(e) => updateCondition(idx, 'value', e.target.value)}
        placeholder="输入值"
      />
    )
  }

  return (
    <div className="config-section">
      <div className="config-section-title">判断逻辑组合</div>
      <Radio.Group
        value={logicOp}
        onChange={(e) => {
          setLogicOp(e.target.value)
          updateNode(conditions, e.target.value)
        }}
        size="small"
        style={{ marginBottom: 12 }}
      >
        <Radio.Button value="&&">全部满足(AND)</Radio.Button>
        <Radio.Button value="||">任一满足(OR)</Radio.Button>
      </Radio.Group>

      {conditions.map((cond, idx) => {
        const ft = getFieldType(cond)
        const operators = OPERATORS_BY_TYPE[ft] || []

        return (
          <div key={idx} className="condition-row">
            <div className="condition-row-header">
              <Tag color="orange">条件{idx + 1}</Tag>
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeCondition(idx)}
              />
            </div>
            <Form layout="vertical" size="small">
              <Form.Item label="判断对象">
                <Input
                  value={cond.fieldName || cond.fieldId || ''}
                  onChange={(e) => updateCondition(idx, 'fieldName', e.target.value)}
                  placeholder="输入字段名称，如 tradeAmt、mcc、activityLevel"
                />
              </Form.Item>
              <Form.Item label="字段类型">
                <Select
                  value={ft}
                  onChange={(v) => updateCondition(idx, 'fieldType', v)}
                  style={{ width: '100%' }}
                >
                  {TYPE_OPTIONS.map((t) => (
                    <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="判断关系">
                <Select
                  value={cond.operator || undefined}
                  placeholder="选择运算符"
                  onChange={(v) => updateCondition(idx, 'operator', v)}
                >
                  {operators.map((op) => (
                    <Select.Option key={op.value} value={op.value}>{op.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              {cond.operator && (
                <Form.Item label={isBetween(cond.operator) ? '区间范围' : '匹配值'}>
                  {renderValueInput(cond, operators, idx)}
                </Form.Item>
              )}
            </Form>
            {idx < conditions.length - 1 && (
              <div style={{ textAlign: 'center', color: '#999', fontSize: 12, margin: '4px 0' }}>
                {logicOp === '&&' ? '并且' : '或者'}
              </div>
            )}
          </div>
        )
      })}
      {conditions.length < 4 && (
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addCondition}
          block
          size="small"
          style={{ marginTop: 8 }}
        >
          添加判断条件
        </Button>
      )}
    </div>
  )
}

function CalculateConfig({ node }) {
  const [config, setConfig] = useState(node.data || {})

  useEffect(() => {
    setConfig(node.data || {})
  }, [node.id])

  const update = (key, value) => {
    const newData = { ...config, [key]: value }
    setConfig(newData)
    node.setData(newData)
  }

  const fields = useStore.getState().getAllFields()
  const customFields = fields.filter((f) => f.category === '自定义字段' && f.type === 'number')

  return (
    <div className="config-section">
      <div className="config-section-title">积分计算配置</div>
      <Form layout="vertical" size="small">
        <Form.Item label="基础积分比例">
          <Select
            value={config.pointRatio}
            onChange={(v) => update('pointRatio', v)}
            placeholder="选择比例"
          >
            {POINT_RATIOS.map((r) => (
              <Select.Option key={r.value} value={r.value}>{r.label}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="积分倍率">
          <div className="config-flex-row">
            <Select
              value={config.multiplierSource || 'fixed'}
              onChange={(v) => update('multiplierSource', v)}
              style={{ width: 120 }}
              size="small"
            >
              <Select.Option value="fixed">固定数值</Select.Option>
              <Select.Option value="field">自定义字段</Select.Option>
            </Select>
            {config.multiplierSource === 'field' ? (
              <Select
                value={config.multiplierFieldId}
                onChange={(v) => update('multiplierFieldId', v)}
                placeholder="选择字段"
                style={{ flex: 1 }}
                size="small"
              >
                {customFields.map((f) => (
                  <Select.Option key={f.id} value={f.id}>{f.name}</Select.Option>
                ))}
              </Select>
            ) : (
              <Select
                value={config.multiplier}
                onChange={(v) => update('multiplier', v)}
                placeholder="选择倍率"
                style={{ flex: 1 }}
                size="small"
              >
                {POINT_MULTIPLIERS.map((m) => (
                  <Select.Option key={m.value} value={m.value}>{m.label}</Select.Option>
                ))}
              </Select>
            )}
          </div>
        </Form.Item>
        <Form.Item label="单笔积分封顶">
          <div className="config-flex-row">
            <Select
              value={config.maxPointsSource || 'fixed'}
              onChange={(v) => update('maxPointsSource', v)}
              style={{ width: 120 }}
              size="small"
            >
              <Select.Option value="fixed">固定数值</Select.Option>
              <Select.Option value="field">自定义字段</Select.Option>
              <Select.Option value="none">无上限</Select.Option>
            </Select>
            {config.maxPointsSource === 'field' ? (
              <Select
                value={config.maxPointsFieldId}
                onChange={(v) => update('maxPointsFieldId', v)}
                placeholder="选择字段"
                style={{ flex: 1 }}
                size="small"
              >
                {customFields.map((f) => (
                  <Select.Option key={f.id} value={f.id}>{f.name}</Select.Option>
                ))}
              </Select>
            ) : config.maxPointsSource === 'fixed' ? (
              <InputNumber
                value={config.maxPoints}
                onChange={(v) => update('maxPoints', v)}
                placeholder="输入上限"
                min={0}
                style={{ flex: 1 }}
                size="small"
              />
            ) : null}
          </div>
        </Form.Item>
      </Form>
    </div>
  )
}

function NoPointsConfig({ node }) {
  const [reasons, setReasons] = useState(node.data?.reasons || [])

  useEffect(() => {
    setReasons(node.data?.reasons || [])
  }, [node.id])

  const update = (vals) => {
    setReasons(vals)
    node.setData({ ...node.data, reasons: vals })
    node.setLabelText(vals.length > 0 ? `无积分(${vals.length})` : '无积分拦截')
  }

  const options = [
    { label: '批发商户', value: '批发商户' },
    { label: '购房购车', value: '购房购车' },
    { label: '公益缴费', value: '公益缴费' },
    { label: '退货交易', value: '退货交易' },
    { label: '政府机构', value: '政府机构' },
    { label: '医院教育', value: '医院教育' },
  ]

  return (
    <div className="config-section">
      <div className="config-section-title">无积分拦截配置</div>
      <div className="config-desc">勾选不计积分的原因：</div>
      <Checkbox.Group
        options={options}
        value={reasons}
        onChange={update}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      />
    </div>
  )
}

function DeductionConfig({ node }) {
  const [types, setTypes] = useState(node.data?.deductionTypes || [])

  useEffect(() => {
    setTypes(node.data?.deductionTypes || [])
  }, [node.id])

  const update = (vals) => {
    setTypes(vals)
    node.setData({ ...node.data, deductionTypes: vals })
    node.setLabelText(vals.length > 0 ? `积分扣减(${vals.length})` : '积分扣减')
  }

  const options = [
    { label: '退货扣减积分', value: 'return' },
    { label: '分期手续费扣减', value: 'installment' },
  ]

  return (
    <div className="config-section">
      <div className="config-section-title">积分扣减配置</div>
      <Checkbox.Group
        options={options}
        value={types}
        onChange={update}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      />
    </div>
  )
}

function ConfigPanel() {
  const { selectedNode, setSelectedNode } = useStore()
  const fields = useStore.getState().getAllFields()

  if (!selectedNode) {
    return (
      <div className="config-panel config-panel-empty">
        <Empty
          description="点击画布中的节点查看配置"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    )
  }

  const shape = selectedNode.shape
  const nodeData = selectedNode.getData() || {}

  return (
    <div className="config-panel">
      <div className="config-panel-header">
        <div className="config-node-title">
          <span className="config-node-label">{nodeData.label || shape}</span>
          <Tag color="blue" style={{ marginLeft: 8 }}>ID: {selectedNode.id}</Tag>
        </div>
      </div>
      <Divider style={{ margin: '8px 0' }} />
      <div className="config-panel-body">
        {shape === 'condition' && (
          <ConditionConfig node={selectedNode} fields={fields} />
        )}
        {shape === 'calculate' && (
          <CalculateConfig node={selectedNode} />
        )}
        {shape === 'no_points' && (
          <NoPointsConfig node={selectedNode} />
        )}
        {shape === 'deduction' && (
          <DeductionConfig node={selectedNode} />
        )}

      </div>
    </div>
  )
}

export default ConfigPanel
