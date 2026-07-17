import { useState } from 'react'
import { Modal, Button, Table, Input, Select, Tag, Space, Form, message, Popconfirm, Tabs } from 'antd'
import { PlusOutlined, EditOutlined, StopOutlined, DeleteOutlined } from '@ant-design/icons'
import useStore from '../store/useStore'

const FIELD_TYPES = [
  { value: 'number', label: '数字型（金额、积分、次数）' },
  { value: 'enum', label: '文本枚举型（卡等级、活动标签）' },
  { value: 'boolean', label: '布尔型（是/否）' },
  { value: 'date', label: '日期型（交易日期、到期日）' },
]

const FIELD_CATEGORIES = [
  { value: '交易信息', label: '交易信息' },
  { value: '用户信息', label: '用户信息' },
  { value: '活动自定义参数', label: '活动自定义参数' },
]

function FieldModal() {
  const visible = useStore((s) => s.fieldModalVisible)
  const setVisible = useStore((s) => s.setFieldModalVisible)
  const customFields = useStore((s) => s.customFields)
  const addCustomField = useStore((s) => s.addCustomField)
  const updateCustomField = useStore((s) => s.updateCustomField)
  const deactivateCustomField = useStore((s) => s.deactivateCustomField)
  const removeCustomField = useStore((s) => s.removeCustomField)

  const [editingField, setEditingField] = useState(null)
  const [form] = Form.useForm()
  const [searchText, setSearchText] = useState('')

  const filteredFields = customFields.filter((f) =>
    !searchText || f.name.includes(searchText) || f.id.includes(searchText)
  )

  const handleAdd = () => {
    setEditingField({ id: '', name: '', type: 'number', category: '活动自定义参数', preset: [], status: 'active' })
    form.resetFields()
  }

  const handleEdit = (field) => {
    setEditingField(field)
    form.setFieldsValue({
      name: field.name,
      type: field.type,
      category: field.category || '活动自定义参数',
      presetText: (field.preset || []).join(', '),
    })
  }

  const handleSave = () => {
    form.validateFields().then((values) => {
      const preset = values.type === 'enum' && values.presetText
        ? values.presetText.split(/[,，、]/).map((s) => s.trim()).filter(Boolean)
        : []
      const fieldData = {
        name: values.name,
        type: values.type,
        category: values.category,
        preset,
      }
      if (editingField && editingField.id && customFields.some((f) => f.id === editingField.id)) {
        updateCustomField(editingField.id, fieldData)
        message.success('字段已更新')
      } else {
        addCustomField(fieldData)
        message.success('字段已添加')
      }
      setEditingField(null)
      form.resetFields()
    })
  }

  const handleCancelEdit = () => {
    setEditingField(null)
    form.resetFields()
  }

  const handleDeactivate = (field) => {
    deactivateCustomField(field.id)
    message.success('字段已停用')
  }

  const handleDelete = (field) => {
    removeCustomField(field.id)
    message.success('字段已删除')
  }

  const columns = [
    {
      title: '字段名称',
      dataIndex: 'name',
      key: 'name',
      width: 140,
    },
    {
      title: '标识',
      dataIndex: 'id',
      key: 'id',
      width: 160,
      render: (id) => <code style={{ fontSize: 11 }}>{id}</code>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => {
        const t = FIELD_TYPES.find((f) => f.value === type)
        return t ? t.label.split('（')[0] : type
      },
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '预设值',
      dataIndex: 'preset',
      key: 'preset',
      render: (preset) => (
        <span>
          {preset && preset.length > 0
            ? preset.slice(0, 3).map((p) => <Tag key={p} style={{ fontSize: 10 }}>{p}</Tag>)
            : <span style={{ color: '#999' }}>-</span>}
          {preset && preset.length > 3 && <Tag style={{ fontSize: 10 }}>+{preset.length - 3}</Tag>}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <span className={`field-status-badge ${status}`}>
          {status === 'active' ? '启用' : '停用'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          {record.status === 'active' ? (
            <Popconfirm title="确定停用该字段？" onConfirm={() => handleDeactivate(record)}>
              <Button type="link" size="small" icon={<StopOutlined />}>停用</Button>
            </Popconfirm>
          ) : null}
          <Popconfirm title="确定删除该字段？" onConfirm={() => handleDelete(record)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Modal
      title="自定义字段管理"
      open={visible}
      onCancel={() => { setVisible(false); setEditingField(null); form.resetFields() }}
      width={900}
      footer={null}
      destroyOnClose
    >
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Input.Search
          placeholder="搜索字段名称..."
          style={{ width: 280 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增字段</Button>
      </div>

      {editingField && (
        <div style={{ background: '#fafafa', padding: 16, borderRadius: 6, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            {editingField.id && customFields.some((f) => f.id === editingField.id) ? '编辑字段' : '新增字段'}
          </div>
          <Form form={form} layout="inline" style={{ flexWrap: 'wrap', gap: 8 }}>
            <Form.Item name="name" label="字段名称" rules={[{ required: true, message: '请输入字段名称' }]} style={{ marginBottom: 8 }}>
              <Input placeholder="如：暑期消费档位" style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="type" label="数据类型" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
              <Select style={{ width: 200 }}>
                {FIELD_TYPES.map((t) => (
                  <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="category" label="用途标签" style={{ marginBottom: 8 }}>
              <Select style={{ width: 150 }}>
                {FIELD_CATEGORIES.map((c) => (
                  <Select.Option key={c.value} value={c.value}>{c.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="presetText" label="预设枚举值" style={{ marginBottom: 8 }}>
              <Input placeholder="逗号分隔，如：档位A,档位B" style={{ width: 280 }} />
            </Form.Item>
          </Form>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <Button type="primary" size="small" onClick={handleSave}>保存</Button>
            <Button size="small" onClick={handleCancelEdit}>取消</Button>
          </div>
        </div>
      )}

      <Table
        className="field-table"
        dataSource={filteredFields}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          showTotal: (total) => `共 ${total} 个字段`,
        }}
        locale={{ emptyText: '暂无自定义字段，点击上方「新增字段」添加' }}
      />
    </Modal>
  )
}

export default FieldModal
