'use client'
import Link from 'next/link';
import { useState } from 'react';
import { Container, Alert } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

const SocketComponent = () => {

  const [manualSetupCode, setManualSetupCode] = useState('');

  function performBasicCommissioning(e: any) {
    e.preventDefault();

    var body = JSON.stringify({
      manualSetupCode,
    });

    fetch('http://localhost:4000/devices', {
      headers: {
        "Content-Type": "application/json",
      },
      method: 'POST', body
    });
  }

  return <Container>
    <h1>Add Node</h1>
    <hr />
    <Alert>
       We cannot use Bluetooth to commission a device at present. Commission the device using another controller and then open its Commissioning Window.
    </Alert>
    <Form>
      <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
        <Form.Label>Manual Pairing Code</Form.Label>
        <Form.Control type="text" placeholder="1234-123-1234" value={manualSetupCode} onChange={(e: any) => setManualSetupCode(e.target.value)} />
      </Form.Group>
    </Form>
    <Link href="/devices" className="btn btn-danger" style={{marginRight:'5px'}}>Cancel</Link>
    <Button onClick={performBasicCommissioning}>Commission</Button>
  </Container>;
};

export default SocketComponent;