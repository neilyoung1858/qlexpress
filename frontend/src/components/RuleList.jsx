import { useEffect, useState } from 'react'
import { Table, Tag, Space, Button, Popconfirm, message, Typography, Empty } from 'antd'
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import useStore from '../store/useStore'

const { Text } = Typography

export default function RuleList({ onEdit }) {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchRules = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/rules')
      if (res.ok) {
        const data = await res.json()
        setRules(data)
      }
    } catch (e) {
      console.warn('获取规则列表失败', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRules() }, [])

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/rules/${id}`, { method: 'DELETE' })
      if (res.ok) {
        message.success('删除成功')
        fetchRules()
      } else {
        message.error('删除失败')
      }
    } catch (e) {
      message.error('删除失败: ' + e.message)
    }
  }

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <a onClick={() => onEdit(record)}>{text || '未命名规则'}</a>
      ),
    },
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      align: 'center',
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center',
      render: (s) => (
        <Tag color={s === 1 ? 'green' : 'default'}>{s === 1 ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 170,
      render: (t) => t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (t) => t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => onEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="rule-list-page">
      <div className="rule-list-header">
        <Text strong style={{ fontSize: 16 }}>规则列表</Text>
        <Button type="primary" onClick={fetchRules} loading={loading} size="small">刷新</Button>
      </div>
      <Table
        columns={columns}
        dataSource={rules}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        locale={{ emptyText: <Empty description="暂无规则" /> }}
        size="middle"
        style={{ marginTop: 8 }}
      />
    </div>
  )
}
