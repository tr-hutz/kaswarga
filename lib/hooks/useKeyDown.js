import {
    useEffect,
    useRef
} from 'react'

const stack = []

if (typeof window !== 'undefined') {

    window.addEventListener('keydown', (e) => {

        if (stack.length > 0) {
            stack[stack.length - 1](e)
        }
    })
}

export function useKeyDown(active, handlers) {

    const handlersRef = useRef(handlers)
    handlersRef.current = handlers

    useEffect(() => {

        if (!active) return

        const handler = (e) =>
            handlersRef.current[e.key]?.(e)

        stack.push(handler)

        return () => {

            const idx = stack.indexOf(handler)

            if (idx !== -1) {
                stack.splice(idx, 1)
            }
        }

    }, [active])
}
