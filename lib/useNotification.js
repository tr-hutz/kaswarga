import { useState } from 'react'

export default function useNotification() {
  const [message, setMessage] = useState(null)

  const show = (msg) => {
    setMessage(msg)

    setTimeout(() => {
      setMessage(null)
    }, 3000)
  }

  return { message, show }
}