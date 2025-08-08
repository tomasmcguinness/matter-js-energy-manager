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

      // if (chartRef.current) {
      //   //chartRef.current.labels.push(Math.floor(Math.random() * 100));
      //   chartRef.current.data.datasets[0].data.push([Math.floor(Math.random() * 100), power]);
      //   chartRef.current.update();
      // }
    });

  }, [chartRef]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false
      },
    },
  };

  // const labels: string[] = [];

  // const data = {
  //   labels,
  //   datasets: [
  //     {
  //       label: "Power",
  //       data: [],
  //     }
  //   ]
  // };

  return <div>
    <h1>Energy</h1>
    <hr />
    <Card style={{ width: '100%' }}>
      <Card.Body>
        <Card.Title>Current</Card.Title>
        <Line options={options} data={chartData} />
      </Card.Body>
    </Card>
  </div>;
};