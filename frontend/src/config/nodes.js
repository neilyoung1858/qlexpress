export const NODE_TYPES = {
  START: 'start',
  CONDITION: 'condition',
  CALCULATE: 'calculate',
  NO_POINTS: 'no_points',

  END: 'end',
  RETURN: 'return',
}

export const NODE_DEFINITIONS = [
  {
    type: NODE_TYPES.START,
    label: '开始-交易积分核算',
    icon: '⊙',
    color: '#22c55e',
    description: '流程起点，自动固定在画布顶部',
    draggable: false,
    configurable: false,
  },
  {
    type: NODE_TYPES.CONDITION,
    label: '交易条件分流',
    icon: '◇',
    color: '#fa8c16',
    description: '按交易信息区分规则（金额、商户MCC、卡种等）',
    draggable: true,
    configurable: true,
    maxBranches: 4,
  },
  {
    type: NODE_TYPES.CALCULATE,
    label: '多倍积分计算',
    icon: '×',
    color: '#1890ff',
    description: '设置积分倍率、单笔积分上限',
    draggable: true,
    configurable: true,
  },
  {
    type: NODE_TYPES.NO_POINTS,
    label: '无积分拦截',
    icon: '⊘',
    color: '#ff4d4f',
    description: '批发、房产、购车、公益类不计积分',
    draggable: true,
    configurable: true,
  },

  {
    type: NODE_TYPES.END,
    label: '输出最终积分',
    icon: '●',
    color: '#6366f1',
    description: '流程终点，每个分支必须落地',
    draggable: false,
    configurable: false,
  },
  {
    type: NODE_TYPES.RETURN,
    label: '失败响应',
    icon: '↵',
    color: '#ef4444',
    description: '条件不成立时的失败处理，可被多个组件指向',
    draggable: true,
    configurable: true,
  },
]

export const SYSTEM_FIELDS = [
  { id: 'tradeAmt', name: '交易金额', type: 'number', category: '系统内置字段', preset: [] },
  { id: 'mcc', name: '商户MCC', type: 'enum', category: '系统内置字段', preset: ['5812-餐饮', '5411-超市', '5311-百货', '1520-房产', '7011-酒店', '4511-航空'] },
  { id: 'cardType', name: '卡片类型', type: 'enum', category: '系统内置字段', preset: ['白金卡', '金卡', '普通卡', '钻石卡'] },
  { id: 'userLevel', name: '用户等级', type: 'enum', category: '系统内置字段', preset: ['普通用户', '黄金会员', '白金会员', '钻石会员'] },
  { id: 'transactionDate', name: '交易日期', type: 'date', category: '系统内置字段', preset: [] },
  { id: 'isReturn', name: '是否退货', type: 'boolean', category: '系统内置字段', preset: [] },
  { id: 'isInstallment', name: '是否分期', type: 'boolean', category: '系统内置字段', preset: [] },
]

export const OPERATORS_BY_TYPE = {
  number: [
    { value: 'between', label: '在区间内' },
    { value: '>', label: '大于' },
    { value: '>=', label: '大于等于' },
    { value: '<', label: '小于' },
    { value: '<=', label: '小于等于' },
    { value: '==', label: '等于' },
    { value: '!=', label: '不等于' },
  ],
  decimal: [
    { value: 'between', label: '在区间内' },
    { value: '>', label: '大于' },
    { value: '>=', label: '大于等于' },
    { value: '<', label: '小于' },
    { value: '<=', label: '小于等于' },
    { value: '==', label: '等于' },
    { value: '!=', label: '不等于' },
  ],
  string: [
    { value: '==', label: '等于' },
    { value: '!=', label: '不等于' },
    { value: 'contains', label: '包含' },
    { value: 'notContains', label: '不包含' },
    { value: 'startsWith', label: '开头是' },
    { value: 'endsWith', label: '结尾是' },
  ],
  enum: [
    { value: '==', label: '等于' },
    { value: '!=', label: '不等于' },
    { value: 'in', label: '属于指定列表' },
    { value: 'notIn', label: '不属于列表' },
  ],
  boolean: [
    { value: '==', label: '等于' },
  ],
  date: [
    { value: 'between', label: '在区间内' },
    { value: '>', label: '晚于' },
    { value: '<', label: '早于' },
    { value: '>=', label: '晚于等于' },
    { value: '<=', label: '早于等于' },
    { value: '==', label: '等于' },
  ],
  time: [
    { value: 'between', label: '在区间内' },
    { value: '>', label: '晚于' },
    { value: '<', label: '早于' },
    { value: '>=', label: '晚于等于' },
    { value: '<=', label: '早于等于' },
    { value: '==', label: '等于' },
  ],
}

export const TYPE_OPTIONS = [
  { value: 'number', label: '数字(整数)' },
  { value: 'decimal', label: '数字(小数)' },
  { value: 'string', label: '文本' },
  { value: 'boolean', label: '布尔(是/否)' },
  { value: 'date', label: '日期' },
  { value: 'time', label: '时间' },
]

export const POINT_RATIOS = [
  { value: '1元1分', label: '1元1分', rate: 1 },
  { value: '10元1分', label: '10元1分', rate: 0.1 },
  { value: '20元1分', label: '20元1分', rate: 0.05 },
]

export const POINT_MULTIPLIERS = [
  { value: 0, label: '0倍' },
  { value: 1, label: '1倍' },
  { value: 2, label: '2倍' },
  { value: 3, label: '3倍' },
  { value: 5, label: '5倍' },
  { value: 10, label: '10倍' },
]

export const DEFAULT_EDGE_COLOR = '#91d5ff'
export const HIGHLIGHT_EDGE_COLOR = '#52c41a'
