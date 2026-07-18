import { useEffect, useState } from 'react'
import { Card, Form, Input, Button, Select, InputNumber, message, Spin, Alert, Divider, Typography, Empty } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'

const { Text, Title } = Typography

export default function RuleTest() {
  const [rules, setRules] = useState([])
  const [selectedRule, setSelectedRule] = useState(null)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState(null)
  const [fields, setFields] = useState([])

  useEffect(() => {
    fetch('/api/rules')
      .then((r) => r.json())
      .then(setRules)
      .catch(() => message.error('获取规则列表失败'))
  }, [])

  const handleRuleChange = (ruleId) => {
    const rule = rules.find((r) => r.id === ruleId)
    setSelectedRule(rule)
    setResult(null)
    if (!rule) { setFields([]); return }

    const parsed = extractFields(rule.canvasJson)
    setFields(parsed)
  }

  function extractFields(canvasJson) {
    const fields = []
    if (!canvasJson) return fields
    try {
      const data = typeof canvasJson === 'string' ? JSON.parse(canvasJson) : canvasJson
      const cells = data.cells || data.nodes || []
      const seen = new Set()
      cells.forEach((cell) => {
        // condition nodes
        const conds = cell.data?.conditions || cell.data?.conditionGroups?.flatMap((g) => g.conditions) || []
        conds.forEach((c) => {
          const id = c.fieldId || c.fieldName
          if (id && !seen.has(id)) {
            seen.add(id)
            fields.push({ id, type: c.fieldType || 'string', label: c.fieldName || id })
          }
        })
        // no_points nodes
        if (cell.shape === 'no_points' && cell.data?.nopField && !seen.has(cell.data.nopField)) {
          seen.add(cell.data.nopField)
          fields.push({ id: cell.data.nopField, type: 'string', label: cell.data.nopField })
        }
        // calculate nodes - amountField
        if (cell.shape === 'calculate' && cell.data?.amountField && !seen.has(cell.data.amountField)) {
          seen.add(cell.data.amountField)
          fields.push({ id: cell.data.amountField, type: 'number', label: cell.data.amountField })
        }
      })
    } catch (e) { /* ignore */ }
    return fields
  }

  const handleTest = async (values) => {
    if (!selectedRule) return
    setTesting(true)
    setResult(null)
    try {
      const res = await fetch('/api/rules/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId: selectedRule.id, params: values }),
      })
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setResult({ success: false, error: e.message })
    } finally {
      setTesting(false)
    }
  }

  const renderField = (field) => {
    const { id, type, label } = field
    const name = id
    if (type === 'number' || type === 'decimal') {
      return (
        <Form.Item key={id} label={label} name={name} rules={[{ required: true, message: `请输入${label}` }]}>
          <InputNumber style={{ width: '100%' }} placeholder={`请输入${label}`} />
        </Form.Item>
      )
    }
    if (type === 'boolean') {
      return (
        <Form.Item key={id} label={label} name={name} initialValue="true">
          <Select>
            <Select.Option value="true">是</Select.Option>
            <Select.Option value="false">否</Select.Option>
          </Select>
        </Form.Item>
      )
    }
    if (type === 'date') {
      return (
        <Form.Item key={id} label={label} name={name} rules={[{ required: true, message: `请输入${label}` }]}>
          <Input placeholder="例如: 2026-07-18" />
        </Form.Item>
      )
    }
    return (
      <Form.Item key={id} label={label} name={name} rules={[{ required: true, message: `请输入${label}` }]}>
        <Input placeholder={`请输入${label}`} />
      </Form.Item>
    )
  }

  return (
    <div className="rule-test-page">
      <Title level={5} style={{ margin: 0, marginBottom: 16 }}>规则测试</Title>

      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap' }}>选择规则：</span>
          <Select
            placeholder="请选择要测试的规则"
            style={{ width: 400 }}
            onChange={handleRuleChange}
            value={selectedRule?.id}
            options={rules.map((r) => ({ label: `${r.name} (v${r.version})`, value: r.id }))}
          />
        </div>
      </Card>

      {selectedRule && (
        <>
          <Card
            size="small"
            title="请求参数"
            style={{ marginBottom: 16 }}
          >
            {fields.length === 0 ? (
              <Empty description="该规则未解析到可配置字段，请直接输入JSON" />
            ) : (
              <Form layout="vertical" onFinish={handleTest} size="small">
                {fields.map(renderField)}
                <Form.Item>
                  <Button type="primary" htmlType="submit" icon={<PlayCircleOutlined />} loading={testing}>
                    开始测试
                  </Button>
                </Form.Item>
              </Form>
            )}
          </Card>

          {testing && (
            <Card size="small">
              <Spin tip="正在执行规则..." />
            </Card>
          )}

          {result && (
            <Card size="small" title="执行结果">
              {result.success ? (
                <>
                  <Alert type="success" message={`计算成功`} description={
                    <Text strong style={{ fontSize: 20 }}>结果: {String(result.result)}</Text>
                  } style={{ marginBottom: 8 }} />
                  <Divider style={{ margin: '8px 0' }} />
                  <Text type="secondary" code style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                    {JSON.stringify(result.data || {}, null, 2)}
                  </Text>
                </>
              ) : (
                <Alert type="error" message="执行失败" description={result.error} />
              )}
            </Card>
          )}
        </>
      )}
    </div>
  )
}
