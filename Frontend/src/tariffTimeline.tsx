'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';

type TariffTimelineProps = {
    prices: any[];
};

function formatXAxis(tickItem) {
    var date = new Date(tickItem);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

const TariffTimeline = ({ prices }: TariffTimelineProps) => {

    if (prices == null || prices.length == 0) {
        return <div className="alert alert-info" style={{ marginBottom: '0' }}>No Tariff Data Available</div>;
    }

    return <LineChart style={{ width: '100%', height: '100%', maxHeight: '30vh', aspectRatio: 1.618 }} responsive data={prices}    >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="startDate" tickFormatter={formatXAxis} />
        <YAxis width="auto" />
        <Tooltip />
        <Legend />
        <Line type="stepAfter" dataKey="price" stroke="#8884d8" activeDot={{ r: 8 }} />
        <ReferenceLine strokeDasharray="3 3" x={new Date().getTime()/1000} stroke="red" />
    </LineChart>;
}

export default TariffTimeline;