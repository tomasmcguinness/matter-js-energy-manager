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
        const width = slot.duration * 3.33;
        return <div className="slot" key={key} style={{ width: `${width}px` }}>{index}</div>;
    });

    //if (forecast.startTime > 0) {
    //slots.splice(0, 0, <div className="slot hatched" key="delay" style={{ width: `${forecast.startTime * 3.33}px` }}></div>)
    //}

    return <div className="energyForecastContainer">
        <div className="forecastContainer" style={{ left: '100px' }}>
            <div className="slotsContainer">
                {slots}
            </div>
            <span className="startTime">{forecast.startTime.getHours()}:{forecast.startTime.getMinutes()}</span>
            <span className="endTime">{forecast.endTime.getHours()}:{forecast.endTime.getMinutes()}</span>
        </div>
    </div>;
}

export default ForecastTimeline;