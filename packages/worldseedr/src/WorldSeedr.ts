import { SpacingCalculator } from "./SpacingCalculator";
import {
    ArgumentPossibility,
    Choice,
    Command,
    Direction,
    DirectionsMap,
    OnPlacement,
    PercentageOption,
    Position,
    Possibility,
    PossibilityChild,
    PossibilityContainer,
    PossibilityContents,
    PossibilitySpacingOption,
    RandomNumberGenerator,
    Spacing,
    WorldSeedrSettings,
} from "./types";

/**
 * A constant listing of direction opposites, like top-bottom.
 */
const directionOpposites: DirectionsMap = {
    bottom: "top",
    left: "right",
    right: "left",
    top: "bottom",
};

/**
 * A constant listing of what direction the sides of areas correspond to.
 */
const directionSizing: DirectionsMap = {
    bottom: "height",
    left: "width",
    right: "width",
    top: "height",
};

/**
 * A constant Array of direction names.
 */
const directionNames: string[] = ["top", "right", "bottom", "left"];

/**
 * A constant Array of the dimension descriptors.
 */
const sizingNames: string[] = ["width", "height"];

/**
 * Automates random, recursive generation of possibilities from JSON schemas.
 */
export class WorldSeedr {
    /**
     * A listing of possibility schemas, keyed by title.
     */
    private possibilities: PossibilityContainer;

    /**
     * Function used to generate a random number
     */
    private readonly random: RandomNumberGenerator;

    /**
     * Function called in generateFull to place a command.
     */
    private onPlacement: OnPlacement;

    /**
     * Scratch Array of PreActors to be added to during generation.
     */
    private generatedCommands: Command[];

    /**
     * Utility to generate spacing distances based on possibility schemas.
     */
    private readonly spacingCalculator: SpacingCalculator;

    /**
     * Initializes a new instance of the WorldSeedr class.
     *
     * @param settings   Settings to be used for initialization.
     */
    public constructor(settings: WorldSeedrSettings) {
        this.possibilities = settings.possibilities ?? {};
        this.random = settings.random ?? (() => Math.random());
        this.onPlacement = settings.onPlacement;

        this.spacingCalculator = new SpacingCalculator(
            (min: number, max: number) => this.randomBetween(min, max),
            (choices: PossibilitySpacingOption[]): PossibilitySpacingOption =>
                this.chooseAmong(choices)!
        );

        this.clearGeneratedCommands();
    }

    /**
     * @returns The listing of possibilities that may be generated.
     */
    public getPossibilities(): PossibilityContainer {
        return this.possibilities;
    }

    /**
     * @param possibilitiesNew   A new Object to list possibilities
     *                           that may be generated.
     */
    public setPossibilities(possibilities: PossibilityContainer) {
        this.possibilities = possibilities;
    }

    /**
     * @returns Callback for runGeneratedCommands to place "known" children.
     */
    public getOnPlacement(): OnPlacement {
        return this.onPlacement;
    }

    /**
     * @param onPlacementNew   A new Function to be used as onPlacement.
     */
    public setOnPlacement(onPlacement: OnPlacement) {
        this.onPlacement = onPlacement;
    }

    /**
     * Resets the generatedCommands Array so runGeneratedCommands can start.
     */
    public clearGeneratedCommands() {
        this.generatedCommands = [];
    }

    /**
     * Runs the onPlacement callback on the generatedCommands Array.
     */
    public runGeneratedCommands() {
        this.onPlacement(this.generatedCommands);
    }

    /**
     * Generates a collection of randomly chosen possibilities based on the
     * given schema mapping. These does not recursively parse the output; do
     * do that, use generateFull.
     *
     * @param name   The name of the possibility schema to start from.
     * @param position   An Object that contains .left, .right, .top,
     *                   and .bottom.
     * @returns An Object containing a position within the given
     *          position and some number of children.
     */
    public generate(name: string, command: Position | Command) {
        const schema = this.possibilities[name];

        return this.generateChildren(schema, command);
    }

    /**
     * Recursively generates a schema. The schema's title and itself are given
     * to this.generate; all outputs of type "Known" are added to the
     * generatedCommands Array, while everything else is recursed upon.
     *
     * @param schema   A simple Object with basic information on the
     *                 chosen possibility.
     * @returns An Object containing a position within the given
     *          position and some number of children.
     */
    public generateFull(schema: Command) {
        const generated: Choice | undefined = this.generate(schema.title, schema);
        if (!generated || !generated.children) {
            return;
        }

        for (const child of generated.children) {
            switch (child.type) {
                case "Known":
                    this.generatedCommands.push(child);
                    break;
                case "Random":
                    this.generateFull(child);
                    break;
                default:
                    throw new Error("Unknown child type: " + child.type);
            }
        }
    }

    /**
     * Generates the children for a given schema, position, and direction. This
     * is the real hardcore function called by this.generate, which calls the
     * different subroutines based on whether the contents are in "Certain" or
     * "Random" mode.
     *
     * @param schema   A simple Object with basic information on the
     *                 chosen possibility.
     * @param position   The bounding box for where the children may
     *                   be generated.
     * @param direction   A String direction to check the position by
     *                    as a default if contents.direction isn't
     *                    provided.
     * @returns An Object containing a position within the given
     *          position and some number of children.
     */
    private generateChildren(
        schema: Possibility,
        position: Position,
        direction = schema.contents.direction!
    ) {
        const contents = schema.contents;
        const spacing = contents.spacing ?? 0;
        const objectMerged = { ...position, ...schema };
        let children: Choice[] | undefined;

        switch (contents.mode) {
            case "Random":
                children = this.generateRandom(contents, objectMerged, direction, spacing);
                break;
            case "Certain":
                children = this.generateCertain(contents, objectMerged, direction, spacing);
                break;
            case "Repeat":
                children = this.generateRepeat(contents, objectMerged, direction, spacing);
                break;
            case "Multiple":
                children = this.generateMultiple(contents, objectMerged, direction, spacing);
                break;
            default:
                throw new Error("Unknown contents mode: " + contents.mode);
        }

        return this.wrapChoicePositionExtremes(children);
    }

    /**
     * Generates a schema's children that are known to follow a set listing of
     * sub-schemas.
     *
     * @param contents   The known possibilities to choose between.
     * @param position   The bounding box for where the children may be
     *                   generated.
     * @param direction   A String direction to check the position by.
     * @param spacing   How much space there should be between each child.
     * @returns An Object containing a position within the given position
     *          and some number of children.
     */
    private generateCertain(
        contents: PossibilityContents,
        position: Position,
        direction: Direction,
        spacing: Spacing
    ) {
        return contents.children.map((choice: PossibilityChild): Choice => {
            if (choice.type === "Final") {
                return this.parseChoiceFinal(choice, position);
            }

            const output = this.parseChoice(choice, position, direction);

            if (output.type !== "Known") {
                output.contents = this.generate(output.title, position);
            }

            this.shrinkPositionByChild(position, output, direction, spacing);

            return output;
        });
    }

    /**
     * Generates a schema's children that are known to follow a set listing of
     * sub-schemas, repeated until there is no space left.
     *
     * @param contents   The known possibilities to choose between.
     * @param position   The bounding box for where the children may be
     *                   generated.
     * @param direction   A String direction to check the position by.
     * @param spacing   How much space there should be between each child.
     * @returns An Object containing a position within the given position
     *          and some number of children.
     */
    private generateRepeat(
        contents: PossibilityContents,
        position: Position,
        direction: Direction,
        spacing: Spacing
    ) {
        const choices: PossibilityChild[] = contents.children;
        const children: Choice[] = [];
        let i = 0;

        // Continuously loops through the choices and adds them to the output
        // Children, so long as there's still room for them
        while (this.positionIsNotEmpty(position, direction)) {
            const choice: PossibilityChild = choices[i];
            let child: Choice | undefined;

            if (choice.type === "Final") {
                child = this.parseChoiceFinal(choice, position);
            } else {
                child = this.parseChoice(choice, position, direction);

                if (child.type !== "Known") {
                    child.contents = this.generate(child.title, position);
                }
            }

            if (this.choiceFitsPosition(child, position)) {
                this.shrinkPositionByChild(position, child, direction, spacing);
                children.push(child);
            } else {
                break;
            }

            i += 1;
            if (i >= choices.length) {
                i = 0;
            }
        }

        return children;
    }

    /**
     * Generates a schema's children that are known to be randomly chosen from a
     * list of possibilities until there is no more room.
     *
     * @param contents   The Array of known possibilities, with probability
     *                   percentages.
     * @param position   An Object that contains .left, .right, .top,
     *                   and .bottom.
     * @param direction   A String direction to check the position by.
     * @param spacing   How much space there should be between each child.
     * @returns An Object containing a position within the given position
     *          and some number of children.
     */
    private generateRandom(
        contents: PossibilityContents,
        position: Position,
        direction: Direction,
        spacing: Spacing
    ): Choice[] | undefined {
        const children: Choice[] = [];

        // Continuously add random choices to the output children as long as
        // There's room in the position's bounding box
        while (this.positionIsNotEmpty(position, direction)) {
            const child: Choice | undefined = this.generateChild(contents, position, direction);
            if (!child) {
                break;
            }

            this.shrinkPositionByChild(position, child, direction, spacing);
            children.push(child);

            if (contents.limit && children.length > contents.limit) {
                return undefined;
            }
        }

        return children;
    }

    /**
     * Generates a schema's children that are all to be placed within the same
     * position. If a direction is provided, each subsequent one is shifted in
     * that direction by spacing.
     *
     * @param contents   The Array of known possibilities, with probability
     *                   percentages.
     * @param position   An Object that contains .left, .right, .top,
     *                   and .bottom.
     * @param direction   A String direction to check the position by.
     * @param spacing   How much space there should be between each child.
     * @returns An Object containing a position within the given position
     *          and some number of children.
     */
    private generateMultiple(
        contents: PossibilityContents,
        position: Position,
        direction: Direction,
        spacing: Spacing
    ) {
        return contents.children.map((choice) => {
            const output = this.parseChoice(choice, { ...position }, direction);

            this.movePositionBySpacing(position, direction, spacing);

            return output;
        });
    }

    /**
     * Shortcut function to choose a choice from an allowed set of choices, and
     * parse it for positioning and sub-choices.
     *
     * @param contents   Choice Objects, each of which must have a .percentage.
     * @param position   An Object that contains .left, .right, .top, and .bottom.
     * @param direction   A String direction to check the position by.
     * @returns An Object containing the bounding box position of a parsed child,
     *          with the basic schema (.title) info added as well as any optional
     *          .arguments.
     */
    private generateChild(
        contents: PossibilityContents,
        position: Position,
        direction: Direction
    ): Choice | undefined {
        const choice: PossibilityChild | undefined = this.chooseAmongPosition(
            contents.children,
            position
        );

        return choice ? this.parseChoice(choice, position, direction) : undefined;
    }

    /**
     * Creates a parsed version of a choice given the position and direction.
     * This is the function that parses and manipulates the positioning of the
     * new choice.
     *
     * @param choice   The simple definition of the Object chosen from a choices
     *                 Array. It should have at least .title,
     *                          and optionally .sizing or .arguments.
     * @param position   An Object that contains .left, .right, .top, and .bottom.
     * @param direction   A String direction to shrink the position by.
     * @returns An Object containing the bounding box position of a parsed child,
     *          with the basic schema (.title) info added as well as any optional
     *          .arguments.
     */
    private parseChoice(
        choice: PossibilityChild,
        position: Position,
        direction: Direction
    ): Choice {
        const title = choice.title;
        const schema: Possibility = this.possibilities[title];
        const output = {
            arguments:
                choice.arguments instanceof Array
                    ? (this.chooseAmong(choice.arguments) as ArgumentPossibility).values
                    : choice.arguments,
            bottom: 0,
            height: 0,
            left: 0,
            right: 0,
            title,
            top: 0,
            type: choice.type,
            width: 0,
        };

        this.ensureSizingOnChoice(output, choice, schema);
        this.ensureDirectionBoundsOnChoice(output, position);

        (output as any)[direction] =
            (output as any)[(directionOpposites as any)[direction]] +
            (output as any)[(directionSizing as any)[direction]];

        switch (schema.contents.snap) {
            case "top":
                output.bottom = output.top - output.height;
                break;
            case "right":
                output.left = output.right - output.width;
                break;
            case "bottom":
                output.top = output.bottom + output.height;
                break;
            case "left":
                output.right = output.left + output.width;
                break;
        }

        if (choice.stretch) {
            if (!output.arguments) {
                output.arguments = {};
            }

            if (choice.stretch.width) {
                output.left = position.left;
                output.right = position.right;
                output.width = output.right - output.left;
                output.arguments.width = output.width;
            }

            if (choice.stretch.height) {
                output.top = position.top;
                output.bottom = position.bottom;
                output.height = output.top - output.bottom;
                output.arguments.height = output.height;
            }
        }

        return output;
    }

    /**
     * Parses a "Final" choice as a simple Choice of type Known.
     *
     * @param choice   The simple definition of the Object chosen from a choices
     *                 Array. It should have at least .title,
     *                          and optionally .sizing or .arguments.
     * @param position   An Object that contains .left, .right, .top, and .bottom.
     * @param direction   A String direction to shrink the position by.
     * @returns A Known choice with title, arguments, and position information.
     * @todo Investigate whether this is necessary (#7).
     */
    private parseChoiceFinal(choice: PossibilityChild, position: Position): Choice {
        if (!choice.source) {
            throw new Error("Unknown final source choice.");
        }

        const schema: Possibility = this.possibilities[choice.source];

        return {
            arguments: choice.arguments,
            bottom: position.bottom,
            height: schema.height,
            left: position.left,
            right: position.right,
            title: choice.title,
            top: position.top,
            type: "Known",
            width: schema.width,
        };
    }

    /**
     * From an Array of potential choice Objects, returns one chosen at random.
     *
     * @param choice   An Array of objects with .percent.
     * @returns One of the choice Objects, chosen at random.
     */
    private chooseAmong<T extends PercentageOption>(choices: T[]): T | undefined {
        if (!choices.length) {
            return undefined;
        }
        if (choices.length === 1) {
            return choices[0];
        }

        const goal = this.randomPercentage();
        let sum = 0;

        for (const possibility of choices) {
            sum += possibility.percent;
            if (sum >= goal) {
                return possibility;
            }
        }

        return undefined;
    }

    /**
     * From an Array of potential choice Objects, filtered to only include those
     * within a certain size, returns one chosen at random.
     *
     * @param choice   An Array of objects with .width and .height.
     * @param position   An Object that contains .left, .right, .top, and .bottom.
     * @returns A random choice Object that can fit within the position's size.
     * @remarks Functions that use this will have to react to nothing being
     *          chosen. For example, if only 50 percentage is accumulated
     *          among fitting ones but 75 is randomly chosen, something should
     *          still be returned.
     */
    private chooseAmongPosition(
        choices: PossibilityChild[],
        position: Position
    ): PossibilityChild | undefined {
        const width = position.right - position.left;
        const height = position.top - position.bottom;

        return this.chooseAmong(
            choices.filter((choice: PossibilityChild): boolean =>
                this.choiceFitsSize(this.possibilities[choice.title], width, height)
            )
        );
    }

    /**
     * Checks whether a choice can fit within a width and height.
     *
     * @param choice   An Object that contains .width and .height.
     * @param width   A maximum width for the choice.
     * @param height   A maximum height for the choice.
     * @returns Whether the choice fits within the dimensions.
     */
    private choiceFitsSize(choice: Possibility | Choice, width: number, height: number): boolean {
        return choice.width <= width && choice.height <= height;
    }

    /**
     * Checks whether a choice can fit within a position.
     *
     * @param choice   An Object that contains .width and .height.
     * @param position   An Object that contains .left, .right, .top, and .bottom.
     * @returns Whether the choice fits within the position.
     * @remarks When calling multiple times on a position (such as in
     *          chooseAmongPosition), it's more efficient to store the width
     *          and height separately and just use doesChoiceFit.
     */
    private choiceFitsPosition(choice: Possibility | Choice, position: Position): boolean {
        return this.choiceFitsSize(
            choice,
            position.right - position.left,
            position.top - position.bottom
        );
    }

    /**
     * Checks and returns whether a position has open room in a particular
     * direction (horizontally for left/right and vertically for top/bottom).
     *
     * @param position   An Object that contains .left, .right, .top, and .bottom.
     * @param direction   A String direction to check the position in.
     */
    private positionIsNotEmpty(position: Position, direction: Direction): boolean {
        if (direction === "right" || direction === "left") {
            return position.left < position.right;
        }

        return position.top > position.bottom;
    }

    /**
     * Shrinks a position by the size of a child, in a particular direction.
     *
     * @param position   An Object that contains .left, .right, .top, and .bottom.
     * @param child   An Object that contains .left, .right, .top, and .bottom.
     * @param direction   A String direction to shrink the position by.
     * @param spacing   How much space there should be between each child
     *                  (by default, 0).
     */
    private shrinkPositionByChild(
        position: Position,
        child: Choice,
        direction: Direction,
        spacing: Spacing = 0
    ) {
        switch (direction) {
            case "top":
                position.bottom =
                    child.top + this.spacingCalculator.calculateFromSpacing(spacing);
                break;
            case "right":
                position.left =
                    child.right + this.spacingCalculator.calculateFromSpacing(spacing);
                break;
            case "bottom":
                position.top =
                    child.bottom - this.spacingCalculator.calculateFromSpacing(spacing);
                break;
            case "left":
                position.right =
                    child.left - this.spacingCalculator.calculateFromSpacing(spacing);
                break;
        }
    }

    /**
     * Moves a position by its parsed spacing. This is only useful for content
     * of type "Multiple", which are allowed to move themselves via spacing
     * between placements.
     *
     * @param position   An Object that contains .left, .right, .top, and .bottom.
     * @param direction   A String direction to shrink the position by.
     * @param spacing   How much space there should be between each child
     *                  (by default, 0).
     */
    private movePositionBySpacing(
        position: Position,
        direction: Direction,
        spacing: Spacing = 0
    ) {
        const space = this.spacingCalculator.calculateFromSpacing(spacing);

        switch (direction) {
            case "top":
                position.top += space;
                position.bottom += space;
                break;
            case "right":
                position.left += space;
                position.right += space;
                break;
            case "bottom":
                position.top -= space;
                position.bottom -= space;
                break;
            case "left":
                position.left -= space;
                position.right -= space;
                break;
            default:
                throw new Error("Unknown direction: " + direction);
        }
    }

    /**
     * Generates the bounding box position Object (think rectangle) for a set of
     * children. The top, right, etc. member variables become the most extreme
     * out of all the possibilities.
     *
     * @param children   An Array of Objects with .top, .right, .bottom, and .left.
     * @returns An Object with .top, .right, .bottom, and .left.
     */
    private wrapChoicePositionExtremes(children?: Choice[]): Choice | undefined {
        if (!children || !children.length) {
            return undefined;
        }

        const position: Choice = {
            bottom: children[0].bottom,
            children,
            height: 0,
            left: children[0].left,
            right: children[0].right,
            title: "",
            top: children[0].top,
            width: 0,
        };

        if (children.length === 1) {
            return position;
        }

        for (let i = 1; i < children.length; i += 1) {
            const child: Choice = children[i];

            if (!Object.keys(child).length) {
                return position;
            }

            position.top = Math.max(position.top, child.top);
            position.right = Math.max(position.right, child.right);
            position.bottom = Math.min(position.bottom, child.bottom);
            position.left = Math.min(position.left, child.left);
        }

        position.width = position.right - position.left;
        position.height = position.top - position.bottom;

        return position;
    }

    /**
     * Ensures an output from parseChoice contains all the necessary size
     * measurements, as listed in this.sizingNames.
     *
     * @param output   The Object (likely a parsed possibility content)
     *                 having its arguments modified.
     * @param choice   The definition of the Object chosen from a choices Array.
     * @param schema   An Object with basic information on the chosen possibility.
     */
    private ensureSizingOnChoice(output: Choice, choice: PossibilityChild, schema: Possibility) {
        for (const name of sizingNames) {
            (output as any)[name] =
                choice.sizing && typeof (choice.sizing as any)[name] !== "undefined"
                    ? (choice.sizing as any)[name]
                    : (schema as any)[name];
        }
    }

    /**
     * Ensures an output from parseChoice contains all the necessary position
     * bounding box measurements, as listed in this.directionNames.
     *
     * @param output   The Object (likely a parsed possibility content)
     *                 having its arguments modified.
     * @param position   An Object that contains .left, .right, .top, and .bottom.
     */
    private ensureDirectionBoundsOnChoice(output: Choice, position: Position) {
        for (const name of directionNames) {
            (output as any)[name] = (position as any)[name];
        }
    }

    /**
     * @returns A number in [1, 100] at random.
     */
    private randomPercentage(): number {
        return Math.floor(this.random() * 100) + 1;
    }

    /**
     * @returns A number in [min, max] at random.
     */
    private randomBetween(min: number, max: number): number {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }
}
