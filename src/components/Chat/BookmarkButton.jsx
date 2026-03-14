import { useAppStore } from '../../store'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BookmarkButton({ message }) {
  const { bookmarks = [], addBookmark, removeBookmark } = useAppStore()
  const isBookmarked = bookmarks.some(b => b.id === message.id)

  const toggle = (e) => {
    e.stopPropagation()
    if (isBookmarked) {
      removeBookmark(message.id)
      toast.success('Bookmark removed')
    } else {
      addBookmark(message)
      toast.success('Message bookmarked!')
    }
  }

  return (
    <button
      onClick={toggle}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white hover:bg-opacity-10"
      style={{ color: isBookmarked ? '#fbbf24' : 'var(--interactive-normal)' }}
      title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Message'}
    >
      {isBookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
    </button>
  )
}
