/* This file was auto-generated by shenanigans-manager */

import { IMapRaw } from "../src/components/maps";
import { stubGameForMapsTest } from "./fakes.test";

const describeLocation = (map: IMapRaw, locationName: string) => {
    it(locationName, (): void => {
        const game = stubGameForMapsTest();

        game.maps.setMap(map.name, locationName);
    });
};

const describeMap = (map: IMapRaw): void => {
    describe(map.name, (): void => {
        for (const i in map.locations) {
            describeLocation(map, i);
        }
    });
};

describe("Maps", (): void => {
    const game = stubGameForMapsTest();
    const mapsRaw = game.mapsCreator.getMapsRaw();

    for (const mapName in mapsRaw) {
        if ({}.hasOwnProperty.call(mapsRaw, mapName)) {
            describeMap(mapsRaw[mapName] as IMapRaw);
        }
    }
});
