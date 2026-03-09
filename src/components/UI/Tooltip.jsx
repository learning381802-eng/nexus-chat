import { useState, useRef } from 'react'

export default function Tooltip({ content, children, placement = 'top' }) {
  const [show, setShow] = useState(false)

  const placementStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && content && (
        <div className={`absolute z-50 tooltip whitespace-nowrap pointer-events-none ${placementStyles[placement]}`}>
          {content}
        </div>
      )}
    </div>
  )
}
