import React from 'react';
import sanitizeHtml from '../utils/sanitizeHtml';

const SafeHtml = ({ html, className = '' }) => {
    const clean = sanitizeHtml(html);
    return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
};

export default SafeHtml;

