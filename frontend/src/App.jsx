import { useState } from 'react'
import { ConfigProvider } from 'antd'
import { UnorderedListOutlined, PlusCircleOutlined, ExperimentOutlined } from '@ant-design/icons'
import RuleList from './components/RuleList'
import RuleCreate from './components/RuleCreate'
import RuleTest from './components/RuleTest'
import useStore from './store/useStore'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('create')
  const [editRule, setEditRule] = useState(null)
  const setCanvasData = useStore((s) => s.setCanvasData)

  const handleEditRule = (rule) => {
    setEditRule(rule)
    setActiveTab('create')
    if (rule.canvasJson) {
      try {
        const data = typeof rule.canvasJson === 'string' ? JSON.parse(rule.canvasJson) : rule.canvasJson
        setCanvasData(data)
      } catch (e) {
        console.warn('Failed to parse canvasJson', e)
      }
    }
  }

  const handleSaved = () => {
    setEditRule(null)
    setActiveTab('list')
  }

  const tabs = [
    { key: 'list', icon: <UnorderedListOutlined />, label: '规则列表' },
    { key: 'create', icon: <PlusCircleOutlined />, label: editRule ? '编辑规则' : '创建规则' },
    { key: 'test', icon: <ExperimentOutlined />, label: '规则测试' },
  ]

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
      <div className="app-container">
        <div className="app-tabs">
          {tabs.map((t) => (
            <div
              key={t.key}
              className={`app-tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => { setEditRule(null); setActiveTab(t.key) }}
            >
              {t.icon} {t.label}
            </div>
          ))}
        </div>
        <div className="app-tab-content">
          {activeTab === 'list' && <RuleList onEdit={handleEditRule} />}
          {activeTab === 'create' && <RuleCreate key={editRule?.id || 'new'} editRule={editRule} onSaved={handleSaved} />}
          {activeTab === 'test' && <RuleTest />}
        </div>
      </div>
    </ConfigProvider>
  )
}

export default App
