'use client'
import { ReactNode } from 'react'

interface ModalProps {
  title: string
  message?: string
  onClose: () => void
  children?: ReactNode
}

export default function Modal({ title, message, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        {message && <p className="text-gray-300 mb-4">{message}</p>}
        {children}
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}