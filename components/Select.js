export default function Select({ children, ...props }) {
  return (
    <select {...props} className="w-full border p-2 rounded">
      {children}
    </select>
  )
}