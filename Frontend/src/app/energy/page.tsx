'use client'

import TariffTimeline from '../../tariffTimeline.tsx';
import { useEffect, useState } from 'react';
import DeviceView from '../../deviceView.tsx';

export default function Page() {

  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const [isOptimising, setIsOptimising] = useState<boolean>(false);
  const [prices, setPrices] = useState<number[]>([]);

  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:4000/tariff').then(r => r.json()).then(data => { setPrices(data); });
    fetch('http://localhost:4000/devices').then(r => r.json()).then(data => { setDevices(data); });

    setCurrentTime(new Date())
  }, []);

  const handleOptimiseClick = () => {
    setIsOptimising(true);
    fetch(`http://localhost:4000/optimise`, { method: "POST" }).then(() => setIsOptimising(false));
  };

  var deviceCards = devices.map((device, index) => {

    return (<div key={`device_${index}`} className="card" style={{ marginBottom: '10px' }}>
        <div className="card-header">
          {device.id} {device.optOutState}
        </div>
        <div className="card-body">
          <DeviceView nodeId={device.id} currentTime={currentTime} />
        </div>
      </div>);
  });

  return <div>
    <h1>Energy Forecast</h1>
    <hr />
    <div style={{ position: 'relative' }} suppressHydrationWarning={true}>

      <div className="card" style={{ marginBottom: '10px' }}>
        <div className="card-header">
          Electricity Price
        </div>
        <div className="card-body">
          <TariffTimeline prices={prices} currentTime={currentTime} />
        </div>
      </div>

      {deviceCards}

      {isOptimising && <div className="alert alert-info">
        Optimising Energy Usage
      </div>}

      <button className="btn btn-primary" onClick={handleOptimiseClick}>Optimise</button>

    </div>
  </div>;
};