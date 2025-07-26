'use client'

import Card from 'react-bootstrap/Card';
import { BarChart } from '@mui/x-charts/BarChart';

export default function Page() {

  return <div>
    <h1>Energy Forecast</h1>
    <Card style={{ width: '100%' }}>
      <Card.Body>
        <Card.Title>Tariff</Card.Title>
        <BarChart
          xAxis={[{ data: ['per kWh'] }]}
          series={[{ data: [7.5] },
          { data: [7.5] },
          { data: [7.5] },
          { data: [7.5] },
          { data: [7.5] },
          { data: [7.5] },
          { data: [7.5] },
          { data: [7.5] },
          { data: [28] },
          { data: [28] },
          { data: [28] },
          { data: [28] },
          { data: [28] },
          { data: [28] },
          { data: [28] },
          { data: [28] },
          { data: [7.5] },
          { data: [7.5] },
          { data: [7.5] },
          { data: [7.5] },
          { data: [7.5] },
          { data: [7.5] },
          { data: [7.5] },]}
          height={300}
          colors={['blue']}
        />
      </Card.Body>
    </Card>
  </div>;
};