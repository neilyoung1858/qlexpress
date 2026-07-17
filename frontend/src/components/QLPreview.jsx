import { Input, Tag, Tooltip, Button } from 'antd'
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons'
import useStore from '../store/useStore'
import { generateQLFromCanvas } from '../utils/qlGenerator'

function QLPreview() {
  const { qlExpression, setQlExpression, graph, customFields } = useStore()

  const handleCopy = () => {
    navigator.clipboard.writeText(qlExpression)
  }

  const handleRefresh = () => {
    if (graph) {
      const data = graph.toJSON({ diff: true })
      setQlExpression(generateQLFromCanvas(data, customFields))
    }
  }

  return (
    <div className="ql-preview">
      <div className="ql-preview-header">
        <span>QLExpress 表达式预览</span>
        <div>
          <Tooltip title="刷新">
            <Button type="text" size="small" icon={<ReloadOutlined />} onClick={handleRefresh} />
          </Tooltip>
          <Tooltip title="复制">
            <Button type="text" size="small" icon={<CopyOutlined />} onClick={handleCopy} />
          </Tooltip>
        </div>
      </div>
      <div className="ql-preview-body">
        <Input.TextArea
          value={qlExpression}
          readOnly
          rows={10}
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 13,
            background: '#fafafa',
            border: '1px solid #f0f0f0',
            borderRadius: 4,
            resize: 'none',
          }}
          placeholder="画布搭建完成后，此处自动生成QL表达式..."
        />
      </div>
      {qlExpression && (
        <div className="ql-preview-footer">
          <Tag color="green">表达式已生成</Tag>
          <span style={{ fontSize: 12, color: '#999' }}>此表达式供技术核对，业务无需关心</span>
        </div>
      )}
    </div>
  )
}

export default QLPreview
