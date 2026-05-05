export default function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-400 ${className}`}
    />
  )
}