'use client'

import { useRef, useState, useEffect } from "react";
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
};

const ForecastTimeline = ({ forecast }: EnergyTimelineProps) => {

    const [containerWidth, setContainerWidth] = useState<number>(10);

    const containerRef = useRef(null);

    useEffect(() => {
        setTimeout(() => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.getBoundingClientRect().width);
            }
        }, 0);
    }, [])

    console.log("Rendering EnergyTimeline with forecast:", forecast);

    if (forecast == null) {
        return <div className="alert alert-info" style={{ marginBottom: '0' }}>No power usage currently forecast</div>;
    }

    let slots = forecast.slots.map((slot, index) => {

        console.log("Rendering slot:", slot);

        const key = `slot_${index}`;
        const width = (slot.defaultDuration / 86400) * 100; // Scale width for better visibility

        return <div className="slot" key={key} style={{ width: `calc(${width}% - 1px)` }}>{(slot.nominalPower / 1000000).toFixed(3)}kW</div>;
    });

    const computeOffset = (startTimeInSeconds: number) => {

        // Always show relative to midnight today.
        //
        let today = new Date();
        today.setHours(0, 0, 0, 0);

        let todayInSeconds = today.getTime() / 1000;

        console.log({ todayInSeconds, startTimeInSeconds });

        let timeDifference = startTimeInSeconds - todayInSeconds;

        // Get the width of the container in pixels
        //
        var pixelsPerSection = containerWidth / 86400; // pixels per second

        return `${pixelsPerSection * timeDifference}px`;
    }

    return <div className="energyForecastContainer">
        <div className="forecastContainer" style={{ left: computeOffset(forecast.startTime) }}>
            {containerWidth}
            <div className="slotsContainer" ref={containerRef}>
                {slots}
            </div>
            <span className="startTime">{new Date(forecast.startTime * 1000).toLocaleTimeString('en-GB', { hour12: false })}</span>
        </div>
    </div>;
}

export default ForecastTimeline;