/* This file was auto-generated by shenanigans-manager */

import * as chai from "chai";
import "mocha"; // tslint:disable-line no-import-side-effect
import * as sinonChai from "sinon-chai";

declare const mocha: any;
declare const requirejs: any;
declare const testDependencies: string[];
declare const testPaths: string[];

chai.use(sinonChai);

mocha.setup({
    ui: "bdd",
});

/**
 * Informs RequireJS of the file location for test dependencies.
 *
 * @param dependencies   Modules depended upon for tests.
 */
const redirectTestDependencies = (dependencies: string[]): void => {
    requirejs.config({
        packages: dependencies.map((dependency: string) => ({
            main: "index",
            name: dependency,
        })),
    });

    for (const dependencyUpper of dependencies) {
        const dependency = dependencyUpper.toLowerCase();

        requirejs.config({
            paths: {
                [dependency]: `../node_modules/${dependency}/src`,
            },
        });
    }
};

/**
 * Recursively loads test paths.
 *
 * @param loadingPaths   Test paths to load.
 * @param i   Which index test path to load.
 * @param onComplete   A callback for when loading is done.
 */
const loadTestPaths = (loadingPaths: string[], i: number, onComplete: () => void): void => {
    "use strict";

    if (i >= loadingPaths.length) {
        onComplete();
        return;
    }

    requirejs(
        [loadingPaths[i]],
        (): void => {
            loadTestPaths(loadingPaths, i + 1, onComplete);
        });
};

((): void => {
    redirectTestDependencies(testDependencies);

    loadTestPaths(
        testPaths,
        0,
        (): void => {
            mocha.run();
        });
})();
