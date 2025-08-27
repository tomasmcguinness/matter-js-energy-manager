'use client'

import { useEffect, useState } from 'react';
import Table from 'react-bootstrap/Table';
import Link from 'next/link'
import Spinner from 'react-bootstrap/Spinner';
import Badge from 'react-bootstrap/Badge';
import Container from 'react-bootstrap/Container';
import Alert from 'react-bootstrap/Alert';
import { NodeStates } from '@project-chip/matter.js/device';
import { Manager } from 'socket.io-client';
import Device from '../../device.ts';

export default function Page() {

  const [isLoading, setIsLoading] = useState(true);
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/devices').then(r => r.json()).then(data => { setDevices(data); setIsLoading(false); });
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
    });
  }, []);

  const handleRowClick = (device: Device) => {
    location.href = `/devices/${device.id}`;
  }

  const getStateBadge = (state: NodeStates): any => {
    var stateBadge: any = null;

    switch (state) {
      case NodeStates.Connected:
        stateBadge = <Badge bg="success">Connected</Badge>;
        break;
      case NodeStates.Disconnected:
        stateBadge = <Badge bg="success">Disconnected</Badge>;
        break;
      case NodeStates.Reconnecting:
        stateBadge = <Badge bg="success">Reconnecting</Badge>;
        break;
      case NodeStates.WaitingForDeviceDiscovery:
        stateBadge = <Badge bg="success">WaitingForDeviceDiscovery</Badge>;
        break;
    }

    return stateBadge;
  }

  const deviceTRs = devices.map((device) =>
    <tr key={device.id} style={{ cursor: 'pointer' }} onClick={() => handleRowClick(device)}><td>{device.id}</td><td style={{ width: '1%' }}>{getStateBadge(device.state)}</td></tr>
  );

  var body = null;

  if (isLoading) {
    body = <Alert variant="info">Loading nodes...</Alert>;
  }
  else {
    if (deviceTRs.length == 0) {
      body = <Alert variant="info">No devices have been commissioned. We cannot use Bluetooth to commission a device, so open the Pairing Windows using another device.</Alert>
    } else {
      body = <Table striped bordered hover>
        <thead>
          <tr>
            <th>Id</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {deviceTRs}
        </tbody>
      </Table>;
    }
  }

  return <Container>
    <h1>Devices</h1>
    <hr />
    {body}
    <Link href="/devices/add" className="btn btn-primary">Add Device</Link>
  </Container>;
};