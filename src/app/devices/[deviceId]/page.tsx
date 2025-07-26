'use client'

import { use, useState, useEffect } from 'react';
import EnergyTimeline from '../../../energyTimeline.tsx';
import Device from '../../../device.ts';
import { Button } from 'react-bootstrap';

export default function Page({
  params,
}: {
  params: Promise<{ deviceId: string }>
}) {

  const { deviceId } = use(params);

  const [device, setDevice] = useState<Device>();

  useEffect(() => {
    fetch(`/api/devices/${deviceId}`).then(r => r.json()).then(data => { setDevice(data); });
  }, []);

  const sendStartTimeAdjustment = () => {
    fetch(`/api/devices/${deviceId}/forecast?operation=adjustStartTime`, { method: "POST" });
  };

  return <div>
    <h1>Node: {deviceId}</h1>
    <hr />
    {device && <EnergyTimeline forecast={device.forecast} />}
    <Button onClick={sendStartTimeAdjustment}>Delay Start</Button>
  </div>;
};