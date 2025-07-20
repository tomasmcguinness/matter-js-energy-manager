'use client'
import { useEffect, useState } from 'react';
import { Device } from '../device.js'
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

const SocketComponent = () => {

  const [manualSetupCode, setManualSetupCode] = useState('');
  const [devices, setDevices] = useState<Device>([]);

  useEffect(() => {
    fetch('/api/devices').then(r => r.json()).then(data => setDevices(data));
  }, []);

  function performBasicCommissioning(e: any) {
    e.preventDefault();

    var body = JSON.stringify({
      manualSetupCode,
    });

    fetch('/api/devices', { method: 'POST', body });
  }

  return <div>
    <Form>
      <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
        <Form.Label>Manual Pairing Code</Form.Label>
        <Form.Control type="text" placeholder="1234-123-1234" value={manualSetupCode} onChange={(e) => setManualSetupCode(e.target.value)} />
      </Form.Group>
    </Form>
    {/* <input type="text" placeholder="Pairing Code" value={manualSetupCode} onChange={(e) => setManualSetupCode(e.target.value)} /> */}
    <Button onClick={performBasicCommissioning}>Commission</Button>
  </div>;
};

export default SocketComponent;