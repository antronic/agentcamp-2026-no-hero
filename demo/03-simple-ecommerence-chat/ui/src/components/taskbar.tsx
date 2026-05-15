/**
 * Taskbar — Fixed bottom bar with quick actions.
 * Contains the Agent Smith chat bubble trigger.
 */

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageCircle } from 'lucide-react'

interface TaskbarProps {
  chatOpen: boolean
  onToggleChat: () => void
  unread?: boolean
}

export function Taskbar({ chatOpen, onToggleChat, unread }: TaskbarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex h-12 items-center justify-end border-t border-border bg-background px-4">
      {/* Chat toggle button — always visible with solid styling */}
      <Button
        variant={chatOpen ? 'default' : 'secondary'}
        size="sm"
        onClick={onToggleChat}
        className="relative gap-2 rounded-full border border-border"
      >
        <Avatar className="h-5 w-5">
          <AvatarFallback className="bg-primary text-primary-foreground text-[8px] font-bold">AS</AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium">Chat with Agent Smith</span>
        <MessageCircle className="h-3.5 w-3.5" />

        {/* Unread indicator dot */}
        {unread && !chatOpen && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
        )}
      </Button>
    </div>
  )
}
