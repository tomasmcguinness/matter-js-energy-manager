import { FormaldehydeConcentrationMeasurement } from "@matter/main/model"
import { NodeStates, PairedNode } from "@project-chip/matter.js/device"

export type Slot = {
    nominalPower: number,
    duration: number
}

export type Forecast = {
    startTime: number,
    endTime: number,
    slots: Slot[]
}

type Device = {
    id: string,
    state?: NodeStates,
    manufacturer?: string,
    forecast?: Forecast
}

export default Device;