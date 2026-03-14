import { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'

const COMMANDS = [
  { name: 'poll', description: 'Create a poll', usage: '/poll [question] | [option1] | [option2]', example: '/poll Favorite color? | Red | Blue | Green' },
  { name: 'ban', description: 'Ban a user from the server', usage: '/ban @username [reason]', example: '/ban @user123 Spamming' },
  { name: 'kick', description: 'Kick a user from the server', usage: '/kick @username [reason]', example: '/kick @user123 Rule violation' },
  { name: 'mute', description: 'Mute a user', usage: '/mute @username [duration]', example: '/mute @user123 10m' },
  { name: 'remind', description: 'Set a reminder', usage: '/remind [time] [message]', example: '/remind 10m Check the oven' },
  { name: 'announce', description: 'Post an announcement', usage: '/announce [message]', example: '/announce Server maintenance tonight!' },
  { name: 'rules', description: 'Show server rules', usage: '/rules', example: '/rules' },
  { name: 'poll', description: 'Create a vote poll', usage: '/poll [question] | [opt1] | [opt2]', example: '/poll Best language? | Python | JavaScript' },
  { name: 'clear', description: 'Clear recent messages (admin)', usage: '/clear [amount]', example: '/clear 10' },
  { name: 'help', description: 'Show all commands', usage: '/help', example: '/help' },
  { name: 'flip', description: 'Flip a coin', usage: '/flip', example: '/flip' },
  { name: 'roll', description: 'Roll a dice', usage: '/roll [sides]', example: '/roll 20' },
  { name: 'me', description: 'Action message', usage: '/me [action]', example: '/me waves hello' },
]

export default function SlashCommands({ query, onSelect }) {
  const matches = COMMANDS.filter(c => c.name.startsWith(query.toLowerCase())).slice(0, 8)

  if (!matches.length) return null

  return (
    <div className="absolute bottom-full mb-2 left-0 right-0 rounded-xl overflow-hidden shadow-2xl z-50"
      style={{ background: 'var(--bg-floating)', border: '1px solid var(--border-subtle)' }}>
      <div className="px-3 py-2 flex items-center gap-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <Zap size={14} style={{ color: 'var(--brand-color)' }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Commands</span>
      </div>
      {matches.map((cmd, i) => (
        <button key={i} onClick={() => onSelect(cmd)}
          className="w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors"
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-modifier-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: 'var(--brand-color)' }}>
            <span className="text-white font-bold" style={{ fontSize: 11 }}>/</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm" style={{ color: 'var(--header-primary)' }}>/{cmd.name}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{cmd.description}</span>
            </div>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{cmd.usage}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
