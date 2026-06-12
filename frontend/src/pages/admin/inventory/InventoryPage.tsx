import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, Search, Palette, Ruler } from 'lucide-react'
import { productService, TShirtProduct } from '@/services/productService'
import toast from 'react-hot-toast'

export default function InventoryPage() {
  const [products, setProducts] = useState<TShirtProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await productService.getProducts()
        setProducts(data)
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to load inventory')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = products.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.productCode?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <h1 className="page-title">Inventory</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Products', value: products.length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Active Items', value: products.filter(p => p.active).length, icon: Palette, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Categories', value: new Set(products.map(p => p.category)).size, icon: Ruler, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        ].map((card) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center`}>
              <card.icon size={22} className={card.color} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{card.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 h-44 animate-pulse">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
              <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center text-gray-400">
          <Package size={32} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <motion.div key={product.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">{product.name}</h3>
                  <p className="text-xs text-gray-400 font-mono">{product.productCode}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${product.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>
                  {product.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-2 text-xs text-gray-500">
                <p><span className="font-medium text-gray-700 dark:text-gray-300">Category:</span> {product.category}</p>
                <p><span className="font-medium text-gray-700 dark:text-gray-300">Fabric:</span> {product.fabric} ({product.gsm} GSM)</p>
                <p><span className="font-medium text-gray-700 dark:text-gray-300">Base Price:</span> ₹{product.basePrice?.toFixed(2)}</p>
                {product.availableColors && product.availableColors.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Colors:</span>
                    {product.availableColors.slice(0, 6).map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: c }} title={c} />
                    ))}
                    {product.availableColors.length > 6 && <span className="text-gray-400 ml-1">+{product.availableColors.length - 6}</span>}
                  </div>
                )}
                {product.availableSizes && (
                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Sizes:</span> {product.availableSizes.join(', ')}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
