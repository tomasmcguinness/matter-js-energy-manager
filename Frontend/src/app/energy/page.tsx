'use client'

import Card from 'react-bootstrap/Card';
import TariffTimeline from '../../tariffTimeline.tsx';
import ForecastTimeline from '../../forecastTimeline.tsx';
import { useEffect, useState } from 'react';
import { Forecast } from '../../device.ts';
import { Manager } from 'socket.io-client';
import Spinner from 'react-bootstrap/Spinner';

export default function Page() {

  const [isOptimising, setIsOptimising] = useState<boolean>(false);
  const [prices, setPrices] = useState<number[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);

  useEffect(() => {
    fetch('http://localhost:3000/tariff').then(r => r.json()).then(data => { setPrices(data); });
    fetch('http://localhost:3000/forecast').then(r => r.json()).then(data => { setForecast(data); });

    const manager = new Manager("http://localhost:3000", {
      reconnectionDelayMax: 10000,
    });

    const socket = manager.socket("/");

    manager.open((err: any) => {
      if (err) {
        // an error has occurred
      } else {
        // the connection was successfully established
        console.log("Socket connection established");
      }
    });

    socket.on("forecast", (forecast: Forecast) => {
      console.log("Forecast Updated");
      console.log({forecast});
      setForecast(forecast);
    });
  }, []);

  const handleOptimiseClick = () => {
    setIsOptimising(true);
    fetch(`http://localhost:3000/optimise`, { method: "POST" }).then(() => setIsOptimising(false));
  };

  return <div>
    <h1>Energy Forecast</h1>
    <hr />
    {isOptimising && <div className="alert alert-info">
      Optimising Energy Usage
    </div>}
    <div style={{ position: 'relative' }}>

      <Card style={{ width: '100%', marginBottom: '10px' }}>
        <Card.Body>
          <Card.Title>Tariff</Card.Title>
          <TariffTimeline prices={prices} />
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