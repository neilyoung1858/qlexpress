import { SYSTEM_FIELDS } from '../config/nodes'

function findField(fieldId, customFields) {
  const sys = SYSTEM_FIELDS.find((f) => f.id === fieldId)
  if (sys) return sys
  return customFields.find((f) => f.id === fieldId)
}

function getCondFieldName(cond, customFields) {
  if (cond.fieldId) {
    const f = findField(cond.fieldId, customFields)
    if (f) return f.id
  }
  return cond.fieldName || cond.fieldId || 'unknown'
}

function getCondFieldType(cond, customFields) {
  if (cond.fieldType) return cond.fieldType
  if (cond.fieldId) {
    const f = findField(cond.fieldId, customFields)
    if (f) return f.type
  }
  return 'string'
}

function quoteVal(v) {
  if (typeof v === 'string' && isNaN(v)) return `"${v}"`
  return v
}

function generateSingleConditionQL(cond, customFields) {
  const varName = getCondFieldName(cond, customFields)
  const fieldType = getCondFieldType(cond, customFields)
  const operator = cond.operator
  const value = cond.value
  const value2 = cond.value2

  if (!operator) return 'true'

  if (operator === 'between') {
    const v1 = value != null && value !== '' ? value : null
    const v2 = value2 != null && value2 !== '' ? value2 : null
    if (v1 != null && v2 != null) {
      return `(${varName} >= ${v1} && ${varName} <= ${v2})`
    }
    if (v1 != null) return `${varName} >= ${v1}`
    if (v2 != null) return `${varName} <= ${v2}`
    return 'true'
  }

  if (operator === 'in') {
    if (Array.isArray(value) && value.length > 0) {
      const vals = value.map((v) => quoteVal(v)).join(',')
      return `in(${varName},[${vals}])`
    }
    return 'true'
  }
  if (operator === 'notIn') {
    if (Array.isArray(value) && value.length > 0) {
      const vals = value.map((v) => quoteVal(v)).join(',')
      return `!in(${varName},[${vals}])`
    }
    return 'true'
  }

  if (operator === 'contains') {
    return `indexOf(${varName},"${value}") >= 0`
  }
  if (operator === 'notContains') {
    return `indexOf(${varName},"${value}") < 0`
  }
  if (operator === 'startsWith') {
    return `indexOf(${varName},"${value}") == 0`
  }
  if (operator === 'endsWith') {
    return `indexOf(${varName},"${value}") == len(${varName}) - len("${value}")`
  }

  if (fieldType === 'boolean') {
    const boolVal = value === true || value === 'true' ? 'true' : 'false'
    return `${varName} == ${boolVal}`
  }

  if (fieldType === 'number' || fieldType === 'decimal' || fieldType === 'date' || fieldType === 'time') {
    return `${varName} ${operator} ${value}`
  }

  if (fieldType === 'enum') {
    const val = quoteVal(value)
    return `${varName} ${operator} ${val}`
  }

  return `${varName} ${operator} "${value}"`
}

function generateConditionQL(node, customFields) {
  if (!node.data.conditions || node.data.conditions.length === 0) return 'true'
  return node.data.conditions
    .map((cond) => generateSingleConditionQL(cond, customFields))
    .join(` ${node.data.logicOp || '&&'} `)
}

function generateCalculateQL(node, customFields) {
  const { amountField, rate } = node.data || {}
  const field = amountField || 'tradeAmt'
  const r = (rate != null && rate !== '') ? Number(rate) : 1
  return `${field} * ${r}`
}

function generateNoPointsQL(node) {
  const field = node.data?.nopField
  const val = node.data?.nopValue
  if (!field || !val) return ''
  const isNum = !isNaN(Number(val))
  const v = isNum ? val : `"${val}"`
  return `${field} == ${v}`
}

function getNodeLabel(type) {
  const labels = {
    start: '开始-交易积分核算',
    condition: '交易条件分流',
    calculate: '多倍积分计算',
    no_points: '无积分拦截',
    end: '输出最终积分',
  }
  return labels[type] || type
}

export function generateQLFromCanvas(graphData, customFields) {
  if (!graphData || !graphData.nodes) return ''

  const nodes = graphData.nodes
  const edges = graphData.edges || []

  let expression = ''

  const startNode = nodes.find((n) => n.shape === 'start')
  if (!startNode) return ''

  function buildBranch(nodeId, indent = 0, visited = new Set()) {
    if (visited.has(nodeId)) return ''
    visited.add(nodeId)

    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return ''

    const outEdges = edges.filter((e) => (e.source?.cell || e.source) === nodeId)
    const nodeType = node.shape
    const targetId = (edge) => edge.target?.cell || edge.target
    const ind = (d) => '  '.repeat(d)

    let result = ''

    if (nodeType === 'start') {
      result += `${ind(indent)}// === 开始：交易积分核算 ===\n`
      if (outEdges.length > 0) {
        result += buildBranch(targetId(outEdges[0]), indent, new Set(visited))
      }
    } else if (nodeType === 'condition') {
      let groups = node.data?.conditionGroups || []
      const logicOp = node.data?.logicOp || '&&'

      if (groups.length === 0 && node.data?.conditions?.length > 0) {
        groups = [{ logicOp: '&&', conditions: node.data.conditions }]
      }

      result += `${ind(indent)}// ◆ 条件分流：${node.data?.label || '交易条件'}\n`

      let allCondExpr = 'true'
      if (groups.length > 0) {
        const groupExprs = groups.map((g) => {
          if (!g.conditions || g.conditions.length === 0) return ''
          const exprs = g.conditions.map((c) => generateSingleConditionQL(c, customFields)).filter(Boolean)
          if (exprs.length === 0) return ''
          if (exprs.length === 1) return exprs[0]
          return `(${exprs.join(` ${g.logicOp || '&&'} `)})`
        }).filter(Boolean)
        if (groupExprs.length > 0) {
          allCondExpr = groupExprs.join(` ${logicOp} `)
        }
      }

      const subBranches = outEdges.map((edge, idx) => {
        const branchLabel = edge.data?.label || `分支${idx + 1}`
        const condPart = idx === 0 ? allCondExpr : 'true'
        const subExpr = buildBranch(targetId(edge), indent + 1, new Set(visited))
        return { label: branchLabel, cond: condPart, expr: subExpr }
      })

      if (subBranches.length === 1) {
        result += `${ind(indent)}if (${subBranches[0].cond}) {\n${subBranches[0].expr}${ind(indent)}}`
      } else {
        subBranches.forEach((b, i) => {
          const keyword = i === 0 ? 'if' : 'else if'
          result += `${ind(indent)}${keyword} (${b.cond}) {\n${b.expr}${ind(indent)}}`
          if (i < subBranches.length - 1) result += ' else '
        })
      }
    } else if (nodeType === 'calculate') {
      const calc = generateCalculateQL(node, customFields)
      result += `${ind(indent)}// ★ 积分计算：${node.data?.label || '多倍积分'}\n`
      result += `${ind(indent)}point = ${calc};\n`

      if (outEdges.length > 0) {
        result += buildBranch(targetId(outEdges[0]), indent, new Set(visited))
      }
    } else if (nodeType === 'no_points') {
      result += `${ind(indent)}// ⊘ 无积分拦截：${node.data?.label || '不计积分'}\n`
      const cond = generateNoPointsQL(node)
      if (cond) {
        const yBranch = outEdges[0] ? buildBranch(targetId(outEdges[0]), indent + 1, new Set(visited)) : ''
        const nBranch = outEdges[1] ? buildBranch(targetId(outEdges[1]), indent + 1, new Set(visited)) : ''
        result += `${ind(indent)}if (${cond}) {\n${nBranch}${ind(indent)}  point = 0;\n${ind(indent)}} else {\n${yBranch}${ind(indent)}}`
      } else {
        result += `${ind(indent)}point = 0;\n`
        if (outEdges.length > 0) {
          result += buildBranch(targetId(outEdges[0]), indent, new Set(visited))
        }
      }
    } else if (nodeType === 'return') {
      const rv = node.data?.returnValue
      result += `${ind(indent)}// ↵ 失败响应：${rv || '未设置'}\n`
      result += `${ind(indent)}${rv ? (isNaN(rv) ? `"${rv}"` : rv) : 'null'};\n`
    } else if (nodeType === 'end') {
      result += `${ind(indent)}// ● 输出最终积分\n`
      result += `${ind(indent)}point;\n`
    }

    return result
  }

  expression = buildBranch(startNode.id)
  return expression.trim()
}

export function generateQLShort(graphData, customFields) {
  const full = generateQLFromCanvas(graphData, customFields)
  return full.replace(/\/\/.*/g, '').replace(/\s+/g, ' ').trim()
}
