import { NodeId } from "@matter/main/types";
import type { NextRequest } from 'next/server'
import { getController } from "../../../../../matterServer.js";
import { DeviceEnergyManagement } from "@matter/main/clusters";
import { ClusterClientObj } from "@matter/main/protocol";
import Device, { Slot } from "../../../../device.ts";

export async function GET(req: NextRequest, { params }: any) {

    const { deviceId } = await params;

    const nodeId = NodeId(deviceId);

    let node = await (await getController()).getNode(nodeId);

    const devices = node.getDevices();
    console.log({ devices });

    var device : Device = { id: deviceId, state: node.state.toString(), manufacturer: node.basicInformation?.manufacturerName?.toString() };

    //node.logStructure();

    // const descriptor = node.getRootClusterClient(DescriptorCluster);

    // if (descriptor !== undefined) {

    //     console.log(await descriptor.getDeviceTypeListAttribute());
    //     console.log(await descriptor.attributes.deviceTypeList.get()); // you can call that way
    //     console.log(await descriptor.getServerListAttribute()); // or more convenient that way
    // } else {
    //     console.log("No Descriptor Cluster found. This should never happen!");
    // }

    //let data = attributes.map(a => { a.path });

    // TODO Store this forecast in a service against the device. It will be upated
    // via the subscriptions.
    //
    if (devices[1] && devices[1].number === 2) {

        const deviceEnergyManagement: ClusterClientObj<DeviceEnergyManagement.Complete> | undefined = devices[1].getClusterClient(DeviceEnergyManagement.Complete);

        if (deviceEnergyManagement !== undefined) {

            let forecast = await deviceEnergyManagement.getForecastAttribute();
            console.log("Forecast");
            console.log("---------------------------------------");

            if(forecast) {

                device.forecast = {
                    startTime: forecast!.startTime,
                    endTime: forecast!.endTime,
                    slots: forecast!.slots.map<Slot>(s => <Slot>{ nominalPower: s.nominalPower }  )
                }

                if(forecast.slots) {
                    console.log(forecast!.slots[0]);
                } else {
                    console.log("No slots in forecast");
                }
            } else {
                console.log("No forecast available");
            }

            console.log("---------------------------------------");
        }
    }

    return Response.json(device);
}

export async function DELETE(req: NextRequest, { params }: any) {

    const { deviceId } = await params;

    const nodeId = NodeId(deviceId);

    let node = await (await getController()).getNode(nodeId);

    await node.decommission();

    return;
}