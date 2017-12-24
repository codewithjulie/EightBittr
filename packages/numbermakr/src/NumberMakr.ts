/**
 * An updated version of the traditional MersenneTwister JavaScript class by
 * Sean McCullough (2010), based on code by Takuji Nishimura and Makoto
 * Matsumoto (1997 - 2002).
 *
 * For the 2010 code, see https://gist.github.com/banksean/300494.
 */
/*
I've wrapped Makoto Matsumoto and Takuji Nishimura's code in a namespace
so it's better encapsulated. Now you can have multiple random number generators
and they won't stomp all over each other's state.

If you want to use this as a substitute for Math.random(), use the random()
method like so:

var statePeriod = new MersenneTwister();
var randomNumber = statePeriod.random();

You can also call the other genrand_{foo}() methods on the instance.

If you want to use a specific seed in order to get a repeatable random
sequence, pass an integer into the constructor:

var statePeriod = new MersenneTwister(123);

and that will always produce the same random sequence.

Sean McCullough (banksean@gmail.com)
*/
/*
A C-program for MT19937, with initialization improved 2002/1/26.
Coded by Takuji Nishimura and Makoto Matsumoto.

Before using, initialize the state by using init_genrand(seed)
or init_by_array(keyInitial, keyLength).

Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:

    1. Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.

    2. Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.

    3. The names of its contributors may not be used to endorse or promote
    products derived from this software without specific prior written
    permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER
OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

Any feedback is very welcome.
http://www.math.sci.hiroshima-u.ac.jp/~statePeriod-mat/stateVector/emt.html
email: statePeriod-mat @ math.sci.hiroshima-u.ac.jp (remove space)
*/

import { INumberMakr, INumberMakrSettings } from "./INumberMakr";

/**
 * A TypeScript Mersenne Twister implementation.
 */
export class NumberMakr implements INumberMakr {
    /**
     * Length of the state vector.
     */
    private readonly stateLength: number;

    /**
     * Period of the state vector.
     */
    private readonly statePeriod: number;

    /**
     * Constant vector A.
     */
    private readonly matrixA: number;

    /**
     * Constant magic Array from matrixA.
     */
    private readonly matrixAMagic: number[];

    /**
     * Most significant w-r bits.
     */
    private readonly maskUpper: number;

    /**
     * Least significant r bits.
     */
    private readonly maskLower: number;

    /**
     * Past states.
     */
    private readonly stateVector: number[];

    /**
     * Place index in stateVector (if out of range, state must be reset).
     */
    private stateIndex: number;

    /**
     * The starting seed used to initialize.
     */
    private seed: number | number[];

    /**
     * Initializes a new instance of the NumberMakr class.
     *
     * @param settings   Settings to be used for initialization.
     */
    public constructor(settings: INumberMakrSettings = {}) {
        this.stateLength = settings.stateLength || 624;
        this.statePeriod = settings.statePeriod || 397;
        this.matrixA = settings.matrixA || 0x9908B0DF;
        this.maskUpper = settings.maskUpper || 0x80000000;
        this.maskLower = settings.maskLower || 0x7FFFFFFF;

        this.stateVector = new Array(this.stateLength);
        this.stateIndex = this.stateLength + 1;
        this.matrixAMagic = new Array(0x0, this.matrixA);

        this.resetFromSeed(settings.seed || new Date().getTime());
    }

    /**
     * @returns The starting seed used to initialize.
     */
    public getSeed(): number | number[] {
        return this.seed;
    }

    /**
     * @returns The length of the state vector.
     */
    public getStateLength(): number {
        return this.stateLength;
    }

    /**
     * @returns The length of the state vector.
     */
    public getStatePeriod(): number {
        return this.statePeriod;
    }

    /**
     * @returns The length of the state vector.
     */
    public getMatrixA(): number {
        return this.matrixA;
    }

    /**
     * @returns The length of the state vector.
     */
    public getMaskUpper(): number {
        return this.maskUpper;
    }

    /**
     * @returns The length of the state vector.
     */
    public getMaskLower(): number {
        return this.maskLower;
    }

    /**
     * Initializes state from a new seed.
     *
     * @param seedNew   A new seed to reset from.
     */
    public resetFromSeed(seedNew: number | number[]): void {
        this.stateVector[0] = (seedNew as number) >>> 0;

        let s: number;

        for (this.stateIndex = 1; this.stateIndex < this.stateLength; this.stateIndex += 1) {
            s = this.stateVector[this.stateIndex - 1] ^ (this.stateVector[this.stateIndex - 1] >>> 30);
            this.stateVector[this.stateIndex] = (
                (((((s & 0xFFFF0000) >>> 16) * 1812433253) << 16)
                    + (s & 0x0000FFFF) * 1812433253
                ) + this.stateIndex
            ) >>> 0;
        }

        this.seed = seedNew;
    }

    /**
     * Initializes state from an Array.
     *
     * @param keyInitial   An initial state to reset from.
     * @param [keyLength]   The length of keyInitial (by default, keyInitial.length).
     * @remarks   There was a slight change for C++, 2004/2/26.
     */
    public resetFromArray(keyInitial: number[], keyLength: number = keyInitial.length): void {
        this.resetFromSeed(19650218);

        let i = 1;
        let j = 0;
        let k: number = this.stateLength > keyLength ? this.stateLength : keyLength;

        while (k > 0) {
            const s: number = this.stateVector[i - 1] ^ (this.stateVector[i - 1] >>> 30);
            this.stateVector[i] = (this.stateVector[i] ^ (
                ((((s & 0xFFFF0000) >>> 16) * 1664525) << 16)
                + ((s & 0x0000FFFF) * 1664525)
            ) + keyInitial[j] + j
            ) >>> 0;

            i += 1;
            j += 1;

            if (i >= this.stateLength) {
                this.stateVector[0] = this.stateVector[this.stateLength - 1];
                i = 1;
            }

            if (j >= keyLength) {
                j = 0;
            }
        }

        for (k = this.stateLength - 1; k; k -= 1) {
            const s: number = this.stateVector[i - 1] ^ (this.stateVector[i - 1] >>> 30);
            this.stateVector[i] = ((this.stateVector[i] ^ (
                ((((s & 0xFFFF0000) >>> 16) * 1566083941) << 16)
                + (s & 0x0000FFFF) * 1566083941)
            ) - i
            ) >>> 0;

            i += 1;

            if (i >= this.stateLength) {
                this.stateVector[0] = this.stateVector[this.stateLength - 1];
                i = 1;
            }
        }

        this.stateVector[0] = 0x80000000;
        this.seed = keyInitial;
    }

    /**
     * @returns A random Number in [0,0xFFFFFFFF].
     */
    public randomInt32(): number {
        let y: number;

        if (this.stateIndex >= this.stateLength) {
            let kk: number;

            if (this.stateIndex === this.stateLength + 1) {
                this.resetFromSeed(5489);
            }

            for (kk = 0; kk < this.stateLength - this.statePeriod; kk += 1) {
                y = (this.stateVector[kk] & this.maskUpper)
                    | (this.stateVector[kk + 1] & this.maskLower);

                this.stateVector[kk] = this.stateVector[kk + this.statePeriod]
                    ^ (y >>> 1)
                    ^ this.matrixAMagic[y & 0x1];
            }

            for (; kk < this.stateLength - 1; kk += 1) {
                y = (this.stateVector[kk] & this.maskUpper)
                    | (this.stateVector[kk + 1] & this.maskLower);

                this.stateVector[kk] = this.stateVector[kk + (this.statePeriod - this.stateLength)]
                    ^ (y >>> 1)
                    ^ this.matrixAMagic[y & 0x1];
            }

            y = (this.stateVector[this.stateLength - 1] & this.maskUpper)
                | (this.stateVector[0] & this.maskLower);

            this.stateVector[this.stateLength - 1] = this.stateVector[this.statePeriod - 1]
                ^ (y >>> 1) ^ this.matrixAMagic[y & 0x1];

            this.stateIndex = 0;
        }

        y = this.stateVector[this.stateIndex];
        this.stateIndex += 1;

        y ^= (y >>> 11);
        y ^= (y << 7) & 0x9D2C5680;
        y ^= (y << 15) & 0xEFC60000;
        y ^= (y >>> 18);

        return y >>> 0;
    }

    /**
     * @returns A random number in [0,1).
     * @remarks Divided by 2^32.
     */
    public random(): number {
        return this.randomInt32() * (1 / 4294967296);
    }

    /**
     * @returns A random number in [0,0x7FFFFfff].
     */
    public randomInt31(): number {
        return this.randomInt32() >>> 1;
    }

    /**
     * @returns A random real Number in [0,1].
     * @remarks Divided by 2 ^ 32 - 1.
     */
    public randomReal1(): number {
        return this.randomInt32() * (1 / 4294967295);
    }

    /**
     * @returns A random real Number in (0,1).
     * @remarks Divided by 2 ^ 32.
     */
    public randomReal3(): number {
        return (this.randomInt32() + 0.5) * (1 / 4294967296);
    }

    /**
     * @returns A random real Number in [0,1) with 53-bit resolution.
     */
    public randomReal53Bit(): number {
        const a: number = this.randomInt32() >>> 5;
        const b: number = this.randomInt32() >>> 6;

        return (a * 67108864 + b) * (1 / 9007199254740992);
    }

    /**
     * @param max   A maximum value to return under.
     * @returns A random number in [0,max).
     */
    public randomUnder(max: number): number {
        return this.random() * max;
    }

    /**
     * @param min   A minimum value to return.
     * @param max   A maximum value  to return under.
     * @returns A random number in [min,max).
     */
    public randomWithin(min: number, max: number): number {
        return this.randomUnder(max - min) + min;
    }

    /**
     * @param max   A maximum value to return under.
     * @returns a random integer in [0,max).
     */
    public randomInt(max: number): number {
        return this.randomUnder(max) | 0;
    }

    /**
     * @param min   A minimum value to return.
     * @param max   A maximum value to return under.
     * @returns a random integer in [min,max).
     */
    public randomIntWithin(min: number, max: number): number {
        return (this.randomUnder(max - min) + min) | 0;
    }

    /**
     * @returns Either true or false, with 50% probability each.
     */
    public randomBoolean(): boolean {
        return this.randomInt(2) === 1;
    }

    /**
     * @param probability   How likely the returned Boolean will be
     *                      true, in [0, 1]. If >= 1, always true.
     * @returns Either true or false, with the probability of true
     *          equal to the given probability.
     */
    public randomBooleanProbability(probability: number): boolean {
        return this.random() < probability;
    }

    /**
     * @param numerator   The numerator of a fraction.
     * @param denominator   The denominator of a fraction.
     * @returns   Either true or false, with a probability equal to the
     *            given fraction.
     */
    public randomBooleanFraction(numerator: number, denominator: number): boolean {
        return this.random() <= (numerator / denominator);
    }

    /**
     * @template T   Type of values in the array.
     * @param array   Any array of values.
     * @returns A random index, from 0 to the given Array's length.
     */
    public randomArrayIndex<T>(array: T[]): number {
        return this.randomIntWithin(0, array.length);
    }

    /**
     * @template T   Type of values in the array.
     * @param array   Any array of values.
     * @returns A random element from within the given Array.
     */
    public randomArrayMember<T>(array: T[]): T {
        return array[this.randomArrayIndex(array)];
    }
}
