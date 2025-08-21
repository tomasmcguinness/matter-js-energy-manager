'use client'
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

const SocketComponent = () => {

  const [manualSetupCode, setManualSetupCode] = useState('');

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
    <Button onClick={performBasicCommissioning}>Commission</Button>
  </div>;
};

export default SocketComponent;