import React from 'react'

export default function Footer() {
  return (
     <footer className="bg-red-500 text-white py-6 text-center">
        <p className="text-sm">&copy; {new Date().getFullYear()} Your Company. All rights reserved.</p>
      </footer>
  )
}
