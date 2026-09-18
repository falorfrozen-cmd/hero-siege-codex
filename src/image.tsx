import type { ImgHTMLAttributes } from 'react';

// The website already opts out of server-side image transforms. Keep the same
// reserved dimensions, native lazy loading and error handlers in the offline app.
export default function Image({
  unoptimized: _unoptimized, priority, ...props
}: ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean; priority?: boolean }) {
  return <img {...props} loading={priority ? 'eager' : (props.loading ?? 'lazy')} decoding="async" fetchPriority={priority ? 'high' : 'auto'} />;
}
