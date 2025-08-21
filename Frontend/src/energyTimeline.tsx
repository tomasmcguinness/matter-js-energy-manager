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

const EnergyTimeline = ({ forecast }: EnergyTimelineProps) => {

    console.log("Rendering EnergyTimeline with forecast:", forecast);

    const start = Date.now();

    let slots = forecast?.slots.map((slot,index) => {
        const key = `slot_${index}`;
        return <div className="slot" key={key}>{slot.nominalPower}W</div>;
    });

    return <div className="energyForecastContainer">
        {(forecast == null || forecast == undefined) ? <div className="empty"><h3>No Forecast Available</h3></div> :
            <div>
                <h3>Energy Forecast</h3>
                <div className="slotsContainer">
                    {slots}
                </div>
            </div>
        }
    </div>;
}

export default EnergyTimeline;