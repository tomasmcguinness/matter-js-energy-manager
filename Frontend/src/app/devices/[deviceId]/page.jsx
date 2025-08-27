'use client'

import { use, useState, useEffect, useRef } from 'react';
import EnergyTimeline from '../../../forecastTimeline.tsx';
import Device from '../../../device.ts';
import { Button, Container } from 'react-bootstrap';
import { Manager } from 'socket.io-client';
import { DeviceClasses } from '@project-chip/matter.js/device';
import { nodeId } from '@matter/main/model';

// export default function Page({
//   params,
// }: {
//   params: Promise<{ deviceId: string }>
// }) {

export default function Page({ params }) {

  const { deviceId } = use(params);

  console.log("Device ID: " + deviceId);


  //const [device, setDevice] = useState<Device>();
  //const [forecast, setForecast] = useState<any>();
  const [device, setDevice] = useState(null);
  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:3000/devices/${deviceId}`).then(r => r.json()).then(data => { setDevice(data); });
  }, []);

  useEffect(() => {

    const manager = new Manager("http://localhost:3000", {
      reconnectionDelayMax: 10000,
    });

    const socket = manager.socket("/");

    manager.open(err => {
      if (err) {
        // an error has occurred
      } else {
        // the connection was successfully established
        console.log("Socket connection established");
      }
    });

    //     socket.on("power", (power: number) => {
    //       console.log("Power Update: " + power);
    //     });

    //     socket.on("status", (nodeId: number) => {
    //       console.log("Status Update: " + nodeId);
    //     });

    socket.on("forecast", (forecast) => {
      console.log("Forecast Updated: " + forecast.forecastId);
      setForecast(forecast);
    });
  }, []);

  const unpairDevice = () => {
    let unpair = confirm("Are you sure you want to unpair this device?");
    
    if (unpair) {
      fetch(`http://localhost:3000/devices/${deviceId}`, { method: "DELETE" });
    }
  };

  const devices = device?.devices.map((d, index) => {
    return <div key={index} className="alert alert-light">{d.number} - {d.name}</div>
  });

  return <Container>
    <h1>Node: {deviceId}</h1>
    <hr />
    {devices}
    <Button onClick={unpairDevice}>Unpair Device</Button>
  </Container>;
};