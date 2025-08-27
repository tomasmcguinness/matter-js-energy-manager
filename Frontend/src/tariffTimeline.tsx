'use client'

type TariffTimelineProps = {
    prices: any[];
    currentTime: Date;
};

const TariffTimeline = ({ prices, currentTime }: TariffTimelineProps) => {

     if (prices == null || prices.length == 0) {
        return <div className="alert alert-info" style={{ marginBottom: '0' }}>No Tariff Data Available</div>;
    }

    let slots = prices.map((tariffSlot: any, index) => {
        let slotClass = tariffSlot.type == "peak" ? "slot peak" : "slot off-peak";
        let width = tariffSlot.duration * 0.03;
        return <div key={index} className={slotClass} style={{width: width}}>{tariffSlot.price}p {new Date(tariffSlot.startDate).toLocaleTimeString('en-GB', { hour12: false })}</div>;
    });

    const computeOffset = (startTime: number) => {
        let startTimeInMilli = startTime * 1000;

        let differenceInMilli = startTimeInMilli - currentTime!.getTime();

        let differenceInSeconds = Math.round(differenceInMilli / 1000);

        return `${differenceInSeconds * 0.03}px`;
    }

    return <div className="tariffForecastContainer">
        <div className="slotsContainer" style={{ left: computeOffset(prices[0].startTime) }}>
            {slots}
        </div>
        <span>{currentTime.toLocaleTimeString('en-GB', { hour12: false })}</span>
    </div>;
}

export default TariffTimeline;