export function getEnergyManager() {
    return globalThis.energyManager;
}

export const initializeEnergyManager = async () => {

    console.log('initializeEnergyManager()');

    if (!globalThis.energyManager) {
        console.log("Initializing Energy Manager...");

        globalThis.energyManager = function() {

            this.processForecast = (nodeId, forecast) => {
                console.log(`Processing a forecast for ${nodeId.toString()}`);
            }

        };
    }

    return globalThis.energyManager;
}