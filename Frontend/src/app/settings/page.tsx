'use client'

import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';

export default function Page() {

    const [sources, setSources] = useState<any[]>([]);
    const [tariffSource, setTariffSource] = useState<string | undefined>(undefined);

    useEffect(() => {
        fetch('http://localhost:4000/sources').then(r => r.json()).then(data => { setSources(data); });
        fetch('http://localhost:4000/settings').then(r => r.json()).then(data => { setTariffSource(`${data.tariffSourceNodeId}|${data.tariffSourceEndpointId}`); });
    }, []);

    const saveSettings = () => {

        var tariffSourceNodeId = tariffSource!.split('|')[0];
        var tariffSourceEndpointId = parseInt(tariffSource!.split('|')[1]);

        var object: any = {
            tariffSourceNodeId,
            tariffSourceEndpointId
        };
        var json = JSON.stringify(object);

        fetch(`http://localhost:4000/settings`, { method: "PUT", headers: { 'Content-Type': 'application/json' }, body: json }).then(r => {
            if(r.ok) {
                alert("Settings updated!");
            } else {
                alert("Failed to update Settings. Please try again!");
            }
        });
    }

    const tariffOptions = sources.filter((s: any) => s.source == "tariff").map((s: any, index: number) => {
        return <option key={index} value={`${s.nodeId}|${s.endpointId}`}>{s.nodeId} - {s.endpointId} - {s.vendorName} - {s.productName}</option>
    });

    return <Container>
        <div>
            <h1>Settings</h1>
            <hr />
            <div className="card" style={{ marginBottom: '10px' }}>
                <div className="card-header">
                    Tariff
                </div>
                <div className="card-body">
                    <label htmlFor="tariffSource" className="form-label">The source of tariff information</label>
                    <select id="tariffSource" className="form-select" value={tariffSource || 'none'} onChange={(e) => setTariffSource(e.target.value)}>
                        <option value="0|0">None</option>
                        {tariffOptions}
                    </select>
                </div>
            </div>
            <button className="btn btn-primary" onClick={saveSettings}>Save Settings</button>
        </div>
    </Container>;
}