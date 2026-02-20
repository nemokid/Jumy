'use client';

export default function Help() {
  const sections = [
    {
      icon: '🔒',
      title: 'What is Jumy?',
      content: "Jumy is a private messaging service for people who value their privacy. We don't collect your email, phone number, or any personal information. We literally know nothing about you."
    },
    {
      icon: '👤',
      title: 'Account & Identity',
      content: "Your account is identified only by a username and a 5-digit PIN. Both are stored as encrypted hashes, so we cannot read them. If you forget your credentials, we cannot help you recover them."
    },
    {
      icon: '📨',
      title: 'Sending Messages',
      content: "To send a message, you need to know the exact username of the recipient. There is no contact list or search feature. Messages and files are encrypted in your browser before being sent."
    },
    {
      icon: '📥',
      title: 'Receiving Messages',
      content: "Messages you receive appear in your inbox. They are automatically deleted from our servers after 24 hours, whether or not you've read them."
    },
    {
      icon: '📎',
      title: 'File Attachments',
      content: "You can attach one file (up to 10MB) per message. Files are encrypted in your browser before upload. When downloading, files are decrypted in your browser."
    },
    {
      icon: '🛡️',
      title: 'The PIN Protection',
      content: "Every time you access Jumy, you'll be asked for your PIN. If someone enters the wrong PIN, the app will appear to work normally, but they won't see your real messages. This protects you even if someone forces you to open the app."
    },
    {
      icon: '⚠️',
      title: 'Wipe Account',
      content: "If you need to delete everything, use the 'Wipe Account' option. This will permanently delete your account, all messages, and all attachments. This action cannot be undone."
    },
    {
      icon: '💡',
      title: 'Tips for Privacy',
      content: "• Choose a username that cannot be linked to your identity\n• Never share your PIN with anyone\n• Remember that messages expire after 24 hours\n• Use Jumy for conversations that need to remain private"
    },
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Help & Information</h1>
      
      <div className="space-y-6">
        {sections.map((section, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2">
              <span>{section.icon}</span>
              {section.title}
            </h2>
            <p className="text-gray-600 whitespace-pre-line">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
