import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store'
import { api } from '../../utils/api'
import { BarChart2, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PollMessage({ pollId, channelId }) {
  const { user } = useAuthStore()
  const [poll, setPoll] = useState(null)

  useEffect(() => {
    api.getPolls(channelId).then(polls => {
      const found = polls.find(p => p.id === pollId)
      if (found) setPoll(found)
    }).catch(console.error)
  }, [pollId, channelId])

  const handleVote = async (optionId) => {
    try {
      const updated = await api.votePoll(poll.id, { optionId })
      setPoll(updated)
    } catch (err) { toast.error(err.message) }
  }

  if (!poll) return null

  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0)
  const isExpired = poll.endsAt && new Date(poll.endsAt) < new Date()

  return (
    <div className="mt-2 rounded-xl overflow-hidden max-w-sm" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <BarChart2 size={16} style={{ color: 'var(--brand-color)' }} />
        <span className="font-semibold text-sm" style={{ color: 'var(--header-primary)' }}>{poll.question}</span>
      </div>
      <div className="p-3 space-y-2">
        {poll.options.map(option => {
          const percent = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0
          const voted = option.votes.includes(user?.id)
          return (
            <button key={option.id} onClick={() => !isExpired && handleVote(option.id)} disabled={isExpired}
              className="w-full relative rounded-lg overflow-hidden text-left"
              style={{ background: voted ? 'rgba(99,102,241,0.15)' : 'var(--bg-accent)', border: `1px solid ${voted ? 'var(--brand-color)' : 'transparent'}` }}>
              <div className="absolute inset-0 rounded-lg" style={{ width: `${percent}%`, background: voted ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)', transition: 'width 0.5s ease' }} />
              <div className="relative flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                  {voted && <Check size={12} style={{ color: 'var(--brand-color)' }} />}
                  <span className="text-sm font-medium" style={{ color: voted ? 'var(--header-primary)' : 'var(--text-normal)' }}>{option.text}</span>
                </div>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{percent}%</span>
              </div>
            </button>
          )
        })}
        <p className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
          {isExpired && ' · Poll ended'}
        </p>
      </div>
    </div>
  )
}
