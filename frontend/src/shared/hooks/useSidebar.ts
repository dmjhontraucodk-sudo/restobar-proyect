// src/hooks/useSidebar.ts
import { useState, useEffect } from 'react';

export const useSidebar = () => {
  const [isPinned, setIsPinned] = useState(
    localStorage.getItem('sidebarPinned') !== 'false'
  );
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebarPinned', String(isPinned));
  }, [isPinned]);

  const togglePin = () => {
    setIsPinned(!isPinned);
  };

  const isCollapsed = !isPinned;
  const showFlyout = isHovering && isCollapsed;

  const sidebarWidthClass = isPinned ? 'w-72' : 'w-20';
  const mainContentMarginClass = isPinned ? 'md:ml-72' : 'md:ml-20';

  return {
    isPinned,
    isHovering,
    setIsHovering,
    isCollapsed,
    showFlyout,
    sidebarWidthClass,
    mainContentMarginClass,
    togglePin,
  };
};