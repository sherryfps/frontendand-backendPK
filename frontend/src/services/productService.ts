import apiClient from './apiClient'

export interface ProductImage {
  id: string
  imageUrl: string
  cloudinaryPublicId?: string
  isPrimary: boolean
  sortOrder?: number
  colorHex?: string
}

export interface TShirtProduct {
  id: string
  productCode: string
  name: string
  description?: string
  brand: string
  category: string
  fabric: string
  gsm: string
  neckType: string
  sleeveType: string
  minimumOrderQuantity: number
  basePrice: number
  discountPrice?: number | null
  effectivePrice: number
  active: boolean
  stockQuantity: number
  availableSizes: string[]
  availableColors: string[]
  printTypes: string[]
  images: ProductImage[]
}

export interface AdminProductPayload {
  productCode: string
  name: string
  description?: string
  category: string
  fabricType: string
  gsm: string
  neckType: string
  sleeveType: string
  brand: string
  basePrice: number
  discountPrice?: number | null
  stockQuantity: number
  minimumOrderQuantity?: number
  availableSizes: string[]
  availableColors: string[]
  printTypes: string[]
  active?: boolean
}

export const productService = {
  /** Agent/public: active products only */
  getProducts: async (): Promise<TShirtProduct[]> => {
    const res = await apiClient.get('/v1/products')
    return res.data?.data ?? res.data ?? []
  },

  /** Admin: all products (active + inactive) */
  getAdminProducts: async (): Promise<TShirtProduct[]> => {
    const res = await apiClient.get('/v1/admin/products')
    return res.data?.data ?? res.data ?? []
  },

  /** Admin: create product with optional images */
  createProduct: async (payload: AdminProductPayload, images?: File[]): Promise<TShirtProduct> => {
    const form = new FormData()
    form.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
    if (images && images.length > 0) {
      images.forEach(img => form.append('images', img))
    }
    const res = await apiClient.post('/v1/admin/products', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data?.data ?? res.data
  },

  /** Admin: update product with optional replacement images */
  updateProduct: async (id: string, payload: AdminProductPayload, images?: File[]): Promise<TShirtProduct> => {
    const form = new FormData()
    form.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
    if (images && images.length > 0) {
      images.forEach(img => form.append('images', img))
    }
    const res = await apiClient.put(`/v1/admin/products/${id}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data?.data ?? res.data
  },

  /** Admin: delete product */
  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/admin/products/${id}`)
  },

  /** Admin: enable product */
  enableProduct: async (id: string): Promise<TShirtProduct> => {
    const res = await apiClient.patch(`/v1/admin/products/${id}/enable`)
    return res.data?.data ?? res.data
  },

  /** Admin: disable product */
  disableProduct: async (id: string): Promise<TShirtProduct> => {
    const res = await apiClient.patch(`/v1/admin/products/${id}/disable`)
    return res.data?.data ?? res.data
  },
}
