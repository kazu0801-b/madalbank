'use client';

import { StoreDetailPage } from '@/components/pages/StoreDetailPage';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StorePage({ params }: PageProps) {
  const { id } = await params;
  return <StoreDetailPage storeId={id} />;
}