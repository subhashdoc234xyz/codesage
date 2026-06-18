/**
 * Client-side helper to send review email via server-side API route.
 * No credentials are exposed to the browser — everything goes through /api/send-email.
 */
export async function sendReviewEmail({ toEmail, prTitle, review, shareUrl }) {
  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toEmail, prTitle, review, shareUrl }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to send email');
  }

  return res.json();
}
