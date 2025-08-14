'use client';

import { useEffect } from 'react';
import { ErrorBoundary } from '@/components/organisms/ErrorBoundary';
import { ToastProvider } from '@/components/organisms/Toast';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // グローバルエラーハンドリング
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      // 必要に応じてエラー報告サービスに送信
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // 必要に応じてエラー報告サービスに送信
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ErrorBoundary>
  );
}