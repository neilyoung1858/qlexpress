import { useState } from 'react'
import { Modal, Form, Input, Select, Button, Table, Tag, Space, Popconfirm, message, Radio } from 'antd'
import { PlusOutlined, EditOutlined, StopOutlined, DeleteOutlined } from '@ant-design/icons'
import useStore from '../store/useStore'

function CustomFieldModal() {
  const {
    fieldModalVisible, setFieldModalVisible,
    customFields, addCustomField, updateCustomField,
    deactivateCustomField, removeCustomField,
  } = useStore()

  const [form] = Form.useForm()
  const [editingId, setEditingId] = useState(null)
  const [presetInput, setPresetInput] = useState('')

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const presets = values.presetStr
        ? values.presetStr.split(/[\n,，]/).map((s) => s.trim()).filter(Boolean)
        : []

      if (editingId) {
        updateCustomField(editingId, { ...values, preset: presets })
        message.success('字段已更新')
      } else {
        addCustomField({ ...values, preset: presets })
        message.success('字段已新增')
      }

      form.resetFields()
      setEditingId(null)
      setPresetInput('')
    })
  }

  const handleEdit = (record) => {
    setEditingId(record.id)
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      category: record.category || '活动自定义参数',
      presetStr: (record.preset || []).join('\n'),
    })
    setPresetInput((record.preset || []).join('\n'))
  }

  const handleCancel = () => {
    setFieldModalVisible(false)
    form.resetFields()
    setEditingId(null)
    setPresetInput('')
  }

  const columns = [
    {
      title: '字段名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <span style={{ color: record.status === 'inactive' ? '#ccc' : undefined }}>
          {text}
          {record.status === 'inactive' && <Tag color="default" style={{ marginLeft: 4 }}>已停用</Tag>}
        </span>
      ),
    },
    {
      title: '标识',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <code style={{ fontSize: 12 }}>{text}</code>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => ({
        number: '数字型',
        enum: '文本枚举型',
        boolean: '布尔型',
        date: '日期型',
      }[type] || type),
    },
    {
      title: '预设值',
      dataIndex: 'preset',
      key: 'preset',
      render: (preset) => (
        <div style={{ maxWidth: 150 }}>
          {(preset || []).map((p) => <Tag key={p} style={{ margin: 1 }}>{p}</Tag>)}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {record.status === 'active' ? (
            <Popconfirm title="确定停用该字段？" onConfirm={() => deactivateCustomField(record.id)}>
              <Button type="link" size="small" icon={<StopOutlined />} danger>停用</Button>
            </Popconfirm>
          ) : (
            <Popconfirm title="确定删除？" onConfirm={() => removeCustomField(record.id)}>
              <Button type="link" size="small" icon={<DeleteOutlined />} danger>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Modal
      title="管理活动字段"
      open={fieldModalVisible}
      onCancel={handleCancel}
      width={800}
      footer={null}
    >
      <div style={{ marginBottom: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>
          {editingId ? '编辑字段' : '新增自定义字段'}
        </div>
        <Form form={form} layout="inline" size="small" style={{ flexWrap: 'wrap', gap: 8 }}>
          <Form.Item
            name="name"
            label="字段名称"
            rules={[{ required: true, message: '请输入字段名称' }]}
            style={{ width: 180 }}
          >
            <Input
              placeholder="如：活动专属消费门槛"
              onChange={(e) => {
                const val = e.target.value
                if (!editingId) {
                  const autoId = val
                    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '')
                    .replace(/^(\d)/, '_$1')
                    .replace(/[^\w]/g, '_')
                  form.setFieldValue('id', autoId)
                }
              }}
            />
          </Form.Item>
          <Form.Item name="id" label="字段标识" style={{ width: 180 }}>
            <Input placeholder="自动生成，支持修改" />
          </Form.Item>
          <Form.Item
            name="type"
            label="数据类型"
            rules={[{ required: true, message: '请选择类型' }]}
            style={{ width: 140 }}
          >
            <Select placeholder="选择类型">
              <Select.Option value="number">数字型</Select.Option>
              <Select.Option value="enum">文本枚举型</Select.Option>
              <Select.Option value="boolean">布尔型</Select.Option>
              <Select.Option value="date">日期型</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="category" label="用途标签" style={{ width: 150 }}>
            <Select placeholder="选择分类">
              <Select.Option value="交易信息">交易信息</Select.Option>
              <Select.Option value="用户信息">用户信息</Select.Option>
              <Select.Option value="活动自定义参数">活动自定义参数</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="presetStr" label="预设枚举值" style={{ width: '100%' }}>
            <Input.TextArea
              placeholder="文本枚举类型可预设选项，每行一个（如：档位A、档位B）"
              rows={2}
              value={presetInput}
              onChange={(e) => setPresetInput(e.target.value)}
            />
          </Form.Item>
          <Form.Item style={{ width: '100%', marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" onClick={handleSubmit} size="small">
                {editingId ? '更新字段' : '添加字段'}
              </Button>
              {editingId && (
                <Button size="small" onClick={() => {
                  setEditingId(null)
                  form.resetFields()
                  setPresetInput('')
                }}>
                  取消编辑
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      </div>

      <Table
        dataSource={customFields}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        locale={{ emptyText: '暂无自定义字段，在上方添加' }}
      />
    </Modal>
  )
}

export default CustomFieldModal
