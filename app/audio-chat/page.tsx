import { Metadata } from 'next'

import RealtimeAudioConsultation from '@/components/custom/RealtimeAudioConsultation'

export const metadata: Metadata = {
  title: 'Audio Consultation | SCA Practice',
  description: 'Practice your consultation skills with AI-powered audio conversations'
}

export default function AudioChatPage() {
  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col items-center text-center space-y-2">
        <h1 className="text-3xl font-bold">Audio Consultation Practice</h1>
        <p className="text-muted-foreground">
          Practice your consultation skills using voice interactions. Press and hold to speak, 
          release to send your message.
        </p>
      </div>
      <RealtimeAudioConsultation />
    </div>
  )
}