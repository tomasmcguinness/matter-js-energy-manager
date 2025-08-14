'use client'

import { useEffect, useState } from 'react';
import Table from 'react-bootstrap/Table';
import Link from 'next/link'
import Spinner from 'react-bootstrap/Spinner';
import Badge from 'react-bootstrap/Badge';
import Container from 'react-bootstrap/Container';
import { NodeStates, PairedNode } from '@project-chip/matter.js/device';
import { stat } from 'fs';

export default function Page() {

  const [isLoading, setIsLoading] = useState(true);
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    fetch('/api/devices').then(r => r.json()).then(data => { setDevices(data); setIsLoading(false); });
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
    <tr key={device.id} style={{ cursor: 'pointer' }} onClick={() => handleRowClick(device)}><td>{device.id}</td><td style={{width:'1%'}}>{getStateBadge(device.state)}</td></tr>
  );

  return <Container>
    <h1>Commissioned Devices</h1>
    <hr />
    {!isLoading
      ? <Table striped bordered hover>
        <thead>
          <tr>
            <th>Id</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {deviceTRs}
        </tbody>
      </Table>
      : <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading commissioned devices...</span>
      </Spinner>}

    <Link href="/devices/add">Add Devices</Link>
  </Container>;
};