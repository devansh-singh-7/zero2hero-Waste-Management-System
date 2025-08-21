
"use client"

import { useState, useEffect } from "react"


export default function TotalEarnings() {
  const [totalEarnings, setTotalEarnings] = useState(0)

  useEffect(() => {
    const fetchTotalEarnings = async () => {
      try {
        const response = await fetch('/api/user/balance')
        if (response.ok) {
          const data = await response.json()
          setTotalEarnings(data.balance)
        }
      } catch (error) {
        console.error('Error fetching total earnings:', error)
      }
    }

    fetchTotalEarnings()
  }, [])

  return (
    <div className="text-white">
      {totalEarnings}
    </div>
  )
}
