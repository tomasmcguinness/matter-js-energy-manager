import { NodeId } from "@matter/main/types";
import type { NextRequest } from 'next/server'
import { getController } from "../../../../../../matterServer.js";
import { DeviceEnergyManagement } from "@matter/main/clusters";
import { ClusterClientObj } from "@matter/main/protocol";
import Device from "../../../../../device.ts";

export async function POST(req: NextRequest, { params }: any) {

    const { deviceId } = await params;

    const nodeId = NodeId(deviceId);

    let node = await (await getController()).getNode(nodeId);

    const devices = node.getDevices();

    var device: Device = { id: deviceId };

    if (devices[1] && devices[1].number === 2) {

        const deviceEnergyManagement: ClusterClientObj<DeviceEnergyManagement.Complete> | undefined = devices[1].getClusterClient(DeviceEnergyManagement.Complete);

        if (deviceEnergyManagement !== undefined) {
            await deviceEnergyManagement.startTimeAdjustRequest({
                requestedStartTime: 1753335036, 
                cause: DeviceEnergyManagement.AdjustmentCause.LocalOptimization
            });
        }
    }

    return Response.json({});
}