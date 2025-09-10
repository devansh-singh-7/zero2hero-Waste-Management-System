
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
    // Fetch immediately on mount
    fetchTotalEarnings()

    // Refresh every 5 seconds to ensure latest balance (reduced from 10s for faster updates)
    const interval = setInterval(fetchTotalEarnings, 5000)

    // Listen for storage events to refresh when login happens
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userEmail') {
        fetchTotalEarnings()
      }
    }

    // Listen for custom events that indicate balance should be updated
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
