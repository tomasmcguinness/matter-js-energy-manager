'use client'

import Container from 'react-bootstrap/Container';

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
import { useState } from 'react';
import { getEnergyManager } from '../../../energyManager.js';

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

   const [chartData, setChartData] = useState({
        labels: [10,20,30,40,50],
        datasets: [
            {
                label: 'Real-time Data',
                data: [[30,50],[40,50],[50,50]],
                fill: false,
            },
        ],
    });

    const addForecast = () => {
        let energyManager = getEnergyManager();

        if(energyManager) {
            console.log({energyManager});
            energyManager.processForecast(1, {startTime: 1, endTime: 2});
        }
    };

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

    return <Container>
        <div>
            Test Page
            <hr />
            <Line options={options} data={chartData} />
            <button onClick={addForecast}>Add Forecast</button>
        </div>
    </Container>;
}