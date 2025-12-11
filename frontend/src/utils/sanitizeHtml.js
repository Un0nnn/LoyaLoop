import DOMPurify from 'dompurify';

export default function sanitizeHtml(unsafeHtml) {
    if (!unsafeHtml && unsafeHtml !== 0) return '';
    try {
        return DOMPurify.sanitize(String(unsafeHtml), {USE_PROFILES: {html: true}});
    } catch (err) {
        console.error('Sanitize failed', err);
        return '';
    }
}

