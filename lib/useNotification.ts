import { useState } from 'react'

export default function useNotification() {
  const [message, setMessage] = useState<string | null>(null)

  const show = (msg: string): void => {
    setMessage(msg)

    setTimeout(() => {
      setMessage(null)
    }, 3000)
  }

  return { message, show }
}