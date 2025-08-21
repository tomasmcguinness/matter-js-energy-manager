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
} from 'chart.js';
import { Line } from 'react-chartjs-2';

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

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Real-time Data',
        data: [],
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false,
      },
    ],
  });

  useEffect(() => {

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

      setChartData((prevData) => {
        const newLabels = [...prevData.labels, new Date().toLocaleTimeString()];
        const newData = [...prevData.datasets[0].data, power];

        return {
          labels: newLabels.slice(-10), // Keep only the last 10 labels
          datasets: [
            {
              ...prevData.datasets[0],
              data: newData.slice(-10), // Keep only the last 10 data points
            },
          ],
        };
      });
    });

  }, [chartRef]);

  const options = {
    responsive: false,
    plugins: {
      legend: {
        display: false,
        position: 'top' as const,
      },
      title: {
        display: false
      },
    },
  };

  return <div>
    <h1>Energy</h1>
    <hr />
    <Card style={{ width: '100%', height: '300px' }}>
      <Card.Body>
        {/* <Card.Title>Current</Card.Title> */}
        <Line options={options} data={chartData} />
      </Card.Body>
    </Card>
  </div>;
};