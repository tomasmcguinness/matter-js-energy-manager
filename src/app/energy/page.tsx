'use client'

import { useEffect, useRef, useState } from 'react';
import { Manager } from "socket.io-client";
import Card from 'react-bootstrap/Card';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { KDFSR2_INFO } from '@matter/main/protocol';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Page() {

  const chartRef = useRef<'line'>(null);

  useEffect(() => {

    console.log(chartRef.current);

    const manager = new Manager("http://localhost:3000", {
      reconnectionDelayMax: 10000,
    });

    const socket = manager.socket("/");

    manager.open((err) => {
      if (err) {
        // an error has occurred
      } else {
        // the connection was successfully established
      }
    });

    socket.on("power", (power: number) => {
      console.log("Power Update: " + power); // 1
      console.log(chartRef.current);

      if (chartRef.current) {
        //chartRef.current.labels.push(Math.floor(Math.random() * 100));
        chartRef.current.data.datasets[0].data.push([Math.floor(Math.random() * 100), power]);
        chartRef.current.update();
      }
    });

  }, [chartRef]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Chart.js Line Chart',
      },
    },
  };

  const labels: string[] = [];

  const data = {
    labels,
    datasets: [
      {
        label: "Power",
        data: [],
      }
    ]
  };

  return <div>
    <h1>Energy Forecast</h1>
    <Card style={{ width: '100%' }}>
      <Card.Body>
        <Card.Title>Current</Card.Title>
        <Line ref={chartRef} options={options} data={data} />
      </Card.Body>
    </Card>
  </div>;
};