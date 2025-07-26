import { FormaldehydeConcentrationMeasurement } from "@matter/main/model"

export type Slot = {
    nominalPower: number
}

export type Forecast = {
    startTime: number,
    endTime: number,
    slots: Slot[]
}

type Device = {
    id: string,
    forecast?: Forecast
}

export default Device;