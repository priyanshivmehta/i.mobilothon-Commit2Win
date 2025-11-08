'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
}

const Portal = ({ children }: PortalProps) => {
  const [mounted, setMounted] = useState(false);
  const [el] = useState(() => document ? document.createElement('div') : null);

  useEffect(() => {
    if (!el) return;
    document.body.appendChild(el);
    setMounted(true);

    return () => {
      try {
        document.body.removeChild(el);
      } catch (e) {
        // ignore
      }
    };
  }, [el]);

  if (!mounted || !el) return null;
  return createPortal(children, el);
};

export default Portal;
