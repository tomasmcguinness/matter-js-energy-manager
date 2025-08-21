'use client'

import { use, useState, useEffect, useRef } from 'react';
import EnergyTimeline from '../../../energyTimeline.tsx';
import Device from '../../../device.ts';
import { Button, Container } from 'react-bootstrap';
import { Manager } from 'socket.io-client';

export default function Page({
  params,
}: {
  params: Promise<{ deviceId: string }>
}) {

  const { deviceId } = use(params);

  const [device, setDevice] = useState<Device>();
  const [forecast, setForecast] = useState<any>();

  useEffect(() => {
    fetch(`/api/devices/${deviceId}`).then(r => r.json()).then(data => { setDevice(data); });
  }, []);

   useEffect(() => {
  
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
  
      socket.on("power", (power: number) => {
        console.log("Power Update: " + power);
      });
  
      socket.on("status", (nodeId: number) => {
        console.log("Status Update: " + nodeId);
      });
  
      socket.on("forecast", (forecast: any) => {
        console.log("Forecast Updated: " + forecast.forecastId);
        setForecast(forecast);
      });
    }, []);

  const sendStartTimeAdjustment = () => {
    fetch(`/api/devices/${deviceId}/forecast?operation=adjustStartTime`, { method: "POST" });
  };

  const unpairDevice = () => {
    fetch(`/api/devices/${deviceId}`, { method: "DELETE" });
  };

  return <Container>
    <h1>Node: {deviceId}</h1>
    <hr />
    {device && <EnergyTimeline forecast={forecast} />}
    <hr />
    <Button onClick={sendStartTimeAdjustment} style={{marginRight: '5px'}}>Delay Start</Button>
    <Button onClick={unpairDevice}>Unpair Device</Button>
  </Container>;
};