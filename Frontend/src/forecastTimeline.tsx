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

    console.log("Rendering EnergyTimeline with forecast:", forecast);

    const start = Date.now();

    let slots = forecast?.slots.map((slot, index) => {
        const key = `slot_${index}`;
        const width = slot.duration * 3.33;
        return <div className="slot" key={key} style={{width: `${width}px`}}>{index}</div>;
    });

    return <div className="energyForecastContainer">
        {(forecast == null || forecast == undefined) ? <div className="alert alert-info" style={{ marginBottom: '0' }}>No Energy Usage Forecast</div> :
            <div className="slotsContainer">
                {slots}
            </div>
        }
    </div>;
}

export default ForecastTimeline;