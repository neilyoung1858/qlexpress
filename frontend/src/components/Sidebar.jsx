import { Tooltip } from 'antd'
import { CirclePlay, Diamond, Calculator, Ban, CircleCheckBig, CornerDownLeft } from 'lucide-react'
import { NODE_DEFINITIONS } from '../config/nodes'

const ICON_MAP = {
  start: CirclePlay, condition: Diamond, calculate: Calculator,
  no_points: Ban, end: CircleCheckBig, return: CornerDownLeft,
}

const SECTION_MAP = [
  { title: '流程', types: ['start', 'end', 'return'] },
  { title: '分支', types: ['condition'] },
  { title: '执行', types: ['calculate', 'no_points'] },
]

function Sidebar() {
  const handleDragStart = (event, nodeDef) => {
    if (!nodeDef.draggable) return
    event.dataTransfer.setData('application/json', JSON.stringify(nodeDef))
    event.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>组件面板</h3>
      </div>
      {SECTION_MAP.map((section) => (
        <div key={section.title}>
          <div className="sidebar-section">
            <div className="sidebar-section-title">{section.title}</div>
          </div>
          <div className="sidebar-grid">
            {NODE_DEFINITIONS.filter((d) => section.types.includes(d.type)).map((def) => {
              const Icon = ICON_MAP[def.type]
              return (
                <Tooltip key={def.type} title={`${def.label}：${def.description}`} placement="right">
                  <div
                    className={`sidebar-icon-item ${!def.draggable ? 'sidebar-item-disabled' : ''}`}
                    draggable={def.draggable}
                    onDragStart={(e) => handleDragStart(e, def)}
                  >
                    <span className="sidebar-icon-circle" style={{ backgroundColor: def.color }}>
                      {Icon && <Icon size={16} />}
                    </span>
                  </div>
                </Tooltip>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Sidebar
