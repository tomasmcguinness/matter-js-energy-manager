const TariffTimeline = () => {

    const start = Date.now();

    let prices = [28,28,7.5,7.5,7.5,7.5,7.5,28];

    let slots = prices.map((p,index) => { 
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