import emailjs from '@emailjs/browser';

export async function sendReviewEmail({ toEmail, prTitle, review }) {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn('EmailJS keys not configured');
    return;
  }

  const templateParams = {
    to_email: toEmail,
    pr_title: prTitle,
    score: review.score,
    verdict: review.verdict,
    summary: review.summary,
    critical_count: review.critical?.length || 0,
    warnings_count: review.warnings?.length || 0,
    improvements_count: review.improvements?.length || 0,
    review_url: window.location.href,
  };

  try {
    const response = await emailjs.send(serviceId, templateId, templateParams, { publicKey });
    console.log('Review email sent successfully', response);
    return response;
  } catch (err) {
    console.error('EmailJS error:', err);
    if (err && typeof err === 'object') {
      console.error('EmailJS error details - Status:', err.status, 'Text:', err.text, 'Full:', JSON.stringify(err));
    }
    throw err;
  }
}
