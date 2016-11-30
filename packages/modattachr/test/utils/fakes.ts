import { IModAttachr, IModAttachrSettings } from "../../src/IModAttachr";
import { ModAttachr } from "../../src/ModAttachr";

/**
 * @param settings   Settings for the ModAttachr.
 * @returns An ModAttachr instance.
 */
export function mockModAttachr(settings?: IModAttachrSettings): IModAttachr {
    return new ModAttachr(settings);
}
