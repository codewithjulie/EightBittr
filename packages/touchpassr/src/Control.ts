/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { InputWritr } from "inputwritr";

import { ControlSchema, ControlStyles, Position, RootControlStyles } from "./types";

/**
 * Abstract class for on-screen controls. Element creation for .element
 * and .elementInner within the constrained position is provided.
 */
export class Control<T extends ControlSchema> {
    /**
     * The parent TouchPassr's InputWritr. Pipe events are sent through here.
     */
    protected inputWriter: InputWritr;

    /**
     * The governing schema for this control. It should be overridden as a more
     * specific schema in child classes.
     */
    protected schema: T;

    /**
     * The outer container element. It should have width and height of 0, so
     * it can be positioned using the schema's .position.
     */
    protected element: HTMLElement;

    /**
     * The inner container element, directly inside the outer container. It
     * should be positioned absolutely so its center is the outer container.
     */
    protected elementInner: HTMLElement;

    /**
     * Resets the control by setting member variables and calling resetElement.
     *
     * @param inputWriter   The parent TouchPassr's InputWritr.
     * @param schema   The governing schema for this control.
     * @param styles   Any styles to add to the element.
     */
    public constructor(inputWriter: InputWritr, schema: T, styles: RootControlStyles) {
        this.inputWriter = inputWriter;
        this.schema = schema;
        this.resetElement(styles);
    }

    /**
     * @returns The outer container element.
     */
    public getElement(): HTMLElement {
        return this.element;
    }

    /**
     * @returns The inner container element.
     */
    public getElementInner(): HTMLElement {
        return this.elementInner;
    }

    /**
     * Creates and returns an HTMLElement of the specified type. Any additional
     * settings Objects may be given to be proliferated onto the Element via
     * proliferateElement.
     *
     * @param type   The tag of the Element to be created.
     * @param settings   Additional settings for the Element, such as className
     *                   or style.
     * @returns A newly created HTMLElement of the specified type.
     */
    public createElement(tag: string, ...args: any[]): HTMLElement {
        const element: HTMLElement = document.createElement(tag || "div");

        // For each provided object, add those settings to the element
        for (const arg of args) {
            this.proliferateElement(element, arg);
        }

        return element;
    }

    /**
     * Identical to proliferate, but tailored for HTML elements because many
     * element attributes don't play nicely with JavaScript Array standards.
     * Looking at you, HTMLCollection!
     *
     * @param recipient   An HTMLElement to receive properties from the donor.
     * @param donor   An object do donate properties to the recipient.
     * @param noOverride   Whether pre-existing properties of the recipient should
     *                     be skipped (defaults to false).
     * @returns recipient
     */
    public proliferateElement(
        recipient: HTMLElement,
        donor: any,
        noOverride = false
    ): HTMLElement {
        // For each attribute of the donor:
        for (const i in donor) {
            if ({}.hasOwnProperty.call(donor, i)) {
                // If noOverride, don't override already existing properties
                if (noOverride && {}.hasOwnProperty.call(recipient, i)) {
                    continue;
                }

                const setting: any = donor[i];

                // Special cases for HTML elements
                switch (i) {
                    // Children and options: just append all of them directly
                    case "children":
                    case "options":
                        if (typeof setting !== "undefined") {
                            for (const child of setting) {
                                recipient.appendChild(child);
                            }
                        }
                        break;

                    // Style: proliferate (instead of making a new Object)
                    case "style":
                        this.proliferateElement((recipient as any)[i], setting);
                        break;

                    // By default, use the normal proliferate logic
                    default:
                        // If it's null, don't do anything (like .textContent)
                        if (setting === null) {
                            (recipient as any)[i] = null;
                        } else if (typeof setting === "object") {
                            // If it's an object, recurse on a new version of it
                            if (!{}.hasOwnProperty.call(recipient, i)) {
                                (recipient as any)[i] = new setting.constructor();
                            }
                            this.proliferateElement((recipient as any)[i], setting, noOverride);
                        } else {
                            // Regular primitives are easy to copy otherwise
                            (recipient as any)[i] = setting;
                        }
                        break;
                }
            }
        }

        return recipient;
    }

    /**
     * Resets the container elements. In any inherited resetElement, this should
     * still be called, as it implements the schema's position.
     *
     * @param styles   Container styles for the contained elements.
     */
    protected resetElement(styles: RootControlStyles, customType?: string): void {
        const position: Position = this.schema.position;
        const offset: any = position.offset;

        this.element = this.createElement("div", {
            className: "control",
            style: {
                boxSizing: "border-box",
                height: 0,
                opacity: ".84",
                position: "absolute",
                width: 0,
            },
        });
        this.elementInner = this.createElement("div", {
            className: "control-inner",
            style: {
                boxSizing: "border-box",
                position: "absolute",
                textAlign: "center",
            },
            textContent: this.schema.label ?? "",
        });
        this.element.appendChild(this.elementInner);

        if (position.horizontal === "left") {
            this.element.style.left = "0";
        } else if (position.horizontal === "right") {
            this.element.style.right = "0";
        } else if (position.horizontal === "center") {
            this.element.style.left = "50%";
        }

        if (position.vertical === "top") {
            this.element.style.top = "0";
        } else if (position.vertical === "bottom") {
            this.element.style.bottom = "0";
        } else if (position.vertical === "center") {
            this.element.style.top = "50%";
        }

        this.passElementStyles(styles.global);
        if (customType) {
            this.passElementStyles(styles[customType]);
        }
        this.passElementStyles(this.schema.styles);

        if (offset.left) {
            this.elementInner.style.marginLeft = this.createPixelMeasurement(offset.left);
        }

        if (offset.top) {
            this.elementInner.style.marginTop = this.createPixelMeasurement(offset.top);
        }

        // ElementInner's center-based positioning must wait until its total width is done setting
        setTimeout((): void => {
            if (position.horizontal === "center") {
                this.elementInner.style.left = this.createHalfSizeMeasurement(
                    this.elementInner,
                    "width",
                    "offsetWidth"
                );
            }
            if (position.vertical === "center") {
                this.elementInner.style.top = this.createHalfSizeMeasurement(
                    this.elementInner,
                    "height",
                    "offsetHeight"
                );
            }
        });
    }

    /**
     * Sets the rotation of an HTML element via CSS.
     *
     * @param element   An HTML element to rotate.
     * @param rotation   How many degrees to rotate the element.
     */
    protected setRotation(element: HTMLElement, rotation: number): void {
        element.style.transform = `rotate(${rotation}deg)`;
    }

    /**
     * Finds the position offset of an element relative to the page, factoring in
     * its parent elements' offsets recursively.
     *
     * @param element   An HTML element.
     * @returns The [left, top] offset of the element, in px.
     */
    protected getOffsets(element: HTMLElement): [number, number] {
        let output: [number, number];

        if (element.offsetParent && element !== element.offsetParent) {
            output = this.getOffsets(element.offsetParent as HTMLElement);
            output[0] += element.offsetLeft;
            output[1] += element.offsetTop;
        } else {
            output = [element.offsetLeft, element.offsetTop];
        }

        return output;
    }

    /**
     * Converts a String or Number into a CSS-ready String measurement.
     *
     * @param raw   A raw measurement, such as 7 or "7px" or "7em".
     * @returns The raw measurement as a CSS measurement.
     */
    private createPixelMeasurement(raw: string | number): string {
        if (!raw) {
            return "0";
        }

        if (typeof raw === "number") {
            return `${raw}px`;
        }

        return raw;
    }

    /**
     * Determines a "half"-measurement that would center an element based on the
     * specified units.
     *
     * @param element   The element whose half-size should be computed.
     * @param styleTag   The initial CSS measurement to check for, as "width" or
     *                   "height".
     * @param attributeBackup   A measurement to check for if the CSS size is falsy,
     *                          as "offsetWidth" or "offsetHeight".
     * @returns A measurement equal to half the styleTag/attributeBackup, such as
     *          "3.5em" or "10px".
     */
    private createHalfSizeMeasurement(
        element: HTMLElement,
        styleTag: string,
        attributeBackup: string
    ): string {
        const amountRaw: string =
            (element.style as any)[styleTag] ||
            (attributeBackup && (element as any)[attributeBackup]);
        if (!amountRaw) {
            return "0px";
        }

        const amount = parseInt(amountRaw.replace(/[^\d]/g, ""), 10) || 0;
        const units = amountRaw.replace(/[\d]/g, "") || "px";

        return -Math.round(amount / 2) + units;
    }

    /**
     * Passes a style schema to .element and .elementInner.
     *
     * @param styles   A container for styles to apply.
     */
    private passElementStyles(styles?: ControlStyles): void {
        if (!styles) {
            return;
        }

        if (styles.element) {
            this.proliferateElement(this.element, styles.element);
        }

        if (styles.elementInner) {
            this.proliferateElement(this.elementInner, styles.elementInner);
        }
    }
}
