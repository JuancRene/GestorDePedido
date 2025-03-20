"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AuthDebug() {
  const [cookies, setCookies] = useState<string>("")
  const [localStorageItems, setLocalStorageItems] = useState<Record<string, string>>({})
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Get cookies
    setCookies(document.cookie)

    // Get localStorage items
    const items: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        items[key] = localStorage.getItem(key) || ""
      }
    }
    setLocalStorageItems(items)
  }, [isVisible])

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white"
        size="sm"
      >
        Debug Auth
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Auth Debug</CardTitle>
          <Button onClick={() => setIsVisible(false)} variant="ghost" size="sm">
            Close
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Cookies:</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-20">
                {cookies || "No cookies found"}
              </pre>
            </div>

            <div>
              <h3 className="font-medium">LocalStorage:</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-20">
                {Object.keys(localStorageItems).length > 0
                  ? JSON.stringify(localStorageItems, null, 2)
                  : "No localStorage items found"}
              </pre>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  document.cookie.split(";").forEach((c) => {
                    document.cookie = c
                      .replace(/^ +/, "")
                      .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`)
                  })
                  setCookies("")
                }}
                variant="destructive"
                size="sm"
              >
                Clear Cookies
              </Button>

              <Button
                onClick={() => {
                  localStorage.clear()
                  setLocalStorageItems({})
                }}
                variant="destructive"
                size="sm"
              >
                Clear LocalStorage
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

