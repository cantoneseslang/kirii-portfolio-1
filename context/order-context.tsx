"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/utils/supabase'

// 注文データの型定義
interface Order {
  id: string
  user_id: string
  menu_item: string
  quantity: number
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
  updated_at: string
}

interface OrderContextType {
  orders: Order[]
  loading: boolean
  error: string | null
  loadOrders: () => Promise<void>
  updateOrderStatus: (orderId: string, status: string) => Promise<void>
  resetOrderStatus: () => Promise<void>
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 注文データを読み込む関数
  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // バイパスモードの場合は空の配列を返す
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('bypass') === 'true') {
        setOrders([])
        return
      }

      // Supabaseから注文データを取得
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        // テーブルが存在しない場合は空の配列を設定
        if (fetchError.code === 'PGRST116' || fetchError.message.includes('relation "orders" does not exist')) {
          console.log('Orders table does not exist, using empty array')
          setOrders([])
          return
        }
        throw fetchError
      }

      setOrders(data || [])
    } catch (err: any) {
      console.error('Supabase error loading orders:', err)
      setError(err.message || 'Failed to load orders')
      // エラーが発生してもアプリケーションを停止させない
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  // 注文ステータスを更新する関数
  const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
    try {
      // バイパスモードの場合は何もしない
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('bypass') === 'true') {
        return
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (updateError) {
        console.error('Error updating order status:', updateError)
        return
      }

      // ローカル状態を更新
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: status as any, updated_at: new Date().toISOString() } : order
        )
      )
    } catch (err: any) {
      console.error('Error updating order status:', err)
    }
  }, [])

  // 注文ステータスをリセットする関数
  const resetOrderStatus = useCallback(async () => {
    try {
      // バイパスモードの場合は何もしない
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('bypass') === 'true') {
        return
      }

      // すべての注文をpendingにリセット
      const { error: resetError } = await supabase
        .from('orders')
        .update({ 
          status: 'pending', 
          updated_at: new Date().toISOString() 
        })
        .neq('status', 'cancelled')

      if (resetError) {
        console.error('Error resetting order status:', resetError)
        return
      }

      // ローカル状態を更新
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.status !== 'cancelled' 
            ? { ...order, status: 'pending' as any, updated_at: new Date().toISOString() }
            : order
        )
      )
    } catch (err: any) {
      console.error('Error resetting order status:', err)
    }
  }, [])

  // 初期化時に注文データを読み込む
  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const value: OrderContextType = {
    orders,
    loading,
    error,
    loadOrders,
    updateOrderStatus,
    resetOrderStatus,
  }

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  )
}

export function useOrder() {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider')
  }
  return context
}
