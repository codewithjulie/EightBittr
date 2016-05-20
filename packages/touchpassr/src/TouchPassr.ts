/// <reference path="../typings/inputwritr/InputWritr.d.ts" />

import { IInputWritr } from "IInputWritr";
import { InputWritr } from "InputWritr";
import { ButtonControl } from "./ButtonControl";
import { Control } from "./Control";
import { JoystickControl } from "./JoystickControl";
import { IControlClassesContainer, IControlsContainer, IControlSchema, IControlSchemasContainer, IRootControlStyles, ITouchPassr, ITouchPassrSettings } from "./ITouchPassr";

/**
 * A GUI layer on top of InputWritr for touch events.
 */
export class TouchPassr implements ITouchPassr {
    /**
     * Known, allowed control classes, keyed by name.
     */
    private static controlClasses: IControlClassesContainer = {
        "Button": ButtonControl,
        "Joystick": JoystickControl
    } as any as IControlClassesContainer;

    /**
     * An InputWritr for controls to pipe event triggers to.
     */
    private InputWriter: InputWritr;

    /**
     * Whether this is currently enabled and visually on the screen.
     */
    private enabled: boolean;

    /**
     * Root container for styles to be added to control elements.
     */
    private styles: IRootControlStyles;

    /**
     * Container for generated controls, keyed by their name.
     */
    private controls: IControlsContainer;

    /**
     * An HTMLElement all controls are placed within.
     */
    private container: HTMLElement;

    /**
     * HTMLElement containing the controls container.
     */
    private parentContainer: HTMLElement;

    /**
     * Initializes a new instance of the TouchPassr class.
     * 
     * @param settings   Settings to be used for initialization.
     */
    public constructor(settings: ITouchPassrSettings) {
        if (typeof settings === "undefined") {
            throw new Error("No settings object given to TouchPassr.");
        }
        if (typeof settings.InputWriter === "undefined") {
            throw new Error("No InputWriter given to TouchPassr.");
        }

        this.InputWriter = settings.InputWriter as any;
        this.styles = settings.styles || {};

        this.resetContainer(settings.container);

        this.controls = {};
        if (settings.controls) {
            this.addControls(settings.controls);
        }

        if (typeof settings.enabled === "undefined") {
            this.enabled = true;
        } else {
            this.enabled = settings.enabled;
        }

        this.enabled ? this.enable() : this.disable();
    }

    /**
     * @returns The InputWritr for controls to pipe event triggers to.
     */
    public getInputWriter(): IInputWritr {
        return this.InputWriter;
    }

    /**
     * @returns Whether this is currently enabled and visually on the screen.
     */
    public getEnabled(): boolean {
        return this.enabled;
    }

    /**
     * @returns The root container for styles to be added to control elements.
     */
    public getStyles(): IRootControlStyles {
        return this.styles;
    }

    /**
     * @returns The container for generated controls, keyed by their name.
     */
    public getControls(): IControlsContainer {
        return this.controls;
    }

    /**
     * @returns The HTMLElement all controls are placed within.
     */
    public getContainer(): HTMLElement {
        return this.container;
    }

    /**
     * @returns The HTMLElement containing the controls container.
     */
    public getParentContainer(): HTMLElement {
        return this.parentContainer;
    }

    /**
     * Enables the TouchPassr by showing the container.
     */
    public enable(): void {
        this.enabled = true;
        this.container.style.display = "block";
    }

    /**
     * Disables the TouchPassr by hiding the container.
     */
    public disable(): void {
        this.enabled = false;
        this.container.style.display = "none";
    }

    /**
     * Sets the parent container surrounding the controls container.
     * 
     * @param parentElement   A new parent container.
     */
    public setParentContainer(parentElement: HTMLElement): void {
        this.parentContainer = parentElement;
        this.parentContainer.appendChild(this.container);
    }

    /**
     * Adds any number of controls to the internal listing and HTML container.
     * 
     * @param schemas   Schemas for new controls to be made, keyed by name.
     */
    public addControls(schemas: IControlSchemasContainer): void {
        for (const i in schemas) {
            if (schemas.hasOwnProperty(i)) {
                this.addControl(schemas[i]);
            }
        }
    }

    /**
     * Adds a control to the internal listing and HTML container.
     * 
     * @param schema   The schema for the new control to be made.
     */
    public addControl<T extends IControlSchema>(schema: T): void {
        if (!TouchPassr.controlClasses.hasOwnProperty(schema.control)) {
            throw new Error("Unknown control schema: '" + schema.control + "'.");
        }

        const control: Control<T> = new (TouchPassr.controlClasses as any)[schema.control](this.InputWriter, schema, this.styles);

        this.controls[schema.name] = control;
        this.container.appendChild(control.getElement());
    }

    /**
     * Resets the base controls container. If a parent element is provided,
     * the container is added to it.
     * 
     * @param parentContainer   A container element, such as from GameStartr.
     */
    private resetContainer(parentContainer?: HTMLElement): void {
        this.container = Control.prototype.createElement("div", {
            "className": "touch-passer-container",
            "style": {
                "position": "absolute",
                "top": 0,
                "right": 0,
                "bottom": 0,
                "left": 0
            }
        });

        if (parentContainer) {
            this.setParentContainer(parentContainer);
        }
    }
}
