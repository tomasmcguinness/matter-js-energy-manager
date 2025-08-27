'use client'

type TariffTimelineProps = {
    prices: number[];
    currentTime: Date;
};

const TariffTimeline = ({ prices, currentTime }: TariffTimelineProps) => {

    let slots = prices.map((p: any, index) => {
        let slotClass = p.price == 28 ? "slot peak" : "slot off-peak";
        return <div key={index} className={slotClass}></div>;
    });

    return <div className="tariffForecastContainer">
        <div className="slotsContainer">
            {slots}
        </div>
        <span>{currentTime.toLocaleTimeString('en-GB', { hour12: false })}</span>
    </div>;
}

export default TariffTimeline;