/// <reference path="../typings/FPSAnalyzr.d.ts" />

import { IGamesRunnr, IGamesRunnrSettings, ITriggerCallback, IUpkeepScheduler } from "./IGamesRunnr";

/**
 * Runs a series of callbacks on a timed interval.
 */
export class GamesRunnr implements IGamesRunnr {
    /**
     * Functions to be run, in order, on each upkeep.
     */
    private games: Function[];

    /**
     * Optional trigger Function for this.pause.
     */
    private onPause: ITriggerCallback;

    /**
     * Optional trigger Function for this.play.
     */
    private onPlay: ITriggerCallback;

    /**
     * Arguments to be passed to the optional trigger Functions.
     */
    private callbackArguments: any[];

    /**
     * Reference to the next upkeep, such as setTimeout's returned int.
     */
    private upkeepNext: number;

    /**
     * Function used to schedule the next upkeep, such as setTimeout.
     */
    private upkeepScheduler: IUpkeepScheduler;

    /**
     * Function used to cancel the next upkeep, such as clearTimeout
     */
    private upkeepCanceller: (handle: number) => void;

    /**
     * this.upkeep bound to this GamesRunnr, for use in upkeepScheduler.
     */
    private upkeepBound: any;

    /**
     * Whether the game is currently paused.
     */
    private paused: boolean;

    /**
     * The amount of time, in milliseconds, between each upkeep.
     */
    private interval: number;

    /**
     * The playback rate multiplier (defaults to 1, for no change).
     */
    private speed: number;

    /**
     * The actual speed, as (1 / speed) * interval.
     */
    private intervalReal: number;

    /**
     * An internal FPSAnalyzr object that measures on each upkeep.
     */
    private FPSAnalyzer: FPSAnalyzr.IFPSAnalyzr;

    /**
     * An object to set as the scope for games, if not this GamesRunnr.
     */
    private scope: any;

    /**
     * Whether scheduling timeouts should adjust to elapsed upkeep time.
     */
    private adjustFramerate: boolean;

    /**
     * Initializes a new instance of the GamesRunnr class.
     * 
     * @param settings   Settings to be used for initialization.
     */
    public constructor(settings: IGamesRunnrSettings) {
        if (typeof settings === "undefined") {
            throw new Error("No settings object given GamesRunnr.");
        }
        if (typeof settings.games === "undefined") {
            throw new Error("No games given to GamesRunnr.");
        }

        this.games = settings.games;
        this.interval = settings.interval || 1000 / 60;
        this.speed = settings.speed || 1;
        this.onPause = settings.onPause;
        this.onPlay = settings.onPlay;
        this.callbackArguments = settings.callbackArguments || [this];
        this.adjustFramerate = settings.adjustFramerate;
        this.FPSAnalyzer = settings.FPSAnalyzer || new FPSAnalyzr.FPSAnalyzr(settings.FPSAnalyzerSettings);

        this.scope = settings.scope || this;
        this.paused = true;

        this.upkeepScheduler = settings.upkeepScheduler || function (handler: any, timeout: number): number {
            return setTimeout(handler, timeout);
        };
        this.upkeepCanceller = settings.upkeepCanceller || function (handle: number): void {
            clearTimeout(handle);
        };

        this.upkeepBound = this.upkeep.bind(this);

        for (let i: number = 0; i < this.games.length; i += 1) {
            this.games[i] = this.games[i].bind(this.scope);
        }

        this.setIntervalReal();
    }

    /** 
     * @returns The FPSAnalyzer used in the GamesRunnr.
     */
    public getFPSAnalyzer(): FPSAnalyzr.IFPSAnalyzr {
        return this.FPSAnalyzer;
    }

    /**
     * @returns Whether this is paused.
     */
    public getPaused(): boolean {
        return this.paused;
    }

    /**
     * @returns The Array of game Functions.
     */
    public getGames(): Function[] {
        return this.games;
    }

    /**
     * @returns The interval between upkeeps.
     */
    public getInterval(): number {
        return this.interval;
    }

    /**
     * @returns The speed multiplier being applied to the interval.
     */
    public getSpeed(): number {
        return this.speed;
    }

    /**
     * @returns The optional trigger to be called on pause.
     */
    public getOnPause(): any {
        return this.onPause;
    }

    /**
     * @returns The optional trigger to be called on play.
     */
    public getOnPlay(): any {
        return this.onPlay;
    }

    /**
     * @returns Arguments to be given to the optional trigger Functions.
     */
    public getCallbackArguments(): any[] {
        return this.callbackArguments;
    }

    /**
     * @returns Function used to schedule the next upkeep.
     */
    public getUpkeepScheduler(): IUpkeepScheduler {
        return this.upkeepScheduler;
    }

    /**
     * @returns {Function} Function used to cancel the next upkeep.
     */
    public getUpkeepCanceller(): (handle: number) => void {
        return this.upkeepCanceller;
    }

    /**
     * Meaty function, run every <interval*speed> milliseconds, to mark an FPS
     * measurement and run every game once.
     */
    public upkeep(): void {
        if (this.paused) {
            return;
        }

        // Prevents double upkeeping, in case a new upkeepNext was scheduled.
        this.upkeepCanceller(this.upkeepNext);

        if (this.adjustFramerate) {
            this.upkeepNext = this.upkeepScheduler(this.upkeepBound, this.intervalReal - (this.upkeepTimed() | 0));
        } else {
            this.upkeepNext = this.upkeepScheduler(this.upkeepBound, this.intervalReal);
            this.runAllGames();
        }

        if (this.FPSAnalyzer) {
            this.FPSAnalyzer.measure();
        }
    }

    /**
     * A utility for this.upkeep that calls the same games.forEach(run), timing
     * the total execution time.
     * 
     * @returns The total time spent, in milliseconds.
     */
    public upkeepTimed(): number {
        if (!this.FPSAnalyzer) {
            throw new Error("An internal FPSAnalyzr is required for upkeepTimed.");
        }

        const now: number = this.FPSAnalyzer.getTimestamp();
        this.runAllGames();
        return this.FPSAnalyzer.getTimestamp() - now;
    }

    /**
     * Continues execution of this.upkeep by calling it. If an onPlay has been
     * defined, it's called before.
     */
    public play(): void {
        if (!this.paused) {
            return;
        }
        this.paused = false;

        if (this.onPlay) {
            this.onPlay.apply(this, this.callbackArguments);
        }

        this.upkeep();
    }

    /**
     * Stops execution of this.upkeep, and cancels the next call. If an onPause
     * has been defined, it's called after.
     */
    public pause(): void {
        if (this.paused) {
            return;
        }
        this.paused = true;

        if (this.onPause) {
            this.onPause.apply(this, this.callbackArguments);
        }

        this.upkeepCanceller(this.upkeepNext);
    }

    /**
     * Calls upkeep a <num or 1> number of times, immediately.
     * 
     * @param [num]   How many times to upkeep (by default, 1).
     */
    public step(times: number = 1): void {
        this.play();
        this.pause();
        if (times > 0) {
            this.step(times - 1);
        }
    }

    /**
     * Toggles whether this is paused, and calls the appropriate Function.
     */
    public togglePause(): void {
        this.paused ? this.play() : this.pause();
    }

    /**
     * Sets the interval between between upkeeps.
     * 
     * @param interval   The new time interval in milliseconds.
     */
    public setInterval(interval: number): void {
        const intervalReal: number = Number(interval);

        if (isNaN(intervalReal)) {
            throw new Error("Invalid interval given to setInterval: " + interval);
        }

        this.interval = intervalReal;
        this.setIntervalReal();
    }

    /**
     * Sets the speed multiplier for the interval.
     * 
     * @param speed   The new speed multiplier. 2 will cause interval to be
     *                twice as fast, and 0.5 will be half as fast.
     */
    public setSpeed(speed: number): void {
        const speedReal: number = Number(speed);

        if (isNaN(speedReal)) {
            throw new Error("Invalid speed given to setSpeed: " + speed);
        }

        this.speed = speedReal;
        this.setIntervalReal();
    }

    /**
     * Sets the intervalReal variable, which is interval * (inverse of speed).
     */
    private setIntervalReal(): void {
        this.intervalReal = (1 / this.speed) * this.interval;
    }

    /**
     * Runs all games in this.games.
     */
    private runAllGames(): void {
        for (let i: number = 0; i < this.games.length; i += 1) {
            this.games[i]();
        }
    }
}
