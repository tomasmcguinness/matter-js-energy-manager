'use client'

import { useEffect, useState } from 'react';
import { Device } from '../../device.js'
import Table from 'react-bootstrap/Table';
import Link from 'next/link'
import Spinner from 'react-bootstrap/Spinner';
import Badge from 'react-bootstrap/Badge'; 

export default function Page() {

  const [isLoading, setIsLoading] = useState(true);
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    fetch('/api/devices').then(r => r.json()).then(data => { setDevices(data); setIsLoading(false); });
  }, []);

  const handleRowClick = (device: Device) => {
    console.log({ device });
    location.href = `/devices/${device.id}`;
  }

  const deviceTRs = devices.map((device) =>
    <tr key={device.id} style={{ cursor: 'pointer' }} onClick={() => handleRowClick(device)}><td>{device.id}</td><td><Badge pill bg="primary">Primary</Badge></td></tr>
  );

  return <div>
    <h1>Commissioned Devices</h1>
    <hr />
    {!isLoading
      ? <Table striped bordered hover>
        <thead>
          <tr>
            <th>Id</th>
            <th />
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
  </div>;
};