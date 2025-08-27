'use client'

import Card from 'react-bootstrap/Card';
import TariffTimeline from '../../tariffTimeline.tsx';
import ForecastTimeline from '../../forecastTimeline.tsx';
import { useEffect, useState } from 'react';
import { Forecast } from '../../device.ts';
import { Manager } from 'socket.io-client';

export default function Page() {

  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const [isOptimising, setIsOptimising] = useState<boolean>(false);
  const [prices, setPrices] = useState<number[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);

  useEffect(() => {
    fetch('http://localhost:3000/tariff').then(r => r.json()).then(data => { setPrices(data); });
    fetch('http://localhost:3000/forecast').then(r => r.status === 200 ? r.json() : null).then(data => {
      if (data) {
        let forecast: Forecast = {
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          slots: [...data.slots]
        }
        setForecast(forecast);
      } else {
        setForecast(null);
      }
    });

    setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

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

    socket.on("forecast", (data: Forecast) => {
      console.log("Forecast Updated");
      let forecast: Forecast = {
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        slots: [...data.slots]
      }
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
    <div style={{ position: 'relative' }} suppressHydrationWarning={true}>

      <Card style={{ width: '100%', marginBottom: '10px' }}>
        <Card.Body>
          <Card.Title>Tariff</Card.Title>
          <TariffTimeline prices={prices} currentTime={currentTime} />
        </Card.Body>
      </Card>

      <Card style={{ width: '100%', marginBottom: '10px' }}>
        <Card.Body>
          <Card.Title>Dishwasher</Card.Title>
          <ForecastTimeline forecast={forecast} currentTime={currentTime} />
        </Card.Body>
      </Card>

       {isOptimising && <div className="alert alert-info">
      Optimising Energy Usage
    </div>}

      <button className="btn btn-primary" onClick={handleOptimiseClick}>Optimise</button>

    </div>
  </div>;
};