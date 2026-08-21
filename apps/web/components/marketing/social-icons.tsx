export function FacebookMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M14.2 8.7V7.1c0-.7.5-.9.9-.9h2.2V2.4L14.2 2c-3.1 0-4.8 1.8-4.8 5v1.7H6.2v4.2h3.2V22h4.5v-9.1h3.1l.5-4.2h-3.3Z" />
    </svg>
  );
}

export function InstagramMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path fillRule="evenodd" d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm-.1 2A3.7 3.7 0 0 0 4 7.7v8.6A3.7 3.7 0 0 0 7.7 20h8.6a3.7 3.7 0 0 0 3.7-3.7V7.7A3.7 3.7 0 0 0 16.3 4H7.7ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" clipRule="evenodd" />
      <circle cx="17.4" cy="6.6" r="1.2" />
    </svg>
  );
}

export function LinkedInMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M5.4 7.8H1.8V22h3.6V7.8ZM3.6 2A2.1 2.1 0 1 0 3.6 6.2 2.1 2.1 0 0 0 3.6 2ZM22 13.9c0-4.3-2.3-6.3-5.4-6.3a4.7 4.7 0 0 0-4.2 2.3h-.1V7.8H8.8V22h3.7v-7c0-1.9.3-3.7 2.7-3.7 2.3 0 2.4 2.2 2.4 3.8V22H22v-8.1Z" />
    </svg>
  );
}
