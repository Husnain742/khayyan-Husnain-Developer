import { useState } from 'react';
import { hasPhoto, initials } from '../lib/format';

/** Photo with a graceful initials fallback (no DOM hacks). */
export default function Avatar({ src, name, className = 'w-12 h-12', rounded = 'rounded-xl', fit = 'object-cover object-top', textSize = 'text-base' }) {
  const [failed, setFailed] = useState(false);
  if (!hasPhoto(src) || failed) {
    return (
      <div aria-label={name} className={`${className} ${rounded} ${textSize} bg-plum-100 text-plum-600 font-display font-bold flex items-center justify-center shrink-0`}>
        {initials(name)}
      </div>
    );
  }
  return <img src={src} alt={name} loading="lazy" onError={() => setFailed(true)} className={`${className} ${rounded} ${fit} bg-cream-2 shrink-0`} />;
}
