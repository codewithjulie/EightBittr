import { IChangeLinr } from "changelinr/lib/IChangeLinr";
import { IStringFilr } from "stringfilr/lib/IStringFilr";

import { SpriteMultiple } from "./SpriteMultiple";
import { SpriteSingle } from "./SpriteSingle";

/**
 * A single [red, green, blue, alpha] pixel's colors.
 */
export type IPixel = [number, number, number, number];

/**
 * A palette of potential pixel colors.
 */
export type IPalette = IPixel[];

/**
 * Raw sprite data for a library.
 */
export interface ILibraryRaws {
    [i: string]: ILibraryRaws | string | any[];
}

/**
 * A base container for storing raw sprites and their renders.
 */
export interface ILibrary {
    /**
     * The original sources for the sprites.
     */
    readonly raws: ILibraryRaws;

    /**
     * Rendered sprites from the raw sources.
     */
    readonly sprites: IRenderLibrary;
}

/**
 * Rendered sprite data generated from a source sprite.
 */
export interface IRender {
    /**
     * The original raw command that generated this render.
     */
    source: ICommand;

    /**
     * Output sprites generated by the source.
     */
    sprites: IRenderSprites;

    /**
     * An optional filter to change colors by, if source is a "filter" command.
     */
    filter?: IFilterAttributes;

    /**
     * Any containers storing this IRender.
     */
    containers: IRenderContainerListing[];
}

/**
 * Generated sprites stored within an IRender.
 */
export interface IRenderSprites {
    [i: string]: SpriteSingle | SpriteMultiple;
}

/**
 * References to contains that store an IRender.
 */
export interface IRenderContainerListing {
    /**
     * A container storing the listing's IRender.
     */
    container: IRenderLibrary;

    /**
     * The key under which the IRender is stored.
     */
    key: string;
}

/**
 * A searchable storage tree of IRenders.
 */
export interface IRenderLibrary {
    [i: string]: IRenderLibrary | IRender;
}

/**
 * Information for expanding a sprite, such as a PixelDrawr's IThing.
 */
export interface ISpriteAttributes {
    filter?: IFilter;
    [i: string]: number | IFilter | undefined;
}

/**
 * A raw sprite, as either the pixel String or Array of commands.
 */
export type ICommand = string | any[];

/**
 * A "filter" command, as ["filter", [source path], "<filter name>"].
 */
export type IFilterCommand = [string, string[], string];

/**
 * A "multiple" command, as ["multiple", "<direction>", <sprites>].
 */
export type IMultipleCommand = [string, string, ISpriteMultipleSettings];

/**
 * A "same" command, as ["same", [source path]].
 */
export type ISameCommand = [string, string[]];

export interface IFilter {
    0: string;
    1: {
        [i: string]: string;
    };
}

export interface IFilterContainer {
    [i: string]: IFilter;
}

export interface IFilterAttributes {
    filter: IFilter;
}

/**
 * Raw settings to generate an ISpriteMultiple.
 */
export interface ISpriteMultipleSettings {
    /**
     * Raw sprite component for the top section.
     */
    top?: string;

    /**
     * How many pixels tall the top section is, if it exists.
     */
    topheight?: number;

    /**
     * Raw sprite component for the right section.
     */
    right?: string;

    /**
     * How many pixels wide the right section is, if it exists.
     */
    rightwidth?: number;

    /**
     * Raw sprite component for the bottom section.
     */
    bottom?: string;

    /**
     * How many pixels tall the bottom section is, if it exists.
     */
    bottomheight?: number;

    /**
     * Raw sprite component for the left section.
     */
    left?: string;

    /**
     * How many pixels wide the left section is, if it exists.
     */
    leftwidth?: number;

    /**
     * Raw sprite component for the center section.
     */
    middle?: string;

    /**
     * Whether the center section should stretch to fill its space.
     */
    middleStretch?: boolean;
}

/**
 * Storage for an ISpriteMultiple's generated sprites.
 */
export interface ISpriteSingles {
    [i: string]: SpriteSingle;
}

/**
 * Generates a sprite from a render.
 * 
 * @param render   The source render.
 * @param key   Key for the sprite.
 * @param attributes   Any attributes to pass to a sprite generator.
 * @returns The generated sprite from the render.
 */
export interface IGeneralSpriteGenerator {
    (render: IRender, key: string, attributes: any): SpriteSingle | SpriteMultiple;
}

/**
 * Settings to initialize a new IPixelRendr.
 */
export interface IPixelRendrSettings {
    /**
     * The default palette of colors to use for sprites.
     */
    paletteDefault?: IPalette;

    /**
     * A nested library of sprites to process.
     */
    library?: any;

    /**
     * Filters that may be used by sprites in the library.
     */
    filters?: IFilterContainer;

    /**
     * An amount to expand sprites by when processing (by default, 1 for not at
     * all).
     */
    scale?: number;

    /**
     * What sub-class in decode keys should indicate a sprite is to be flipped
     * vertically (by default, "flip-vert").
     */
    flipVert?: string;

    /**
     * What sub-class in decode keys should indicate a sprite is to be flipped
     * horizontally (by default, "flip-vert").
     */
    flipHoriz?: string;

    /**
     * What key in attributions should contain sprite widths (by default, 
     * "spriteWidth").
     */
    spriteWidth?: string;

    /**
     *  What key in attributions should contain sprite heights (by default, 
     * "spriteHeight").
     */
    spriteHeight?: string;
}

/**
 * Compresses images into text blobs in real time with fast cached lookups.
 */
export interface IPixelRendr {
    /**
     * @returns The default colors used for palettes in sprites.
     */
    getPaletteDefault(): IPalette;

    /**
     * @returns The base container for storing sprite information.
     */
    getLibrary(): ILibrary;

    /**
     * @returns The filed library of sprite information.
     */
    getBaseLibrary(): any;

    /**
     * @returns The amount to expand sprites by when processing.
     */
    getScale(): number;

    /**
     * @returns The StringFilr interface on top of the base library.
     */
    getBaseFiler(): IStringFilr<any>;

    /**
     * @returns The processor that turns raw strings into partial sprites.
     */
    getProcessorBase(): IChangeLinr;

    /**
     * @returns The processor that converts partial sprites and repeats rows.
     */
    getProcessorDims(): IChangeLinr;

    /**
     * Resets the nested library of sprite sources.
     * 
     * @param library   A new nested library of sprites.
     */
    resetLibrary(library?: any): void;

    /**
     * Resets an individual rendered sprite.
     * 
     * @param key   The key of the sprite to render.
     */
    resetRender(key: string): void;

    /**
     * Replaces the current palette with a new one.
     * 
     * @param palette   The new palette to replace the current one.
     */
    changePalette(palette: IPalette): void;

    /**
     * Standard render function. Given a key, this finds the raw information via
     * BaseFiler and processes it using ProcessorDims. Attributes are needed so
     * the ProcessorDims can stretch it on width and height.
     * 
     * @param key   The general key for the sprite.
     * @param attributes   Additional attributes for the sprite; width and height 
     *                     Numbers are required.
     * @returns A sprite for the given key and attributes.
     */
    decode(key: string, attributes: any): SpriteSingle | SpriteMultiple;

    /**
     * Copies a slice from one Uint8ClampedArray or number[] to another.
     * 
     * @param source   An Array-like source to copy from.
     * @param destination   An Array-like destination to copy to.
     * @param readloc   Where to start reading from in the source.
     * @param writeloc   Where to start writing to in the source.
     * @param writelength   How many members to copy over.
     * @see http://www.html5rocks.com/en/tutorials/webgl/typed_arrays/
     * @see http://www.javascripture.com/Uint8ClampedArray
     */
    memcpyU8(
        source: Uint8ClampedArray | number[],
        destination: Uint8ClampedArray | number[],
        readloc?: number,
        writeloc?: number,
        writelength?: number): void;
}
