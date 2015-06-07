/// <reference path="MapScreenr.d.ts" />

module MapScreenr {
    "use strict";

    /**
     * MapScreenr.js
     * 
     * A simple container for Map attributes given by switching to an Area within 
     * that map. A bounding box of the current viewport is kept, along with any 
     * other information desired.
     * 
     * MapScreenr is the closest thing GameStartr projects have to a "global"
     * variable depository, where miscellaneous variables may be stored.
     * 
     * @author "Josh Goldberg" <josh@fullscreenmario.com>
     */
    export class MapScreenr implements IMapScreenr {
        // A listing of variable Functions to be calculated on screen resets.
        public variables: any;

        // Arguments to be passed into variable computation Functions.
        public variableArgs: any[];

        // Positioning coordinates of the MapScreenr's bounding box.
        public top: number;
        public right: number;
        public bottom: number;
        public left: number;
        public middleX: number;
        public middleY: number;

        // Sizing amounts of the MapScreenr's bounding box.
        public width: number;
        public height: number;

        /**
         * Resets the MapScreenr. All members of the settings argument are copied
         * to the MapScreenr itself, though only width and height are required.
         */
        constructor(settings: IMapScreenrSettings) {
            var name: string;

            if (typeof settings.width === "undefined") {
                throw new Error("No width given to MapScreenr.");
            }
            if (typeof settings.height === "undefined") {
                throw new Error("No height given to MapScreenr.");
            }

            for (name in settings) {
                if (settings.hasOwnProperty(name)) {
                    (<any>this)[name] = settings[name];
                }
            }

            this.variables = settings.variables || {};
            this.variableArgs = settings.variableArgs || [];
        }


        /* State changes
        */

        /**
         * Completely clears the MapScreenr for use in a new Area. Positioning is
         * reset to (0,0) and user-configured variables are recalculated.
         */
        clearScreen(): void {
            this.left = 0;
            this.top = 0;
            this.right = this.width;
            this.bottom = this.height;

            this.setMiddleX();
            this.setMiddleY();

            this.setVariables();
        }

        /**
         * Computes middleX as the midpoint between left and right.
         */
        setMiddleX(): void {
            this.middleX = (this.left + this.right) / 2;
        }

        /**
         * Computes middleY as the midpoint between top and bottom.
         */
        setMiddleY(): void {
            this.middleY = (this.top + this.bottom) / 2;
        }

        /**
         * Runs all variable Functions with variableArgs to recalculate their 
         * values.
         */
        setVariables(): void {
            var i: string;

            for (i in this.variables) {
                if (this.variables.hasOwnProperty(i)) {
                    this[i] = this.variables[i].apply(this, this.variableArgs);
                }
            }
        }


        /* Element shifting
        */

        /**
         * Shifts the MapScreenr horizontally and vertically via shiftX and shiftY.
         * 
         * @param {Number} dx
         * @param {Number} dy
         */
        shift(dx: number, dy: number): void {
            if (dx) {
                this.shiftX(dx);
            }

            if (dy) {
                this.shiftY(dy);
            }
        }

        /**
         * Shifts the MapScreenr horizontally by changing left and right by the dx.
         * 
         * @param {Number} dx
         */
        shiftX(dx: number): void {
            this.left += dx;
            this.right += dx;
        }

        /**
         * Shifts the MapScreenr vertically by changing top and bottom by the dy.
         * 
         * @param {Number} dy
         */
        shiftY(dy: number): void {
            this.top += dy;
            this.bottom += dy;
        }
    }
}
