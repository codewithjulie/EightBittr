import { GameStartr } from "./GameStartr";
import { IThing } from "./IGameStartr";

export const stubHeight = 480;

export const stubWidth = 320;

export const stubGameStartr = () =>
    new GameStartr({
        height: stubHeight,
        width: stubWidth,
    });

/**
 *
 */
export const stubThing = (): IThing => ({
    alive: true,
    bottom: 28,
    changed: true,
    className: "Stub solid",
    cycles: {},
    groupType: "solid",
    height: 14,
    hidden: false,
    id: "",
    left: 35,
    maxquads: 1,
    numQuadrants: 0,
    opacity: 1,
    quadrants: [],
    right: 42,
    spriteheight: 1,
    spritewidth: 1,
    title: "Stub",
    top: 14,
    width: 7,
    xvel: 0,
    yvel: 0,
});
