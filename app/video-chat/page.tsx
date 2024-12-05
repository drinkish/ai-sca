import VideoChatClient from './VideoChatClient';

export default function VideoChat() {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Video Consultation with AI Patient</h1>
        <VideoChatClient />
      </div>
    );
  }