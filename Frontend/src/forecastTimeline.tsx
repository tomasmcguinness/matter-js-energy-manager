'use client'

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
    currentTime?: Date;
};

const ForecastTimeline = ({ forecast, currentTime }: EnergyTimelineProps) => {

    console.log("Rendering EnergyTimeline with forecast:", forecast);

    if (forecast == null) {
        return <div className="alert alert-info" style={{ marginBottom: '0' }}>No energy usage currently forecast</div>;
    }

    let slots = forecast.slots.map((slot, index) => {

        console.log("Rendering slot:", slot);

        const key = `slot_${index}`;
        const width =  (slot.defaultDuration / 86400) * 100; // Scale width for better visibility
        console.log({width});
        return <div className="slot" key={key} style={{ width: `${width}%` }}>{slot.nominalPower/1000000}kW</div>;
    });

    const computeOffset = (startTime: number) => {

        let today = new Date();
        today.setHours(0, 0, 0, 0);
        let todayInSeconds = today.getTime() / 1000;

        let timeDifference = startTime - todayInSeconds;

        return `${timeDifference}px`;
    }

    return <div className="energyForecastContainer">
        <div className="forecastContainer" style={{ left: computeOffset(forecast.startTime) }}>
            <div className="slotsContainer">
                {slots}
            </div>
            <span className="startTime">{new Date(forecast.startTime * 1000).toLocaleTimeString('en-GB', { hour12: false })}</span>
        </div>
    </div>;
}

export default ForecastTimeline;