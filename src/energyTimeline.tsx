import { useEffect, useState } from "react";
import { Forecast } from "./device.ts";
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
import { Manager } from "socket.io-client";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);


type EnergyTimelineProps = {
    forecast?: Forecast;
};

const EnergyTimeline = ({ forecast }: EnergyTimelineProps) => {

    const [isConnected, setIsConnected] = useState(false);
    const [transport, setTransport] = useState("N/A");

    useEffect(() => {
        const manager = new Manager("http://localhost:3000", {
            reconnectionDelayMax: 10000,
        });

        const socket = manager.socket("/");

        manager.open((err) => {
            if (err) {
                // an error has occurred
            } else {
                setIsConnected(true);
                // the connection was successfully established
            }
        });

        socket.on("power", (power: number) => {
            console.log("Power Update: " + power); // 1
        });

    }, []);

    // Probably take this from a single location.
    //
    const start = Date.now();

    const options = {
        responsive: false,
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

    const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

    const data = {
        labels,
        datasets: [
            {
                label: "Power",
                data: [],
            }
        ]
    };

    return <div className="energyForecastContainer">

        {(forecast == null || forecast == undefined) ? <div className="empty"><h3>No Forecast Available</h3></div> :
            <div>
                <h3>Energy</h3>
                <div className="slotsContainer">
                    <p>Status: {isConnected ? "connected" : "disconnected"}</p>
                    <Line options={options} data={data} />
                </div>
            </div>
        }
    </div>;
}

export default EnergyTimeline;