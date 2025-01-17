{{ #shenanigans.game }}
import { GameWindow } from "eightbittr";
import { AbsoluteSizeSchema, UserWrapprSettings, OptionType } from "userwrappr";

import { {{ shenanigans.name }} } from "../{{ shenanigans.name }}";

/**
 * Global scope around a game, such as a DOM window.
 */
export interface WrappingGameWindow extends GameWindow {
    /**
     * Game instance, once this has created it.
     */
    {{ shorthand }}?: {{ shenanigans.name }};
}

export interface InterfaceSettingOverrides {
    createGame?(size: AbsoluteSizeSchema): {{ shenanigans.name }};
    gameWindow?: WrappingGameWindow;
}

/**
 * Friendly name of the default game size.
 */
const defaultSize = "Full";

/**
 * Sizes the game is allowed to be, keyed by friendly name.
 */
const sizes = {
    [defaultSize]: {
        width: "100%",
        height: "100%",
    },
};

/**
 * Creates settings for an UserWrappr that will create and wrap a {{ shenanigans.name }} instance.
 *
 * @param gameWindow   Global scope around the game interface, if not the global window.
 */
export const createUserWrapprSettings = ({
    createGame = (size: AbsoluteSizeSchema) => new {{ shenanigans.name }}(size),
    gameWindow = window,
}: InterfaceSettingOverrides = {}): UserWrapprSettings => {
    /**
     * Game instance, once this has created it.
     */
    let game: {{ shenanigans.name }};

    return {
        defaultSize: sizes[defaultSize],
        createContents: (size: AbsoluteSizeSchema) => {
            gameWindow.{{ shorthand }} = game = createGame(size);
            game.inputs.initializeGlobalPipes(gameWindow);
            game.frameTicker.play();

            return game.container;
        },
        menus: [
            {
                options: [
                    {
                        action: (): void => {
                            game.utilities.takeScreenshot(`{{ shenanigans.name }} ${Date.now()}`);
                        },
                        title: "Screenshot",
                        type: OptionType.Action,
                    },
                    {
                        getInitialValue: (): string => "1x",
                        options: [".25x", ".5x", "1x", "2x", "5x", "10x", "20x"],
                        saveValue: (value: string): void => {
                            const multiplier = parseFloat(value.replace("x", ""));
                            game.frameTicker.setInterval((1000 / 60) / multiplier);
                            game.pixelDrawer.setFramerateSkip(multiplier);
                        },
                        title: "Speed",
                        type: OptionType.Select,
                    },
                ],
                title: "Options",
            },
        ],
        styles: {
            input: {
                fontFamily: "Press Start",
                minWidth: "117px",
                padding: "3px",
            },
            inputButton: {
                background: "#ffcc33",
                fontFamily: "Press Start",
                padding: "7px 3px",
            },
            inputButtonAction: {
                padding: "11px 3px",
                width: "100%",
            },
            inputButtonBoolean: {
                padding: "7px 21px",
            },
            inputButtonOff: {
                background: "#ccaa33",
            },
            inputSelect: {
                minWidth: "35px",
                padding: "3px 0",
            },
            option: {
                alignItems: "center",
                margin: "auto",
                padding: "7px 0",
                maxWidth: "calc(100% - 14px)",
            },
            options: {
                left: "4px",
                right: "4px",
                width: "auto",
                padding: "4px 3px 21px",
                boxShadow: [
                    "0 3px 7px black inset",
                    "0 0 0 4px #99ccff",
                    "0 0 14px black",
                ].join(", "),
                background: "#005599",
            },
            optionsList: {
                marginBottom: "7px",
            },
            menu: {
                maxWidth: "385px",
                minWidth: "280px",
                padding: "7px",
            },
            menusInnerArea: {
                background: "black",
                color: "white",
                fontFamily: "Press Start",
                transition: "700ms color",
            },
            menuTitle: {
                fontSize: "16px",
            },
            menuTitleButton: {
                alignItems: "center",
                background: "none",
                border: "none",
                color: "white",
                display: "flex",
                fontFamily: "Press Start",
                fontSize: "16px",
                justifyContent: "center",
            },
            menuTitleButtonFake: {
                color: "grey",
            }
        },
    };
};
{{ /shenanigans.game }}
