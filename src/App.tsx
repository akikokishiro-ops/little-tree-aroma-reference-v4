import { useState, useEffect } from 'react'
import './App.css'

// ========== Types ==========
interface Aroma {
  id: string
  name: string
  categoryIds: string[]
  owned: boolean
  hasMetaphor: boolean
  description: string
  poem: string
  whenToUse: string
  metaphor: string
  memo: string
  imagePaths: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface Category {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

// ========== Utilities ==========
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

const now = () => new Date().toISOString()

// ========== Storage ==========
const AROMAS_KEY = 'little_tree_aroma_data'
const CATEGORIES_KEY = 'little_tree_aroma_categories'

// ========== Data Normalization ==========
const normalizeAroma = (aroma: any): Aroma => ({
  id: aroma.id || generateId(),
  name: aroma.name ?? '',
  categoryIds: Array.isArray(aroma.categoryIds) ? aroma.categoryIds : [],
  owned: Boolean(aroma.owned),
  hasMetaphor: Boolean(aroma.hasMetaphor),
  description: aroma.description ?? '',
  poem: aroma.poem ?? '',
  whenToUse: aroma.whenToUse ?? '',
  metaphor: aroma.metaphor ?? '',
  memo: aroma.memo ?? '',
  imagePaths: Array.isArray(aroma.imagePaths) ? aroma.imagePaths : [],
  tags: Array.isArray(aroma.tags) ? aroma.tags : [],
  createdAt: aroma.createdAt ?? now(),
  updatedAt: aroma.updatedAt ?? now(),
})

const normalizeCategory = (category: any): Category => ({
  id: category.id || generateId(),
  name: category.name ?? '',
  createdAt: category.createdAt ?? now(),
  updatedAt: category.updatedAt ?? now(),
})

const storage = {
  getAromas: (): Aroma[] => {
    const data = localStorage.getItem(AROMAS_KEY)
    try {
      return data ? JSON.parse(data).map(normalizeAroma) : []
    } catch {
      return []
    }
  },
  setAromas: (aromas: Aroma[]) => {
    localStorage.setItem(AROMAS_KEY, JSON.stringify(aromas))
  },
  getCategories: (): Category[] => {
    const data = localStorage.getItem(CATEGORIES_KEY)
    try {
      return data ? JSON.parse(data).map(normalizeCategory) : []
    } catch {
      return []
    }
  },
  setCategories: (categories: Category[]) => {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
  },
}

// ========== Utilities ==========
const toAssetUrl = (path: string) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path
  }
  const cleanPath = path.replace(/^\/+/, '')
  return `${import.meta.env.BASE_URL}${cleanPath}`
}

// ========== DeleteConfirmModal ==========
interface DeleteConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-buttons">
          <button className="btn-cancel" onClick={onCancel}>
            キャンセル
          </button>
          <button className="btn-delete" onClick={onConfirm}>
            削除
          </button>
        </div>
      </div>
    </div>
  )
}

// ========== AromaEdit ==========
interface AromaEditProps {
  aroma?: Aroma
  categories: Category[]
  onSave: (aroma: Aroma) => void
  onCancel: () => void
}

const AromaEdit: React.FC<AromaEditProps> = ({ aroma, categories, onSave, onCancel }) => {
  const normalizedAroma = aroma ? normalizeAroma(aroma) : undefined

  const [formData, setFormData] = useState<Aroma>(
    normalizedAroma || {
      id: generateId(),
      name: '',
      categoryIds: [],
      owned: false,
      hasMetaphor: false,
      description: '',
      poem: '',
      whenToUse: '',
      metaphor: '',
      memo: '',
      imagePaths: [],
      tags: [],
      createdAt: now(),
      updatedAt: now(),
    }
  )

  const [imagePathsText, setImagePathsText] = useState(
    (normalizedAroma?.imagePaths ?? []).join('\n')
  )

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.currentTarget
    setFormData(prev => ({
      ...prev,
      [name]: value,
      updatedAt: now(),
    }))
  }

  const handleBooleanChange =
    (field: 'owned' | 'hasMetaphor') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.currentTarget.checked
      setFormData(prev => ({
        ...prev,
        [field]: checked,
        updatedAt: now(),
      }))
    }

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId],
      updatedAt: now(),
    }))
  }

  const handleTagsChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      tags: value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      updatedAt: now(),
    }))
  }

  const handleImagePathsChange = (value: string) => {
    setImagePathsText(value)
    const paths = value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
    setFormData(prev => ({
      ...prev,
      imagePaths: paths,
      updatedAt: now(),
    }))
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('アロマ名を入力してください')
      return
    }
    onSave(formData)
  }

  return (
    <div className="edit-container">
      <h1>{aroma ? 'アロマを編集' : '新規アロマを追加'}</h1>

      <div className="form-group">
        <label>アロマ名 *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="例: マリア"
        />
      </div>

      <div className="form-group">
        <label>説明</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="アロマの説明"
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>用途</label>
        <textarea
          name="whenToUse"
          value={formData.whenToUse}
          onChange={handleChange}
          placeholder="いつ使うか"
          rows={2}
        />
      </div>

      <div className="form-group">
        <label>詩</label>
        <textarea
          name="poem"
          value={formData.poem}
          onChange={handleChange}
          placeholder="アロマに関連する詩"
          rows={2}
        />
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            name="hasMetaphor"
            checked={Boolean(formData.hasMetaphor)}
            onChange={handleBooleanChange('hasMetaphor')}
          />
          メタファーあり
        </label>
      </div>

      {formData.hasMetaphor && (
        <div className="form-group">
          <label>メタファー</label>
          <textarea
            name="metaphor"
            value={formData.metaphor}
            onChange={handleChange}
            placeholder="メタファーの説明"
            rows={2}
          />
        </div>
      )}

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            name="owned"
            checked={Boolean(formData.owned)}
            onChange={handleBooleanChange('owned')}
          />
          所持している
        </label>
      </div>

      <div className="form-group">
        <label>カテゴリ</label>
        <div className="checkbox-group">
          {categories.map(category => (
            <label key={category.id}>
              <input
                type="checkbox"
                checked={formData.categoryIds.includes(category.id)}
                onChange={() => handleCategoryToggle(category.id)}
              />
              {category.name}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>タグ (カンマ区切り)</label>
        <input
          type="text"
          value={formData.tags.join(', ')}
          onChange={e => handleTagsChange(e.target.value)}
          placeholder="例: 朝用, リラックス, 瞑想"
        />
      </div>

      <div className="form-group">
        <label>画像パス (1行に1つ)</label>
        <textarea
          value={imagePathsText}
          onChange={e => handleImagePathsChange(e.target.value)}
          placeholder="例:&#10;/aromas/maria-1.jpg&#10;/aromas/maria-2.jpg"
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>メモ</label>
        <textarea
          name="memo"
          value={formData.memo}
          onChange={handleChange}
          placeholder="その他のメモ"
          rows={2}
        />
      </div>

      <div className="form-buttons">
        <button className="btn-cancel" onClick={onCancel}>
          キャンセル
        </button>
        <button className="btn-primary" onClick={handleSave}>
          保存
        </button>
      </div>
    </div>
  )
}

// ========== AromaDetail ==========
interface AromaDetailProps {
  aroma: Aroma
  categories: Category[]
  onEdit: () => void
  onDelete: () => void
  onBack: () => void
}

const AromaDetail: React.FC<AromaDetailProps> = ({ aroma, categories, onEdit, onDelete, onBack }) => {
  const normalizedAroma = normalizeAroma(aroma)
  const categoryNames = categories
    .filter(cat => (normalizedAroma.categoryIds ?? []).includes(cat.id))
    .map(cat => cat.name)
    .join(', ')

  return (
    <div className="detail-container">
      <button className="btn-back" onClick={onBack}>
        ← 戻る
      </button>

      <h1>{normalizedAroma.name}</h1>

      {(normalizedAroma.imagePaths ?? []).length > 0 ? (
        <div className="image-gallery">
          {normalizedAroma.imagePaths.map((path, index) => (
            <div key={index} className="image-item">
              <img
                src={toAssetUrl(path)}
                alt={`${normalizedAroma.name} - 画像${index + 1}`}
                onError={e => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none'
                  const errorDiv = document.createElement('div')
                  errorDiv.className = 'image-error'
                  errorDiv.textContent = '画像を読み込めません'
                  e.currentTarget.parentElement?.appendChild(errorDiv)
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="image-placeholder">
          <p>画像がありません</p>
        </div>
      )}

      <div className="detail-info">
        <div className="info-row">
          <span className="label">所持:</span>
          <span>{normalizedAroma.owned ? '✓ あり' : 'なし'}</span>
        </div>

        {categoryNames && (
          <div className="info-row">
            <span className="label">カテゴリ:</span>
            <span>{categoryNames}</span>
          </div>
        )}

        {(normalizedAroma.tags ?? []).length > 0 && (
          <div className="info-row">
            <span className="label">タグ:</span>
            <div className="tags">
              {normalizedAroma.tags.map(tag => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {normalizedAroma.description && (
          <div className="info-section">
            <h3>説明</h3>
            <p>{normalizedAroma.description}</p>
          </div>
        )}

        {normalizedAroma.whenToUse && (
          <div className="info-section">
            <h3>用途</h3>
            <p>{normalizedAroma.whenToUse}</p>
          </div>
        )}

        {normalizedAroma.poem && (
          <div className="info-section">
            <h3>詩</h3>
            <p>{normalizedAroma.poem}</p>
          </div>
        )}

        {normalizedAroma.hasMetaphor && normalizedAroma.metaphor && (
          <div className="info-section">
            <h3>メタファー</h3>
            <p>{normalizedAroma.metaphor}</p>
          </div>
        )}

        {normalizedAroma.memo && (
          <div className="info-section">
            <h3>メモ</h3>
            <p>{normalizedAroma.memo}</p>
          </div>
        )}
      </div>

      <div className="detail-buttons">
        <button className="btn-primary" onClick={onEdit}>
          編集
        </button>
        <button className="btn-delete" onClick={onDelete}>
          削除
        </button>
      </div>
    </div>
  )
}

// ========== AromaList ==========
interface AromaListProps {
  aromas: Aroma[]
  categories: Category[]
  onSelectAroma: (aromaId: string) => void
  onAddAroma: () => void
  onOpenSettings: () => void
}

interface ListFilters {
  searchText: string
  selectedCategoryId: string | null
  showOwned: boolean | null
  showHasMetaphor: boolean | null
}

const AromaList: React.FC<AromaListProps> = ({
  aromas,
  categories,
  onSelectAroma,
  onAddAroma,
  onOpenSettings,
}) => {
  const [filters, setFilters] = useState<ListFilters>({
    searchText: '',
    selectedCategoryId: null,
    showOwned: null,
    showHasMetaphor: null,
  })

  const filteredAromas = aromas.filter(aroma => {
    // Search
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      const name = (aroma.name ?? '').toLowerCase()
      const desc = (aroma.description ?? '').toLowerCase()
      const memo = (aroma.memo ?? '').toLowerCase()
      const matchesName = name.includes(searchLower)
      const matchesDesc = desc.includes(searchLower)
      const matchesMemo = memo.includes(searchLower)
      const matchesTags = (aroma.tags ?? []).some(tag =>
        tag.toLowerCase().includes(searchLower)
      )
      if (!matchesName && !matchesDesc && !matchesMemo && !matchesTags) {
        return false
      }
    }

    // Category filter
    if (filters.selectedCategoryId) {
      if (!(aroma.categoryIds ?? []).includes(filters.selectedCategoryId)) {
        return false
      }
    }

    // Owned filter
    if (filters.showOwned !== null) {
      if (Boolean(aroma.owned) !== filters.showOwned) {
        return false
      }
    }

    // Metaphor filter
    if (filters.showHasMetaphor !== null) {
      if (Boolean(aroma.hasMetaphor) !== filters.showHasMetaphor) {
        return false
      }
    }

    return true
  })

  const getThumbnail = (aroma: Aroma) => {
    if ((aroma.imagePaths ?? []).length > 0) {
      return aroma.imagePaths[0]
    }
    return null
  }

  return (
    <div className="list-container">
      <div className="list-header">
        <h1>Little Tree Aroma Reference</h1>
        <div className="header-buttons">
          <button className="btn-primary" onClick={onAddAroma}>
            +
          </button>
          <button className="btn-settings" onClick={onOpenSettings}>
            ⚙
          </button>
        </div>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="検索..."
          value={filters.searchText}
          onChange={e =>
            setFilters(prev => ({ ...prev, searchText: e.target.value }))
          }
          className="search-input"
        />

        <div className="filter-row">
          <select
            value={filters.selectedCategoryId || ''}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                selectedCategoryId: e.target.value ? e.target.value : null,
              }))
            }
            className="filter-select"
          >
            <option value="">カテゴリ: すべて</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-row">
          <label>
            <input
              type="checkbox"
              checked={filters.showOwned === true}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  showOwned: e.target.checked ? true : null,
                }))
              }
            />
            所持している
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.showHasMetaphor === true}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  showHasMetaphor: e.target.checked ? true : null,
                }))
              }
            />
            メタファーあり
          </label>
        </div>
      </div>

      <div className="list-count">
        {filteredAromas.length} 件
      </div>

      <div className="aroma-list">
        {filteredAromas.length > 0 ? (
          filteredAromas.map(aroma => {
            const thumbnail = getThumbnail(aroma)
            return (
              <div
                key={aroma.id}
                className="aroma-card"
                onClick={() => onSelectAroma(aroma.id)}
              >
                {thumbnail ? (
                  <img
                    src={toAssetUrl(thumbnail)}
                    alt={aroma.name}
                    className="aroma-thumbnail"
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).src =
                        'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23e8dcc8%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E'
                    }}
                  />
                ) : (
                  <div className="aroma-thumbnail-placeholder" />
                )}
                <div className="aroma-card-info">
                  <h3>{aroma.name}</h3>
                  {Boolean(aroma.owned) && <span className="badge owned">所持</span>}
                  {Boolean(aroma.hasMetaphor) && (
                    <span className="badge metaphor">メタファー</span>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="no-results">検索結果がありません</div>
        )}
      </div>
    </div>
  )
}

// ========== Settings ==========
interface SettingsProps {
  categories: Category[]
  aromas: Aroma[]
  onAddCategory: (name: string) => void
  onDeleteCategory: (categoryId: string) => void
  onEditCategory: (categoryId: string, name: string) => void
  onExport: () => void
  onImport: (data: { aromas: Aroma[]; categories: Category[] }) => void
  onBack: () => void
}

const Settings: React.FC<SettingsProps> = ({
  categories,
  aromas,
  onAddCategory,
  onDeleteCategory,
  onEditCategory,
  onExport,
  onImport,
  onBack,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    categoryId: string
  }>({ isOpen: false, categoryId: '' })

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName)
      setNewCategoryName('')
    }
  }

  const handleSaveEdit = (categoryId: string) => {
    if (editingCategoryName.trim()) {
      onEditCategory(categoryId, editingCategoryName)
      setEditingCategoryId(null)
      setEditingCategoryName('')
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event: ProgressEvent<FileReader>) => {
          try {
            const data = JSON.parse(event.target?.result as string)
            if (data.aromas && data.categories) {
              onImport(data)
              alert('インポートしました')
            } else {
              alert('不正なファイル形式です')
            }
          } catch {
            alert('ファイルの読み込みに失敗しました')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const storedAromas = storage.getAromas()
  const storedCategories = storage.getCategories()

  return (
    <div className="settings-container">
      <button className="btn-back" onClick={onBack}>
        ← 戻る
      </button>

      <h1>設定</h1>

      <div className="settings-section">
        <h2>カテゴリ管理</h2>
        <div className="category-form">
          <input
            type="text"
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            placeholder="新しいカテゴリ名"
            onKeyPress={e => {
              if (e.key === 'Enter') {
                handleAddCategory()
              }
            }}
          />
          <button className="btn-primary" onClick={handleAddCategory}>
            追加
          </button>
        </div>

        <div className="category-list">
          {categories.length > 0 ? (
            categories.map(category => (
              <div key={category.id} className="category-item">
                {editingCategoryId === category.id ? (
                  <div className="category-edit">
                    <input
                      type="text"
                      value={editingCategoryName}
                      onChange={e => setEditingCategoryName(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          handleSaveEdit(category.id)
                        }
                      }}
                      autoFocus
                    />
                    <button
                      className="btn-small-primary"
                      onClick={() => handleSaveEdit(category.id)}
                    >
                      保存
                    </button>
                    <button
                      className="btn-small-cancel"
                      onClick={() => {
                        setEditingCategoryId(null)
                        setEditingCategoryName('')
                      }}
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <div className="category-view">
                    <span>{category.name}</span>
                    <div className="category-buttons">
                      <button
                        className="btn-small-edit"
                        onClick={() => {
                          setEditingCategoryId(category.id)
                          setEditingCategoryName(category.name)
                        }}
                      >
                        編集
                      </button>
                      <button
                        className="btn-small-delete"
                        onClick={() =>
                          setDeleteConfirm({
                            isOpen: true,
                            categoryId: category.id,
                          })
                        }
                      >
                        削除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>カテゴリはまだありません</p>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h2>データ管理</h2>
        <div className="storage-status">
          <p>現在のアロマ件数: <strong>{aromas.length}</strong></p>
          <p>現在のカテゴリ件数: <strong>{categories.length}</strong></p>
          <p>localStorage内のアロマ件数: <strong>{storedAromas.length}</strong></p>
          <p>
            localStorage内のカテゴリ件数: <strong>{storedCategories.length}</strong>
          </p>
        </div>

        <div className="data-buttons">
          <button className="btn-primary" onClick={onExport}>
            JSONエクスポート
          </button>
          <button className="btn-primary" onClick={handleImport}>
            JSONインポート
          </button>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="カテゴリを削除"
        message={`「${
          categories.find(c => c.id === deleteConfirm.categoryId)?.name || ''
        }」を削除してもよろしいですか？`}
        onConfirm={() => {
          onDeleteCategory(deleteConfirm.categoryId)
          setDeleteConfirm({ isOpen: false, categoryId: '' })
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, categoryId: '' })}
      />
    </div>
  )
}

// ========== App ==========
type Screen = 'list' | 'detail' | 'edit' | 'settings'

export default function App() {
  const [screen, setScreen] = useState<Screen>('list')
  const [selectedAromaId, setSelectedAromaId] = useState<string | null>(null)
  const [editingAromaId, setEditingAromaId] = useState<string | null>(null)
  const [aromas, setAromas] = useState<Aroma[]>(storage.getAromas())
  const [categories, setCategories] = useState<Category[]>(storage.getCategories())
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    aromaId: string
  }>({ isOpen: false, aromaId: '' })

  // Save to localStorage whenever data changes
  useEffect(() => {
    storage.setAromas(aromas)
  }, [aromas])

  useEffect(() => {
    storage.setCategories(categories)
  }, [categories])

  // Handle aroma selection
  const handleSelectAroma = (aromaId: string) => {
    setSelectedAromaId(aromaId)
    setScreen('detail')
  }

  // Handle aroma add/edit
  const handleSaveAroma = (aroma: Aroma) => {
    if (editingAromaId) {
      setAromas(prev =>
        prev.map(a => (a.id === editingAromaId ? aroma : a))
      )
      setEditingAromaId(null)
    } else {
      setAromas(prev => [...prev, aroma])
    }
    setScreen('list')
  }

  // Handle aroma delete
  const handleDeleteAroma = () => {
    if (selectedAromaId) {
      setAromas(prev => prev.filter(a => a.id !== selectedAromaId))
      setDeleteConfirm({ isOpen: false, aromaId: '' })
      setSelectedAromaId(null)
      setScreen('list')
    }
  }

  // Handle category operations
  const handleAddCategory = (name: string) => {
    const newCategory: Category = {
      id: generateId(),
      name,
      createdAt: now(),
      updatedAt: now(),
    }
    setCategories(prev => [...prev, newCategory])
  }

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId))
    setAromas(prev =>
      prev.map(a => ({
        ...a,
        categoryIds: a.categoryIds.filter(id => id !== categoryId),
      }))
    )
  }

  const handleEditCategory = (categoryId: string, name: string) => {
    setCategories(prev =>
      prev.map(c =>
        c.id === categoryId
          ? { ...c, name, updatedAt: now() }
          : c
      )
    )
  }

  // Handle export
  const handleExport = () => {
    const data = {
      aromas,
      categories,
    }
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `aroma-data-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Handle import
  const handleImport = (data: { aromas: Aroma[]; categories: Category[] }) => {
    setAromas(data.aromas)
    setCategories(data.categories)
  }

  const selectedAroma = aromas.find(a => a.id === selectedAromaId)

  return (
    <div className="app">
      {screen === 'list' && (
        <AromaList
          aromas={aromas}
          categories={categories}
          onSelectAroma={handleSelectAroma}
          onAddAroma={() => {
            setEditingAromaId(null)
            setScreen('edit')
          }}
          onOpenSettings={() => setScreen('settings')}
        />
      )}

      {screen === 'detail' && selectedAroma && (
        <AromaDetail
          aroma={selectedAroma}
          categories={categories}
          onEdit={() => {
            setEditingAromaId(selectedAroma.id)
            setScreen('edit')
          }}
          onDelete={() =>
            setDeleteConfirm({ isOpen: true, aromaId: selectedAroma.id })
          }
          onBack={() => {
            setSelectedAromaId(null)
            setScreen('list')
          }}
        />
      )}

      {screen === 'edit' && (
        <AromaEdit
          aroma={
            editingAromaId
              ? aromas.find(a => a.id === editingAromaId)
              : undefined
          }
          categories={categories}
          onSave={handleSaveAroma}
          onCancel={() => {
            setEditingAromaId(null)
            setScreen('list')
          }}
        />
      )}

      {screen === 'settings' && (
        <Settings
          categories={categories}
          aromas={aromas}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
          onEditCategory={handleEditCategory}
          onExport={handleExport}
          onImport={handleImport}
          onBack={() => setScreen('list')}
        />
      )}

      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="アロマを削除"
        message={`「${selectedAroma?.name || ''}」を削除してもよろしいですか？`}
        onConfirm={handleDeleteAroma}
        onCancel={() => setDeleteConfirm({ isOpen: false, aromaId: '' })}
      />
    </div>
  )
}
