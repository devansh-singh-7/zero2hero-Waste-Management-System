
"use client"

import { useState, useEffect } from "react"

export default function TotalEarnings() {
  const [totalEarnings, setTotalEarnings] = useState(0)

  const fetchTotalEarnings = async () => {
    try {
      const response = await fetch('/api/user/balance', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
      })
      if (response.ok) {
        const data = await response.json()
        setTotalEarnings(data.balance || 0)
      } else {
        setTotalEarnings(0)
      }
    } catch (error) {
      console.error('Error fetching total earnings:', error)
      setTotalEarnings(0)
    }
  }

  useEffect(() => {
    fetchTotalEarnings()

   
    const interval = setInterval(fetchTotalEarnings, 5000)

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userEmail') {
        fetchTotalEarnings()
      }
    }

    const handleBalanceUpdate = () => {
      fetchTotalEarnings()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('balanceUpdate', handleBalanceUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('balanceUpdate', handleBalanceUpdate)
    }
  }, [])

  return (
    <div className="text-white">
      {totalEarnings}
    </div>
  )
}
