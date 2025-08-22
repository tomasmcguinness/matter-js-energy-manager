'use client'

import Card from 'react-bootstrap/Card';
import TariffTimeline from '../../tariffTimeline.tsx';
import ForecastTimeline from '../../forecastTimeline.tsx';
import { useState } from 'react';

export default function Page() {

  const [isOptimising, setIsOptimising] = useState<boolean>(false);

  // TODO Fetch this forecast
  let forecast = {
    slots: [{ nominalPower: 3000, duration: 30 }, { nominalPower: 1000, duration: 60 }, { nominalPower: 1500, duration: 30 }]
  };

  // TODO Fetch the current tariff

  const handleOptimiseClick = () => {
    setIsOptimising(true);
      fetch(`/optimise`, { method: "POST" }).then(() => setIsOptimising(false));
  };

  return <div>
    <h1>Energy Forecast</h1>
    <hr />
    {isOptimising ?? <div className="alert alert-info">Optimising Energy Usage</div>}
    <div style={{ position: 'relative' }}>

      <Card style={{ width: '100%', marginBottom: '10px' }}>
        <Card.Body>
          <Card.Title>Tariff</Card.Title>
          <TariffTimeline />
        </Card.Body>
      </Card>

      <Card style={{ width: '100%', marginBottom: '10px' }}>
        <Card.Body>
          <Card.Title>Dishwasher</Card.Title>
          <ForecastTimeline forecast={forecast} />
        </Card.Body>
      </Card>

      <button className="btn btn-primary" onClick={handleOptimiseClick}>Optimise</button>

    </div>
  </div>;
};