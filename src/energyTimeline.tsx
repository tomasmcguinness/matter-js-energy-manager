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

    // useEffect(() => {
    //     if (socket.connected) {
    //         onConnect();
    //     }

    //     function onConnect() {
    //         setIsConnected(true);
    //         setTransport(socket.io.engine.transport.name);

    //         socket.io.engine.on("upgrade", (transport) => {
    //             setTransport(transport.name);
    //         });
    //     }

    //     function onDisconnect() {
    //         setIsConnected(false);
    //         setTransport("N/A");
    //     }

    //     socket.on("connect", onConnect);
    //     socket.on("disconnect", onDisconnect);
    //     socket.on("power", (power: number) => {
    //         console.log(power); // 1
    //     });

    //     return () => {
    //         socket.off("connect", onConnect);
    //         socket.off("disconnect", onDisconnect);
    //     };
    // }, []);

    // Probably take this from a single location.
    //
    const start = Date.now();

    var slots = forecast?.slots.map((s, index) => { return <div key={index} className="slot" style={{}}>Power {s.nominalPower / 1000000}kW</div> });

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
                    {/* {slots} */}
                    <p>Status: { isConnected ? "connected" : "disconnected" }</p>
                    <Line options={options} data={data} />
                </div>
            </div>
        }
    </div>;
}

export default EnergyTimeline;