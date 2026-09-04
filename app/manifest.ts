import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Alex Health Plan',
    short_name: 'Alex Health',
    description: 'One good choice at a time.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f4ea',
    theme_color: '#083f36',
    orientation: 'portrait',
    icons: [{ src: '/alex-logo.png', sizes: 'any', type: 'image/png', purpose: 'any' }],
  };
}
