import React from 'react';
import '../styles/index.css';
import 'leaflet/dist/leaflet.css';
import '../styles/tailwind.css';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  title: 'VW Driver Attention Platform',
  description: 'Privacy-first driver attention monitoring for Volkswagen commercial fleet with on-device face mesh analysis',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}

        <script type="module" src="https://static.rocket.new/rocket-web.js?_cfg=https%3A%2F%2Fvwdriver4068back.builtwithrocket.new&_be=https%3A%2F%2Fapplication.rocket.new&_v=0.1.9" />
        <script type="module" src="https://static.rocket.new/rocket-shot.js?v=0.0.1" /></body>
    </html>
  );
}
