import { useState, useEffect, useRef } from 'react'
import './todo.css'

// ── Helpers ──────────────────────────────────────────────────────────────────

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function today() {
  return new Date().setHours(0, 0, 0, 0)
}

function isOverdue(todo) {
  return todo.dueDate && !todo.completed && new Date(todo.dueDate).getTime() < today()
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }
const PRIORITY_LABELS = { high: '高', medium: '中', low: '低' }
const FILTER_LABELS = { all: '全て', active: '未完了', completed: '完了' }

// ── Custom Hook: Todos ────────────────────────────────────────────────────────

function useTodos() {
  const [todos, setTodos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('todos') || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  const addTodo = (text, priority, dueDate) => {
    if (!text.trim()) return
    setTodos(prev => [
      { id: genId(), text: text.trim(), completed: false, priority, dueDate, createdAt: Date.now() },
      ...prev,
    ])
  }

  const toggleTodo = id =>
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))

  const deleteTodo = id =>
    setTodos(prev => prev.filter(t => t.id !== id))

  const updateTodo = (id, changes) =>
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t))

  const clearCompleted = () =>
    setTodos(prev => prev.filter(t => !t.completed))

  return { todos, addTodo, toggleTodo, deleteTodo, updateTodo, clearCompleted }
}

// ── AddTodoForm ───────────────────────────────────────────────────────────────

function AddTodoForm({ onAdd }) {
  const [text, setText] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef(null)

  const handleSubmit = e => {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(text, priority, dueDate)
    setText('')
    setDueDate('')
    setExpanded(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = e => {
    if (e.key === 'Escape') {
      setExpanded(false)
      inputRef.current?.blur()
    }
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <div className="add-row">
        <input
          ref={inputRef}
          className="add-input"
          placeholder="新しいタスクを追加..."
          value={text}
          onChange={e => setText(e.target.value)}
          onFocus={() => setExpanded(true)}
          onKeyDown={handleKeyDown}
        />
        <button type="submit" className="add-btn" disabled={!text.trim()}>
          追加
        </button>
      </div>

      {expanded && (
        <div className="add-options">
          <div className="priority-select">
            {['high', 'medium', 'low'].map(p => (
              <button
                key={p}
                type="button"
                className={`priority-btn priority-${p} ${priority === p ? 'active' : ''}`}
                onClick={() => setPriority(p)}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
          <input
            type="date"
            className="date-input"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
          />
        </div>
      )}
    </form>
  )
}

// ── TodoItem ──────────────────────────────────────────────────────────────────

function TodoItem({ todo, onToggle, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(todo.text)
  const editRef = useRef(null)

  useEffect(() => {
    if (editing) editRef.current?.focus()
  }, [editing])

  const startEdit = () => {
    if (todo.completed) return
    setEditText(todo.text)
    setEditing(true)
  }

  const commitEdit = () => {
    const trimmed = editText.trim()
    if (trimmed && trimmed !== todo.text) {
      onUpdate(todo.id, { text: trimmed })
    } else {
      setEditText(todo.text)
    }
    setEditing(false)
  }

  const handleEditKey = e => {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') { setEditText(todo.text); setEditing(false) }
  }

  const overdue = isOverdue(todo)

  return (
    <li className={`todo-item priority-${todo.priority}${todo.completed ? ' completed' : ''}${overdue ? ' overdue' : ''}`}>
      <button
        className="check-btn"
        onClick={() => onToggle(todo.id)}
        aria-label={todo.completed ? '未完了にする' : '完了にする'}
      >
        {todo.completed && '✓'}
      </button>

      <div className="todo-content">
        {editing ? (
          <input
            ref={editRef}
            className="edit-input"
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleEditKey}
          />
        ) : (
          <span
            className="todo-text"
            onDoubleClick={startEdit}
            title={todo.completed ? '' : 'ダブルクリックで編集'}
          >
            {todo.text}
          </span>
        )}

        <div className="todo-meta">
          <span className={`priority-badge priority-${todo.priority}`}>
            {PRIORITY_LABELS[todo.priority]}
          </span>
          {todo.dueDate && (
            <span className={`due-date${overdue ? ' overdue-text' : ''}`}>
              {overdue ? '⚠ 期限切れ: ' : '📅 '}{todo.dueDate}
            </span>
          )}
        </div>
      </div>

      <button
        className="delete-btn"
        onClick={() => onDelete(todo.id)}
        aria-label="削除"
      >
        ✕
      </button>
    </li>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'created', label: '追加順' },
  { value: 'priority', label: '優先度順' },
  { value: 'dueDate', label: '期日順' },
]

export default function App() {
  const { todos, addTodo, toggleTodo, deleteTodo, updateTodo, clearCompleted } = useTodos()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('created')

  const activeCount = todos.filter(t => !t.completed).length
  const completedCount = todos.filter(t => t.completed).length
  const overdueCount = todos.filter(t => isOverdue(t)).length

  const visible = todos
    .filter(t => {
      if (filter === 'active' && t.completed) return false
      if (filter === 'completed' && !t.completed) return false
      if (search && !t.text.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if (sort === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      if (sort === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate.localeCompare(b.dueDate)
      }
      return b.createdAt - a.createdAt
    })

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1 className="title">ToDoリスト</h1>
          <div className="stats">
            <span className="stat">残り <strong>{activeCount}</strong> 件</span>
            <span className="stat">完了 <strong>{completedCount}</strong> 件</span>
            {overdueCount > 0 && (
              <span className="stat" style={{ color: '#ef5350' }}>
                期限切れ <strong>{overdueCount}</strong> 件
              </span>
            )}
          </div>
        </header>

        <AddTodoForm onAdd={addTodo} />

        <div className="controls">
          <div className="filter-tabs">
            {['all', 'active', 'completed'].map(f => (
              <button
                key={f}
                className={`filter-tab${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {FILTER_LABELS[f]}
                {f === 'all' && ` (${todos.length})`}
                {f === 'active' && ` (${activeCount})`}
                {f === 'completed' && ` (${completedCount})`}
              </button>
            ))}
          </div>
          <input
            className="search-input"
            placeholder="🔍 タスクを検索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="sort-bar">
          <span className="sort-label">並び替え:</span>
          <select
            className="sort-select"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {visible.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{todos.length === 0 ? '📋' : '🔍'}</div>
            <p>
              {todos.length === 0
                ? 'タスクがありません。上から追加してください。'
                : '条件に一致するタスクが見つかりません。'}
            </p>
          </div>
        ) : (
          <ul className="todo-list">
            {visible.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onUpdate={updateTodo}
              />
            ))}
          </ul>
        )}

        {completedCount > 0 && (
          <div className="footer">
            <button className="clear-btn" onClick={clearCompleted}>
              完了済みを削除 ({completedCount})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
