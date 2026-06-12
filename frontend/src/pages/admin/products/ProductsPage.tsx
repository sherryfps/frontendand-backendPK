import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, Pencil, Trash2, X, CheckCircle2, AlertCircle,
  ImagePlus, Shirt, Package, ToggleLeft, ToggleRight, Filter,
  Eye, EyeOff, ChevronLeft, ChevronRight, Tag, Upload, Loader2,
  ShoppingBag,
} from 'lucide-react'
import { productService, TShirtProduct, AdminProductPayload } from '@/services/productService'
import toast from 'react-hot-toast'

// ─── Constants ──────────────────────────────────────────────────
const SIZES_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']
const CATEGORIES  = ['Round Neck', 'Polo', 'Collar', 'Hoodie', 'Henley', 'V-Neck', 'Oversized']
const FABRIC_TYPES = ['Cotton', 'Polyester', 'Cotton-Poly Blend', 'Pique', 'Fleece']
const GSM_OPTIONS  = ['140 GSM', '160 GSM', '180 GSM', '200 GSM', '220 GSM', '240 GSM', '260 GSM', '320 GSM']
const NECK_TYPES   = ['Round', 'V-Neck', 'Polo', 'Henley', 'Turtleneck', 'Crew']
const SLEEVE_TYPES = ['Short Sleeve', 'Long Sleeve', 'Sleeveless', '3/4 Sleeve']
const PRINT_TYPE_SUGGESTIONS = ['Screen Print', 'DTG', 'Embroidery', 'Sublimation', 'Heat Transfer', 'Vinyl']

const formatINR = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 })

// ─── Blank form state ────────────────────────────────────────────
const blankForm = (): AdminProductPayload & { newImages: File[]; existingImages: { imageUrl: string; sortOrder?: number }[] } => ({
  productCode: '',
  name: '',
  description: '',
  category: CATEGORIES[0],
  fabricType: FABRIC_TYPES[0],
  gsm: GSM_OPTIONS[2],
  neckType: NECK_TYPES[0],
  sleeveType: SLEEVE_TYPES[0],
  brand: '',
  basePrice: 0,
  discountPrice: null,
  stockQuantity: 0,
  minimumOrderQuantity: 10,
  availableSizes: [],
  availableColors: [],
  printTypes: [],
  active: true,
  newImages: [],
  existingImages: [],
})

// ─── Image Gallery (mini) ────────────────────────────────────────
function MiniGallery({ images, name }: { images: TShirtProduct['images']; name: string }) {
  const [idx, setIdx] = useState(0)
  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
        <Shirt size={28} className="text-gray-300 dark:text-gray-600" />
      </div>
    )
  }
  const src = images[idx]?.imageUrl
  return (
    <div className="relative w-full aspect-square bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden group">
      <img src={src} alt={name} className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105" />
      {images.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length) }}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/40 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          ><ChevronLeft size={12} /></button>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % images.length) }}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/40 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          ><ChevronRight size={12} /></button>
          <div className="absolute bottom-1.5 right-1.5 bg-black/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            {idx + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Image Uploader ──────────────────────────────────────────────
function ImageUploader({
  existingImages, newImages, onChange,
}: {
  existingImages: { imageUrl: string; sortOrder?: number }[]
  newImages: File[]
  onChange: (existing: { imageUrl: string }[], newFiles: File[]) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const totalCount = existingImages.length + newImages.length
  const MAX = 8

  const onFiles = (files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    const combined = [...newImages, ...arr].slice(0, MAX - existingImages.length)
    onChange(existingImages, combined)
  }

  const removeExisting = (i: number) => {
    onChange(existingImages.filter((_, idx) => idx !== i), newImages)
  }
  const removeNew = (i: number) => {
    onChange(existingImages, newImages.filter((_, idx) => idx !== i))
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    onFiles(e.dataTransfer.files)
  }, [newImages, existingImages])

  return (
    <div>
      <p className="label mb-2 flex items-center gap-1">
        <Upload size={13} /> Product Images
        <span className="text-gray-400 font-normal">(up to 8)</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {existingImages.map((img, i) => (
          <div key={`ex-${i}`} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
            <img src={img.imageUrl} alt="" className="w-full h-full object-contain p-1 bg-gray-50 dark:bg-gray-800" />
            <button type="button" onClick={() => removeExisting(i)}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <X size={14} className="text-white" />
            </button>
            <span className="absolute bottom-0.5 left-0.5 text-[9px] bg-blue-500 text-white rounded px-1">saved</span>
          </div>
        ))}
        {newImages.map((f, i) => (
          <div key={`new-${i}`} className="relative w-16 h-16 rounded-xl overflow-hidden border border-primary-300 dark:border-primary-700 group">
            <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-contain p-1 bg-gray-50 dark:bg-gray-800" />
            <button type="button" onClick={() => removeNew(i)}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <X size={14} className="text-white" />
            </button>
            <span className="absolute bottom-0.5 left-0.5 text-[9px] bg-green-500 text-white rounded px-1">new</span>
          </div>
        ))}
        {totalCount < MAX && (
          <div
            onDrop={onDrop} onDragOver={e => e.preventDefault()}
            onClick={() => ref.current?.click()}
            className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all text-gray-400 hover:text-primary-500 gap-1"
          >
            <ImagePlus size={18} />
            <span className="text-[10px] font-medium">Add</span>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={e => onFiles(e.target.files)} />
      <p className="text-[11px] text-gray-400 mt-1.5">
        When editing: adding new images replaces all existing ones on the server.
      </p>
    </div>
  )
}

// ─── Color Picker Row ────────────────────────────────────────────
function ColorPicker({ colors, onChange }: { colors: string[]; onChange: (c: string[]) => void }) {
  const [draft, setDraft] = useState('#000000')
  const add = () => {
    const hex = draft.trim().toLowerCase()
    if (!hex.match(/^#[0-9a-f]{6}$/i)) { toast.error('Enter a valid hex color (e.g. #FF5733)'); return }
    if (!colors.includes(hex)) onChange([...colors, hex])
    setDraft('#000000')
  }
  return (
    <div>
      <p className="label mb-2">Available Colors</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {colors.map(c => (
          <div key={c} className="relative group flex items-center">
            <div className="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm" style={{ background: c }} title={c} />
            <button type="button" onClick={() => onChange(colors.filter(x => x !== c))}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px]">
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="color" value={draft} onChange={e => setDraft(e.target.value)}
          className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer p-0.5 bg-white dark:bg-gray-900" />
        <input type="text" value={draft} onChange={e => setDraft(e.target.value)} placeholder="#000000"
          className="input-field w-28 text-xs font-mono" />
        <button type="button" onClick={add} className="btn-secondary py-1.5 px-3 text-xs">Add Color</button>
      </div>
    </div>
  )
}

// ─── Tag Input ───────────────────────────────────────────────────
function TagInput({ label, tags, suggestions, onChange }: {
  label: string; tags: string[]; suggestions?: string[]; onChange: (t: string[]) => void
}) {
  const [input, setInput] = useState('')
  const add = (val: string) => {
    const v = val.trim()
    if (v && !tags.includes(v)) onChange([...tags, v])
    setInput('')
  }
  return (
    <div>
      <p className="label mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-xs font-semibold">
            {t}
            <button type="button" onClick={() => onChange(tags.filter(x => x !== t))} className="hover:text-red-500 transition-colors">×</button>
          </span>
        ))}
      </div>
      {suggestions && (
        <div className="flex flex-wrap gap-1 mb-2">
          {suggestions.filter(s => !tags.includes(s)).map(s => (
            <button key={s} type="button" onClick={() => add(s)}
              className="px-2 py-0.5 rounded-lg text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary-100 hover:text-primary-600 transition-all">
              + {s}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(input) } }}
          placeholder={`Type & press Enter to add`}
          className="input-field text-sm flex-1" />
        <button type="button" onClick={() => add(input)} className="btn-secondary px-3 text-xs">Add</button>
      </div>
    </div>
  )
}

// ─── Delete Confirm Dialog ───────────────────────────────────────
function DeleteDialog({ product, onCancel, onConfirm }: {
  product: TShirtProduct; onCancel: () => void; onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 16 }}
        className="relative z-10 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xl p-6 w-full max-w-sm"
      >
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h3 className="text-lg font-black text-gray-900 dark:text-white text-center mb-1">Delete Product?</h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          "<strong>{product.name}</strong>" will be permanently removed. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm}
            className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors">
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Product Form Modal ──────────────────────────────────────────
type FormState = AdminProductPayload & {
  newImages: File[]
  existingImages: { imageUrl: string; sortOrder?: number }[]
}

function ProductFormModal({
  initial, onClose, onSave,
}: {
  initial?: TShirtProduct
  onClose: () => void
  onSave: (payload: AdminProductPayload, images: File[]) => Promise<void>
}) {
  const isEdit = !!initial
  const [form, setForm] = useState<FormState>(() => {
    if (initial) {
      return {
        productCode: initial.productCode,
        name: initial.name,
        description: initial.description ?? '',
        category: initial.category,
        fabricType: initial.fabric,
        gsm: initial.gsm,
        neckType: initial.neckType,
        sleeveType: initial.sleeveType,
        brand: initial.brand,
        basePrice: initial.basePrice,
        discountPrice: initial.discountPrice ?? null,
        stockQuantity: initial.stockQuantity,
        minimumOrderQuantity: initial.minimumOrderQuantity,
        availableSizes: [...(initial.availableSizes ?? [])],
        availableColors: [...(initial.availableColors ?? [])],
        printTypes: [...(initial.printTypes ?? [])],
        active: initial.active,
        newImages: [],
        existingImages: (initial.images ?? [])
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map(img => ({ imageUrl: img.imageUrl, sortOrder: img.sortOrder })),
      }
    }
    return blankForm()
  })

  const [saving, setSaving] = useState(false)
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }))

  const toggleSize = (s: string) => {
    set('availableSizes', form.availableSizes.includes(s)
      ? form.availableSizes.filter(x => x !== s)
      : [...form.availableSizes, s])
  }

  const validate = (): string | null => {
    if (!form.productCode.trim()) return 'Product code is required'
    if (!form.name.trim()) return 'Product name is required'
    if (!form.brand.trim()) return 'Brand is required'
    if (form.basePrice <= 0) return 'Base price must be > 0'
    if (form.availableSizes.length === 0) return 'Select at least one size'
    if (form.availableColors.length === 0) return 'Add at least one color'
    if (form.printTypes.length === 0) return 'Add at least one print type'
    if (form.discountPrice !== null && form.discountPrice !== undefined && form.discountPrice > form.basePrice)
      return 'Discount price cannot exceed base price'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { toast.error(err); return }
    setSaving(true)
    const { newImages, existingImages: _ex, ...payload } = form
    try {
      await onSave(payload, newImages)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">
              {isEdit ? '✏️ Edit Product' : '➕ Add New Product'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? `Editing: ${initial!.name}` : 'Fill in the details below to add a new T-shirt to the catalog'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-800">

            {/* Left column */}
            <div className="p-5 sm:p-6 space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Basic Info</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Product Code *</label>
                  <input value={form.productCode} onChange={e => set('productCode', e.target.value)}
                    placeholder="e.g. PK-RN-001" className="input-field text-sm" />
                </div>
                <div>
                  <label className="label">Brand *</label>
                  <input value={form.brand} onChange={e => set('brand', e.target.value)}
                    placeholder="e.g. PK Corporate" className="input-field text-sm" />
                </div>
              </div>

              <div>
                <label className="label">Product Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Classic Round Neck Tee" className="input-field text-sm" />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea value={form.description ?? ''} onChange={e => set('description', e.target.value)}
                  rows={3} placeholder="Product description..."
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none placeholder-gray-400 text-gray-900 dark:text-gray-100" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category *</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)} className="input-field text-sm">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Fabric Type *</label>
                  <select value={form.fabricType} onChange={e => set('fabricType', e.target.value)} className="input-field text-sm">
                    {FABRIC_TYPES.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">GSM *</label>
                  <select value={form.gsm} onChange={e => set('gsm', e.target.value)} className="input-field text-sm">
                    {GSM_OPTIONS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Neck Type *</label>
                  <select value={form.neckType} onChange={e => set('neckType', e.target.value)} className="input-field text-sm">
                    {NECK_TYPES.map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Sleeve *</label>
                  <select value={form.sleeveType} onChange={e => set('sleeveType', e.target.value)} className="input-field text-sm">
                    {SLEEVE_TYPES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Pricing */}
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 pt-1">Pricing & Stock</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Base Price (₹) *</label>
                  <input type="number" min={1} step={0.01} value={form.basePrice || ''}
                    onChange={e => set('basePrice', parseFloat(e.target.value) || 0)}
                    placeholder="0.00" className="input-field text-sm" />
                </div>
                <div>
                  <label className="label">Discount Price (₹)</label>
                  <input type="number" min={0} step={0.01}
                    value={form.discountPrice !== null && form.discountPrice !== undefined ? form.discountPrice : ''}
                    onChange={e => set('discountPrice', e.target.value === '' ? null : parseFloat(e.target.value) || 0)}
                    placeholder="Optional" className="input-field text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Stock Qty</label>
                  <input type="number" min={0} value={form.stockQuantity}
                    onChange={e => set('stockQuantity', parseInt(e.target.value) || 0)}
                    className="input-field text-sm" />
                </div>
                <div>
                  <label className="label">Min. Order Qty</label>
                  <input type="number" min={1} value={form.minimumOrderQuantity}
                    onChange={e => set('minimumOrderQuantity', parseInt(e.target.value) || 10)}
                    className="input-field text-sm" />
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <button type="button" onClick={() => set('active', !form.active)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{form.active ? 'Active' : 'Inactive'}</p>
                  <p className="text-xs text-gray-400">{form.active ? 'Visible to agents & customers' : 'Hidden from catalog'}</p>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="p-5 sm:p-6 space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Variants & Images</h3>

              {/* Sizes */}
              <div>
                <p className="label mb-2">Available Sizes *</p>
                <div className="flex flex-wrap gap-2">
                  {SIZES_ORDER.map(s => {
                    const selected = form.availableSizes.includes(s)
                    return (
                      <button key={s} type="button" onClick={() => toggleSize(s)}
                        className={`w-12 h-10 rounded-xl border-2 text-sm font-bold transition-all ${selected
                          ? 'bg-primary-500 border-primary-500 text-white shadow-md scale-105'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-primary-300 hover:text-primary-500'
                        }`}>
                        {s}
                      </button>
                    )
                  })}
                </div>
                {form.availableSizes.length > 0 && (
                  <p className="text-xs text-primary-500 mt-1.5 font-medium">
                    Selected: {form.availableSizes.join(', ')}
                  </p>
                )}
              </div>

              <ColorPicker
                colors={form.availableColors}
                onChange={c => set('availableColors', c)}
              />

              <TagInput
                label="Print / Decoration Types *"
                tags={form.printTypes}
                suggestions={PRINT_TYPE_SUGGESTIONS}
                onChange={t => set('printTypes', t)}
              />

              <ImageUploader
                existingImages={form.existingImages}
                newImages={form.newImages}
                onChange={(existing, newFiles) => setForm(f => ({ ...f, existingImages: existing, newImages: newFiles }))}
              />

              {/* Price summary */}
              {form.basePrice > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border border-primary-100 dark:border-primary-800/40 rounded-2xl p-4 space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">Price Preview</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Base Price</span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatINR(form.basePrice)}</span>
                  </div>
                  {form.discountPrice !== null && form.discountPrice !== undefined && form.discountPrice > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Discount Price</span>
                      <span className="font-bold text-green-600">{formatINR(form.discountPrice)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm border-t border-primary-200 dark:border-primary-800/40 pt-1.5">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Effective Price</span>
                    <span className="font-black text-primary-600 dark:text-primary-400 text-base">
                      {formatINR(form.discountPrice && form.discountPrice > 0 ? form.discountPrice : form.basePrice)}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-center gap-3 shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary px-5">Cancel</button>
          <button
            onClick={handleSubmit as any}
            disabled={saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> {isEdit ? 'Saving…' : 'Creating…'}</>
            ) : (
              <><CheckCircle2 size={16} /> {isEdit ? 'Save Changes' : 'Create Product'}</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Product Card ────────────────────────────────────────────────
function ProductCard({
  product,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  product: TShirtProduct
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white dark:bg-gray-900 rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg ${
        product.active
          ? 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
          : 'border-dashed border-gray-200 dark:border-gray-700 opacity-70 hover:opacity-90'
      }`}
    >
      {/* Image */}
      <div className="p-3 pb-0">
        <div className="relative">
          <MiniGallery images={product.images} name={product.name} />
          {/* Status badge overlay */}
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
              product.active
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {product.active ? '● Active' : '○ Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-[10px] text-gray-400 font-mono">{product.productCode}</p>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-0.5 leading-tight">{product.name}</h3>
        <div className="flex flex-wrap gap-1 mt-1.5">
          <span className="badge badge-neutral text-[10px]">{product.category}</span>
          <span className="badge badge-neutral text-[10px]">{product.fabric}</span>
        </div>

        {/* Colors */}
        <div className="flex items-center gap-1 mt-2">
          {(product.availableColors ?? []).slice(0, 6).map((c, i) => (
            <div key={i} className="w-3.5 h-3.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm" style={{ background: c }} />
          ))}
          {(product.availableColors ?? []).length > 6 && (
            <span className="text-[10px] text-gray-400">+{product.availableColors.length - 6}</span>
          )}
        </div>

        {/* Price */}
        <div className="mt-2 flex items-baseline gap-1.5">
          <p className="text-base font-black text-gray-900 dark:text-white">
            {formatINR(product.effectivePrice)}
          </p>
          {product.discountPrice && product.discountPrice < product.basePrice && (
            <p className="text-xs text-gray-400 line-through">{formatINR(product.basePrice)}</p>
          )}
        </div>
        <p className="text-[10px] text-gray-400">per piece · MOQ {product.minimumOrderQuantity}</p>

        {/* Actions */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex gap-1.5">
          <button
            onClick={onToggleActive}
            title={product.active ? 'Disable product' : 'Enable product'}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              product.active
                ? 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800/50 dark:text-amber-400 dark:hover:bg-amber-900/20'
                : 'border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800/50 dark:text-green-400 dark:hover:bg-green-900/20'
            }`}
          >
            {product.active ? <><EyeOff size={11} /> Hide</> : <><Eye size={11} /> Show</>}
          </button>
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800/50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-all"
          >
            <Pencil size={11} /> Edit
          </button>
          <button
            onClick={onDelete}
            className="w-8 flex items-center justify-center py-1.5 rounded-xl text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-800/50 dark:hover:bg-red-900/20 transition-all"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────
export default function ProductsPage() {
  const [products, setProducts] = useState<TShirtProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<TShirtProduct | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TShirtProduct | null>(null)

  const loadProducts = async () => {
    setLoading(true)
    try {
      const data = await productService.getAdminProducts()
      setProducts(data)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProducts() }, [])

  // Derived state
  const categories = ['ALL', ...new Set(products.map(p => p.category).filter(Boolean))]

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(q) ||
      p.productCode?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q)
    const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && p.active) ||
      (statusFilter === 'INACTIVE' && !p.active)
    return matchSearch && matchCategory && matchStatus
  })

  const activeFilters = [
    categoryFilter !== 'ALL',
    statusFilter !== 'ALL',
  ].filter(Boolean).length

  // Handlers
  const handleCreate = async (payload: AdminProductPayload, images: File[]) => {
    const toastId = toast.loading('Creating product…')
    try {
      await productService.createProduct(payload, images)
      toast.success('Product created!', { id: toastId })
      setShowForm(false)
      await loadProducts()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create product', { id: toastId })
      throw err
    }
  }

  const handleUpdate = async (payload: AdminProductPayload, images: File[]) => {
    if (!editProduct) return
    const toastId = toast.loading('Saving changes…')
    try {
      await productService.updateProduct(editProduct.id, payload, images)
      toast.success('Product updated!', { id: toastId })
      setEditProduct(null)
      await loadProducts()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update product', { id: toastId })
      throw err
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const toastId = toast.loading('Deleting product…')
    try {
      await productService.deleteProduct(deleteTarget.id)
      toast.success('Product deleted', { id: toastId })
      setDeleteTarget(null)
      await loadProducts()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete product', { id: toastId })
    }
  }

  const handleToggleActive = async (product: TShirtProduct) => {
    const toastId = toast.loading(product.active ? 'Disabling…' : 'Enabling…')
    try {
      if (product.active) {
        await productService.disableProduct(product.id)
      } else {
        await productService.enableProduct(product.id)
      }
      toast.success(product.active ? 'Product hidden from catalog' : 'Product enabled!', { id: toastId })
      await loadProducts()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Action failed', { id: toastId })
    }
  }

  const activeCount = products.filter(p => p.active).length
  const inactiveCount = products.length - activeCount

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Shirt size={24} className="text-primary-500" />
            T-Shirt Catalog
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage all products — changes sync to agent dashboard &amp; end users instantly
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Products', value: products.length, icon: ShoppingBag, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20' },
          { label: 'Active', value: activeCount, icon: Eye, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Inactive', value: inactiveCount, icon: EyeOff, color: 'text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 flex items-center gap-3`}>
            <div className={`w-9 h-9 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center shadow-sm shrink-0`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div>
              <p className="text-xl font-black text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, code, category, brand…"
            className="input-field pl-10" />
        </div>
        <button onClick={() => setFiltersOpen(f => !f)}
          className={`btn-secondary flex items-center gap-2 whitespace-nowrap ${filtersOpen ? 'border-primary-300 text-primary-600' : ''}`}>
          <Filter size={16} /> Filters
          {activeFilters > 0 && <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">{activeFilters}</span>}
        </button>
      </div>

      <AnimatePresence>
        {filtersOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label">Category</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {categories.map(c => (
                    <button key={c} onClick={() => setCategoryFilter(c)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        categoryFilter === c
                          ? 'bg-primary-500 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                      }`}>
                      {c === 'ALL' ? 'All Categories' : c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Status</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[
                    { v: 'ALL', label: 'All' },
                    { v: 'ACTIVE', label: '● Active' },
                    { v: 'INACTIVE', label: '○ Inactive' },
                  ].map(opt => (
                    <button key={opt.v} onClick={() => setStatusFilter(opt.v as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        statusFilter === opt.v
                          ? 'bg-primary-500 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{filtered.length} product{filtered.length !== 1 ? 's' : ''} found</p>
        {(activeFilters > 0 || search) && (
          <button onClick={() => { setSearch(''); setCategoryFilter('ALL'); setStatusFilter('ALL') }}
            className="text-xs text-primary-500 font-medium hover:text-primary-600 flex items-center gap-1">
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-100 dark:bg-gray-800 m-3 rounded-xl" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-semibold">
            {products.length === 0 ? 'No products in catalog yet' : 'No products match your filters'}
          </p>
          {products.length === 0 ? (
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus size={14} /> Add First Product
            </button>
          ) : (
            <button onClick={() => { setSearch(''); setCategoryFilter('ALL'); setStatusFilter('ALL') }}
              className="text-primary-500 text-sm mt-2 hover:text-primary-600">
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => setEditProduct(product)}
                onDelete={() => setDeleteTarget(product)}
                onToggleActive={() => handleToggleActive(product)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showForm && (
          <ProductFormModal
            onClose={() => setShowForm(false)}
            onSave={handleCreate}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editProduct && (
          <ProductFormModal
            initial={editProduct}
            onClose={() => setEditProduct(null)}
            onSave={handleUpdate}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteDialog
            product={deleteTarget}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
