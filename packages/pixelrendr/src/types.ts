import { SpriteMultiple } from "./SpriteMultiple";
import { SpriteSingle } from "./SpriteSingle";

/**
 * A single [red, green, blue, alpha] pixel's colors.
 */
export type Pixel = [number, number, number, number];

/**
 * A palette of potential pixel colors.
 */
export type Palette = Pixel[];

/**
 * Raw sprite data for a library.
 */
export interface LibraryRaws {
    [i: string]: LibraryRaws | string | [string, FilterAttributes];
}

/**
 * A base container for storing raw sprites and their renders.
 */
export interface LibraryLike {
    /**
     * The original sources for the sprites.
     */
    readonly raws: LibraryRaws;

    /**
     * Rendered sprites from the raw sources.
     */
    readonly sprites: RenderLibrary;
}

/**
 * Rendered sprite data generated from a source sprite.
 */
export interface RenderLike {
    /**
     * The original raw command that generated this render.
     */
    source: Command;

    /**
     * Output sprites generated by the source.
     */
    sprites: RenderSprites;

    /**
     * An optional filter to change colors by, if source is a "filter" command.
     */
    filter?: FilterAttributes;

    /**
     * Any containers storing this IRender.
     */
    containers: RenderContainerListing[];
}

/**
 * Generated sprites stored within an IRender.
 */
export type RenderSprites = Record<string, SpriteSingle | SpriteMultiple>;

/**
 * References to contains that store an IRender.
 */
export interface RenderContainerListing {
    /**
     * A container storing the listing's IRender.
     */
    container: RenderLibrary;

    /**
     * The key under which the IRender is stored.
     */
    key: string;
}

/**
 * A searchable storage tree of IRenders.
 */
export interface RenderLibrary {
    [i: string]: RenderLibrary | RenderLike;
}

/**
 * Information for expanding a sprite, such as a PixelDrawr Actor.
 */
export interface SpriteAttributes {
    spriteHeight?: number;
    spriteWidth?: number;
    filter?: Filter;
}

/**
 * A raw sprite, as either the pixel String or Array of commands.
 */
export type Command = string | any[];

/**
 * A "filter" command, as ["filter", [source path], "<filter name>"].
 */
export type FilterCommand = [string, string[], string];

/**
 * A "multiple" command, as ["multiple", "<direction>", <sprites>].
 */
export type MultipleCommand = [string, string, SpriteMultipleSettings];

/**
 * A "same" command, as ["same", [source path]].
 */
export type SameCommand = [string, string[]];

export interface Filter {
    0: string;
    1: Record<string, string>;
}

export type FilterContainer = Record<string, Filter>;

export interface FilterAttributes {
    filter: Filter;
}

/**
 * A transformation Function to apply to input.
 *
 * @param data   The raw input data to be transformed.
 * @param key   They key under which the data is to be stored.
 * @param attributes   Any extra attributes to be given to the transforms.
 * @returns The input data, transformed.
 */
export type Transform<Data, Output = Data> = (data: Data, key: string, attributes: any) => Output;

/**
 * Raw settings to generate an ISpriteMultiple.
 */
export interface SpriteMultipleSettings {
    /**
     * Raw sprite component for the top section.
     */
    top?: string;

    /**
     * How many pixels tall the top section is, if it exists.
     */
    topHeight?: number;

    /**
     * Raw sprite component for the right section.
     */
    right?: string;

    /**
     * How many pixels wide the right section is, if it exists.
     */
    rightWidth?: number;

    /**
     * Raw sprite component for the bottom section.
     */
    bottom?: string;

    /**
     * How many pixels tall the bottom section is, if it exists.
     */
    bottomHeight?: number;

    /**
     * Raw sprite component for the left section.
     */
    left?: string;

    /**
     * How many pixels wide the left section is, if it exists.
     */
    leftWidth?: number;

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
export type SpriteSingles = Record<string, SpriteSingle>;

/**
 * Generates a sprite from a render.
 *
 * @param render   The source render.
 * @param key   Key for the sprite.
 * @param attributes   Any attributes to pass to a sprite generator.
 * @returns The generated sprite from the render.
 */
export type GeneralSpriteGenerator = (
    render: RenderLike,
    key: string,
    attributes: any
) => SpriteSingle | SpriteMultiple;

/**
 * Settings to initialize a new IPixelRendr.
 */
export interface PixelRendrSettings {
    /**
     * The default palette of colors to use for sprites.
     */
    paletteDefault?: Palette;

    /**
     * A nested library of sprites to process.
     */
    library?: LibraryRaws;

    /**
     * Filters that may be used by sprites in the library.
     */
    filters?: FilterContainer;

    /**
     * An amount to expand sprites by when processing (by default, 1 for not at
     * all).
     */
    scale?: number;

    /**
     * What sub-class in decode keys should indicate a sprite is to be flipped
     * vertically (by default, "flip-vert").
     */
    flipVertical?: string;

    /**
     * What sub-class in decode keys should indicate a sprite is to be flipped
     * horizontally (by default, "flip-vert").
     */
    flipHorizontal?: string;

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