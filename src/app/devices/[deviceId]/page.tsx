'use client'

import { use } from 'react';

export default function Page({
  params,
}: {
  params: Promise<{ deviceId: string }>
}) {

  const { deviceId } = use(params);

  return <div>
    <h1>Device: {deviceId}</h1>
  </div>;
};