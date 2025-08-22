'use client'

import { useEffect, useRef, useState } from 'react';
import { Manager } from "socket.io-client";
import Card from 'react-bootstrap/Card';
import TariffTimeline from '../../tariffTimeline.tsx';
import ForecastTimeline from '../../forecastTimeline.tsx';

export default function Page() {

  let forecast = {
    slots: [{nominalPower: 3000, duration: 30}, {nominalPower: 1000, duration: 60}, {nominalPower:1500, duration: 30}]
  };

  return <div>
    <h1>Energy Forecast</h1>
    <hr />
    <div style={{position: 'relative'}}>

    <Card style={{ width: '100%', marginBottom: '10px' }}>
      <Card.Body>
        <Card.Title>Tariff</Card.Title>
        <TariffTimeline />
      </Card.Body>
    </Card>

    <Card style={{ width: '100%' }}>
      <Card.Body>
        <Card.Title>Dishwasher</Card.Title>
        <ForecastTimeline forecast={forecast} />
      </Card.Body>
    </Card>
  </div>
  </div>;
};