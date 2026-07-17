import { create } from 'zustand'
import { SYSTEM_FIELDS } from '../config/nodes'

const useStore = create((set, get) => ({
  // Canvas
  graph: null,
  setGraph: (graph) => set({ graph }),

  // Selected node
  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node }),

  // Canvas JSON data (for saving/loading)
  canvasData: null,
  setCanvasData: (data) => set({ canvasData: data }),

  // Custom fields
  customFields: [],
  setCustomFields: (fields) => set({ customFields: fields }),
  addCustomField: (field) => set((state) => ({
    customFields: [...state.customFields, { ...field, id: 'cf_' + Date.now(), status: 'active', createdAt: new Date().toISOString() }],
  })),
  updateCustomField: (id, data) => set((state) => ({
    customFields: state.customFields.map((f) => (f.id === id ? { ...f, ...data } : f)),
  })),
  removeCustomField: (id) => set((state) => ({
    customFields: state.customFields.filter((f) => f.id !== id),
  })),
  deactivateCustomField: (id) => set((state) => ({
    customFields: state.customFields.map((f) => (f.id === id ? { ...f, status: 'inactive' } : f)),
  })),

  // All fields (system + custom)
  getAllFields: () => {
    const state = get()
    const activeCustom = state.customFields.filter((f) => f.status === 'active')
    return [...SYSTEM_FIELDS, ...activeCustom.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      category: '自定义字段',
      preset: f.preset || [],
      customFieldId: f.id,
    }))]
  },

  // QL Expression
  qlExpression: '',
  setQlExpression: (expr) => set({ qlExpression: expr }),

  // Simulation
  simulateVisible: false,
  setSimulateVisible: (v) => set({ simulateVisible: v }),

  // Rules list
  rules: [],
  setRules: (rules) => set({ rules }),
  addRule: (rule) => set((state) => ({ rules: [...state.rules, rule] })),

  // Current rule being edited
  currentRuleId: null,
  setCurrentRuleId: (id) => set({ currentRuleId: id }),

  // Field management modal
  fieldModalVisible: false,
  setFieldModalVisible: (v) => set({ fieldModalVisible: v }),

  // History
  history: [],
  historyIndex: -1,
  pushHistory: (data) => set((state) => {
    const newHistory = state.history.slice(0, state.historyIndex + 1)
    newHistory.push(data)
    return { history: newHistory, historyIndex: newHistory.length - 1 }
  }),
  undo: () => {
    const state = get()
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1
      set({ historyIndex: newIndex })
      return state.history[newIndex]
    }
    return null
  },
  redo: () => {
    const state = get()
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1
      set({ historyIndex: newIndex })
      return state.history[newIndex]
    }
    return null
  },
}))

export default useStore
