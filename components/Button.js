export default function Button({ children, onClick, className = '', disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 rounded text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 ${className}`}
    >
      {children}
    </button>
  )
}