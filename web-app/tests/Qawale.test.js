import Qawale from "../Qawale.js";
import R from "../ramda.js";

/**
 * Unit Tests for the Qawale game module
 * Test focus on the public API functions:
 * newGame, legalChoices, choosePosition, stackAt and winner
 */

const DISPLAY_MODE = "json";

const displayFunctions = {
    "json": JSON.stringify,
    "toString": Qawale.toString
};
//Choice of the different ways of showing state of the game

/**
 * Return a readable version of the game state to the user
 * @param {Qawale.state} state The game state
 * @retunrs {string} A redable version of the game state
 */
const displayState = function (state) {
    try {
        return "\n" + displayFunctions[DISPLAY_MODE](state);
    } catch (ignore) {
        return "\n" + JSON.stringify(state);
    }
};

/**
 * Throw if primitive values don't match what you expect
 * @param {*} actual The actual value returned by code
 * @param {*} expected The expected value from code
 * @param {*} message The error message to print
 * @param {*} state The state to show if the check itself fails
 * @throws if the values are not equal
 */
const throwIfNotEqual = function (actual, expected, message, state) {
    if (actual !== expected) {
        throw new Error(
            message +
            "\nExpected: " + String(expected) +
            "\nActual: " + String(actual) +
            (
                state === undefined
                ? ""
                : displayState(state)
            )
        );
    }
};

/**
 * Throw if acutal values within objects/arrays aren't equal
 * @param {*} actual actual value returned by code
 * @param {*} expected The excpected value
 * @param {*} message The error message to print
 * @param {*} state the state to show if the check itself fails
 */
const throwIfNotDeepEqual = function (actual, expected, message, state) {
    if (!R.equals(actual, expected)) {
        throw new Error(
            message +
            "\nExpected: " + JSON.stringify(expected) +
            "\nActual: " + JSON.stringify(actual) +
            (
                state === undefined
                ? ""
                : displayState(state)
            )
        );
    }
};

const positionsEqual = function (position1, position2) {
    return (
        position1[0] === position2[0] &&
        position1[1] === position2[1]
    );
};

/**
 * Returns if the game state is valid at any point in the game
 * - board is of a 4x4 size and a 3d matrix
 * - The tokens on the board are only of types 0 or 1 or 2
 * @memberof Qawale.test
 * @function
 * @param {State} state
 * @throws If the state of the board is invalid
 */

const throwIfInvalid = function (state) {
    //Board checks
    if (!Array.isArray(state.board) || !Array.isArray(state.board[0][0])) {
        throw new Error(
            "The board is not a 3D array" + displayState(state)
        );
    }

    if (!((state.board.length === 4) && (state.board[0].length === 4))) {
        throw new Error(
            "The board doens't have dimensions 4x4" + displayState(state)
        );
    }

    //checking if there's invalid stones on the board;
    const stonesOnBoard = R.flatten(state.board);
    const validStones = [0, 1, 2];

    const allStonesValid = R.all(function (stone) {
        return validStones.includes(stone);
    }, stonesOnBoard);

    if (!allStonesValid) {
        throw new Error(
            "The board contains an invalid stone value" +
            "\nStones found" + JSON.stringify(stonesOnBoard) +
            displayState(state)
        );
    }
};

describe("Starting State", function () {
    it("The generated start board is valid", function () {
        const state = Qawale.newGame();
        throwIfInvalid(state);
    });

    it("all corners shoudl have two markers on them", function () {
        const state = Qawale.newGame();
        const corners = [[0, 0], [3, 0], [0, 3], [3, 3]];

        const twoNeutrals = function (position) {
            return R.equals(
                Qawale.stackAt(position, state),
                [0, 0]
            );
        };

        if (!R.all(twoNeutrals, corners)) {
            throw new Error(
                "All corners don't contain the two starting neutral stones"
                + displayState(state)
            );
        }

        //Check that the rest of the board is empty
        const stoneSummary = R.flatten(state.board);
        const uniqueStones = [...new Set(stoneSummary)];
        //key and values for the stones

        if (stoneSummary.length !== 8) {
            throw new Error(
                "There are more than 8 stones on the board"
                + displayState(state)
            );
        }

        if (!R.equals(uniqueStones, [0])) {
            throw new Error(
                "Not all of the stones on the board are neutral"
                + displayState(state)
            );
        }
    });

    it("It should be player 1's turn to select first square", function () {
        const state = Qawale.newGame();

        throwIfNotEqual(
            state.player,
            1,
            "Player 1 should start the game",
            state
        );

        throwIfNotEqual(
            state.phase,
            "selecting",
            "The game should start in the selecting phase",
            state
        );
    });

    it("Each player should have 8 reserves", function () {
        const state = Qawale.newGame();
        if ((state.reserves[1] !== 8) || (state.reserves[2] !== 8)) {
            throw new Error(
                "Each player does not have only 8 reserves left"
                + displayState(state)
            );
        }
    });

    it("A new game has no winner", function () {
        const state = Qawale.newGame();

        throwIfNotEqual(
            Qawale.winner(state),
            undefined,
            "A new game should not have a winner",
            state
        );
    });
});


const otherPlayer = function (player) {
    return 3 - player;
    //3 -1 = 2 , 3 - 2 = 1
};

/**
 * Helper to go through every legal choice from a state
 * Make sure all chocies are valid
 * @param {*} state The state to test from
 * @throws if a legal choice produes an invalid result
 */
const throwIfBadLegalChoice = function (state) {
    const legalChoices = Qawale.legalChoices(state);

    legalChoices.forEach(function (position) {
        const nextState = Qawale.choosePosition(position, state);
        //Get the next state if that move was made

        if (nextState === undefined) {
            throw new Error(
                "A legal choice (from the legal choices list) "
                + "returned undefined game state" +
                "\nChoice: " + JSON.stringify(position) +
                displayState(state)
            );
        }

        throwIfInvalid(nextState);
        //after all of the tests check that it's still in a valid board mode

        //check if it switches between players

        if (state.phase === "selecting") {
            if (nextState.phase !== "sowing") {
                throw new Error(
                    "Selecting a source move should put the game into the" +
                    "sowing phase" +
                    displayState(state)
                );
            }

            if (nextState.player !== state.player) {
                throw new Error(
                    "The player shouldn't change immediately" +
                    "after switching to sowing phase" +
                    displayState(state)
                );
            }
        }

        if (state.phase === "sowing" && nextState.phase === "sowing") {
            //the turn is still ongoing
            if (nextState.player !== state.player) {
                throw new Error(
                    "The player should not change while still in" +
                    " the sowing phase" +
                    displayState(nextState)
                );
            }
        }

        if (state.phase === "sowing" && nextState.phase === "selecting") {
            if (nextState.player !== otherPlayer(state.player)) {
                throw new Error(
                    "The player should change after the final stone in"
                    + "the stack is dropped." +
                    displayState(nextState)
                );
            }
        }
    });
};

const positionIsInList = function (position, positions) {
    return positions.some(function (candidate) {
        return positionsEqual(position, candidate);
    });
};

describe("Legal choices", function () {

    it(["Given a valid game state, when every legal choice ",
        "is made then every resulting",
        "state is also valid"].join(""), function () {
        const states = [
            Qawale.newGame(),
            Qawale.choosePosition([0, 0], Qawale.newGame())
        ];
        //Test it across two states, one that's just started
        //  one where the first move has been made
        states.forEach(throwIfBadLegalChoice);
    });

    it("Empty cells are not legal source choices at the start", function () {
        const state = Qawale.newGame();
        const legalChoices = Qawale.legalChoices(state);

        if (positionIsInList([1, 1], legalChoices)) {
            throw new Error(
                "An empty cell should not be a legal source choice" +
                "\nLegal choices: " + JSON.stringify(legalChoices) +
                displayState(state)
            );
        }
    });

    it("Sowing choices are orthogonal", function () {
        const state = Qawale.choosePosition([0, 0], Qawale.newGame());
        const legalChoices = Qawale.legalChoices(state);

        if (
            !positionIsInList([1, 0], legalChoices) ||
            !positionIsInList([0, 1], legalChoices) ||
            positionIsInList([1, 1], legalChoices)
        ) {
            throw new Error(
                "After selecting [0, 0], orthogonal neighbours only " +
                "should be legal" +
                "\nLegal choices: " + JSON.stringify(legalChoices) +
                displayState(state)
            );
        }
    });

    it("Diagonal choices are not legal during sowing", function () {
        const state = Qawale.choosePosition([0, 0], Qawale.newGame());
        const legalChoices = Qawale.legalChoices(state);

        if (positionIsInList([1, 1], legalChoices)) {
            throw new Error(
                "Diagonal positions should not be legal sowing choices." +
                "\nLegal choices: " + JSON.stringify(legalChoices) +
                displayState(state)
            );
        }
    });

    it("Immediate backwards movement is not legal during sowing", function () {
        let state = Qawale.newGame();

        state = Qawale.choosePosition([0, 0], state);
        state = Qawale.choosePosition([1, 0], state);

        if (positionIsInList([0, 0], Qawale.legalChoices(state))) {
            throw new Error(
                "Immediate backwards movement should not be legal." +
                "\nLegal choices: " + JSON.stringify(Qawale.legalChoices(state))
                + displayState(state)
            );
        }
    });
});

describe("choosing positions", function () {
    it("An illegal source choice returns undefined", function () {
        const state = Qawale.newGame();
        const nextState = Qawale.choosePosition([1, 1], state);

        throwIfNotEqual(
            nextState,
            undefined,
            "Choosing an empty source should return undefined.",
            state
        );
    });

    it("Selecting a source lifts the stack", function () {
        const state = Qawale.newGame();
        const nextState = Qawale.choosePosition([0, 0], state);

        throwIfNotDeepEqual(
            Qawale.stackAt([0, 0], nextState),
            [],
            "Selecting a source should remove that stack from " +
            "the board temporarily",
            nextState
        );

        throwIfNotDeepEqual(
            nextState.move.stones,
            [0, 0, 1],
            "The moving stack should contain the lifted stack plus "
            + "player 1's stone.",
            nextState
        );
    });

    it("Selecting a source reduces the current player's reserve", function () {
        const state = Qawale.newGame();
        const nextState = Qawale.choosePosition([0, 0], state);

        throwIfNotEqual(
            nextState.reserves["1"],
            7,
            "Player 1's reserve should decrease after selecting a source.",
            nextState
        );
    });

    it("Sowing drops one stone", function () {
        let state = Qawale.newGame();

        state = Qawale.choosePosition([0, 0], state);
        state = Qawale.choosePosition([1, 0], state);

        throwIfNotDeepEqual(
            Qawale.stackAt([1, 0], state),
            [0],
            "The first sowing choice should drop one neutral stone.",
            state
        );

        throwIfNotDeepEqual(
            state.move.stones,
            [0, 1],
            "After dropping one stone, two stones should remain"
            + " in the moving stack.",
            state
        );
    });

    it("The final drop switches player", function () {
        let state = Qawale.newGame();

        state = Qawale.choosePosition([0, 0], state);
        state = Qawale.choosePosition([1, 0], state);
        state = Qawale.choosePosition([1, 1], state);
        state = Qawale.choosePosition([2, 1], state);

        throwIfNotEqual(
            state.player,
            2,
            "After player 1 drops the final stone, player 2 should be next.",
            state
        );

        throwIfNotEqual(
            state.phase,
            "selecting",
            "After the final drop, the game should return to selecting phase.",
            state
        );

        throwIfNotEqual(
            state.move,
            null,
            "After the final drop, there should be no active move.",
            state
        );
    });

    it("Making a move does not mutate the original state", function () {
        const originalState = Qawale.newGame();

        Qawale.choosePosition([0, 0], originalState);

        throwIfNotDeepEqual(
            Qawale.stackAt([0, 0], originalState),
            [0, 0],
            "The original state should still contain the starting stack.",
            originalState
        );

        throwIfNotEqual(
            originalState.phase,
            "selecting",
            "The original state phase should not be mutated.",
            originalState
        );

        throwIfNotEqual(
            originalState.player,
            1,
            "The original state player should not be mutated.",
            originalState
        );
    });
});

describe("Winner and end detection", function () {
    it("A board with no more reserves should have no more" +
        "legal choices", function () {
        const state = {
            "board": [
                [[1], [], [], []],
                [[2], [], [], []],
                [[1], [], [], []],
                [[2], [], [], []]
            ],
            "player": 2,
            "reserves": {
                "1": 0,
                "2": 0
            },
            "phase": "selecting",
            "move": null
        };

        if (Qawale.legalChoices(state).length !== 0) {
            throw new Error(
                "There should be no more legal moves if there aren't reserves" +
                displayState(state)
            );
        }
    });

    it("vertical visible top-stone line wins", function () {
        const state = {
            "board": [
                [[1], [1], [1], [1]],
                [[], [], [], []],
                [[], [], [], []],
                [[], [], [], []]
            ],
            "player": 2,
            "reserves": {
                "1": 4,
                "2": 4
            },
            "phase": "selecting",
            "move": null
        };

        if (Qawale.winner(state) !== 1) {
            throw new Error(
                "A vertical visible line should win for player 1." +
                displayState(state)
            );
        }
    });

    it("horizontal visible top-stone line wins", function () {
        const state = {
            "board": [
                [[1], [], [], []],
                [[1], [], [], []],
                [[1], [], [], []],
                [[1], [], [], []]
            ],
            "player": 2,
            "reserves": {
                "1": 4,
                "2": 4
            },
            "phase": "selecting",
            "move": null
        };

        if (Qawale.winner(state) !== 1) {
            throw new Error(
                "A horizontal visible line should win for player 1." +
                displayState(state)
            );
        }
    });

    it("diagonal visible top-stone line wins", function () {
        const state = {
            "board": [
                [[1], [], [], []],
                [[], [1], [], []],
                [[], [], [1], []],
                [[], [], [], [1]]
            ],
            "player": 2,
            "reserves": {
                "1": 4,
                "2": 4
            },
            "phase": "selecting",
            "move": null
        };

        if (Qawale.winner(state) !== 1) {
            throw new Error(
                "A diagonal visible line should win for player 1." +
                displayState(state)
            );
        }
    });

    it("burried stones don't win", function () {
        const state = {
            "board": [
                [[1, 2], [], [], []],
                [[1, 0], [], [], []],
                [[1, 0], [], [], []],
                [[1, 2], [], [], []]
            ],
            "player": 2,
            "reserves": {
                "1": 4,
                "2": 4
            },
            "phase": "selecting",
            "move": null
        };

        if (Qawale.winner(state) !== undefined) {
            throw new Error(
                "Burried stones for player 1 shouldn't win" +
                displayState(state)
            );
        }
    });
});