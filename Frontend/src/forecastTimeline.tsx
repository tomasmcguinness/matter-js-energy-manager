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

    //console.log("Rendering EnergyTimeline with forecast:", forecast);

    if (forecast == null) {
        return <div className="alert alert-info" style={{ marginBottom: '0' }}>No Energy Usage Forecast</div>;
    }

    let slots = forecast.slots.map((slot, index) => {
        const key = `slot_${index}`;
        const width = slot.duration * 0.03;
        return <div className="slot" key={key} style={{ width: `${width}px` }}>{index}</div>;
    });

    //if (forecast.startTime > 0) {
    //slots.splice(0, 0, <div className="slot hatched" key="delay" style={{ width: `${forecast.startTime * 3.33}px` }}></div>)
    //}

    const computeOffset = (startTime: number) => {
        let startTimeInMilli = startTime * 1000;

        let differenceInMilli = startTimeInMilli - currentTime!.getTime();

        let differenceInSeconds = Math.round(differenceInMilli / 1000);

        return `${differenceInSeconds * 0.03}px`;
        //return '0px';
    }

    return <div className="energyForecastContainer">
        <div className="forecastContainer" style={{ left: computeOffset(forecast.startTime) }}>
            <div className="slotsContainer">
                {slots}
            </div>
            <span className="startTime">{new Date(forecast.startTime * 1000).toLocaleTimeString('en-GB', { hour12: false })}</span>
            {/* <span className="endTime">{forecast.endTime.toLocaleTimeString('en-GB', { hour12: false })}</span> */}
        </div>
    </div>;
}

export default ForecastTimeline;