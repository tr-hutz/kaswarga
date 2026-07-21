import {
    useEffect,
    useLayoutEffect,
    useRef
} from 'react'

type KeyHandler = (e: KeyboardEvent) => void
type HandlersMap = Record<string, KeyHandler | undefined>

const stack: KeyHandler[] = []

if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (stack.length > 0) {
            stack[stack.length - 1](e)
        }
    })
}

export function useKeyDown(active: boolean, handlers: HandlersMap): void {

    const handlersRef = useRef(handlers)
    useLayoutEffect(() => { handlersRef.current = handlers })

    useEffect(() => {

        if (!active) return

        const handler = (e: KeyboardEvent) =>
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
