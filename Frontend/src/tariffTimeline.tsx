type TariffTimelineProps = {
    prices: number[];
};

const TariffTimeline = ({ prices }: TariffTimelineProps) => {

    const start = Date.now();

    let slots = prices.map((p, index) => {
        // TODO Better way to determine peak/off-peak!
        let slotClass = p == 28 ? "slot peak" : "slot off-peak";
        return <div key={index} className={slotClass}>{p}p</div>;
    });

    return <div className="energyForecastContainer">
        <div className="slotsContainer">
            {slots}
        </div>
    </div>;
}

export default TariffTimeline;