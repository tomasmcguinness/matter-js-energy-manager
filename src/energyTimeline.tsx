import { Forecast } from "./device.ts";

type EnergyTimelineProps = {
    forecast?: Forecast;
};

const EnergyTimeline = ({ forecast }: EnergyTimelineProps) => {

    // Probably take this from a single location.
    //
    const start = Date.now();

    var slots = forecast?.slots.map((s, index) => { return <div key={index} className="slot" style={{}}>Power {s.nominalPower/1000000}kW</div> })

    return <div className="energyForecastContainer">

        {(forecast == null || forecast == undefined) ? <div className="empty"><h3>No Forecast Available</h3></div> :
            <div>
                <h3>Energy</h3>
                <div className="slotsContainer">
                {slots}
                </div>
            </div>
        }
    </div>;
}

export default EnergyTimeline;