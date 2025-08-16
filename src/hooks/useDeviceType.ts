import { useState, useEffect } from 'react';

export const useDeviceType = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // ウィンドウ幅でモバイルかどうかを判定
      const width = window.innerWidth;
      setIsMobile(width < 768);
    };

    // 初回チェック
    checkDevice();

    // リサイズ時の再チェック
    window.addEventListener('resize', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  return { isMobile };
};