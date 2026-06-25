/*jslint browser */

import Qawale from "./Qawale.js";

const BOARD_SIZE = 4;
const COLUMNS = [0, 1, 2, 3];
const ROWS = [0, 1, 2, 3];
const ROWS_TOP_TO_BOTTOM = [3, 2, 1, 0];
//used only for display order so visual board appears top to bottom like
//coordiantes system

// One game-state variable. The interface redraws itself from this value.
let state = Qawale.newGame();

//shortcut for getting elements by id
const el = function (id) {
    return document.getElementById(id);
};

//image paths to the stone assets
const stoneAssets = [
    "./assets/stone-neutral.png",
    "./assets/stone-player-1.png",
    "./assets/stone-player-2.png"
];

//Compare two positions just by their coordinates
const positionsEqual = function (position1, position2) {
    return (
        position1[0] === position2[0] &&
        position1[1] === position2[1]
    );
};

const positionIsInList = function (position, positions) {
    return positions.some(function (candidate) {
        return positionsEqual(position, candidate);
    });
};

const stoneName = function (stone) {
    if (stone === 0) {
        return "Neutral";
    }
    if (stone === 1) {
        return "Player 1";
    }
    if (stone === 2) {
        return "Player 2";
    }
    return "Empty";
};

//Convert stack of stones to readible string
const stackText = function (stack) {
    if (stack.length === 0) {
        return "empty";
    }
    return stack.map(stoneName).join(", ");
};

//screen reader label for board cell
//meaning this board can be understwood iwthout relying on colour
const cellLabel = function (position, stack, topStone, legal) {
    const column = position[0] + 1;
    const row = position[1] + 1;
    let legalText = "";
    if (legal) {
        legalText = "legal choice";
    } else {
        legalText = "not a legal choice";
    }

    return (
        "Column " + column +
        ", row " + row +
        ", stack height " + stack.length +
        ", top stone " + stoneName(topStone) +
        ", stack contains " + stackText(stack) +
        ", " + legalText + "."
    );
};

const makeStoneImage = function (stone) {
    const image = document.createElement("img");

    image.className = "stone_image";
    image.src = stoneAssets[stone];
    image.alt = stoneName(stone);
    image.draggable = false;

    return image;
};

//move the keyboard focus to a board cell if it exists
const focusCell = function (column, row) {
    if (
        column >= 0 &&
        column < BOARD_SIZE &&
        row >= 0 &&
        row < BOARD_SIZE
    ) {
        cellButtons[column][row].focus();
    }
};

//main interaction connection to qawale game logic
//only goes through with it if game logic retunrs a next state
const chooseCell = function (position) {
    const nextState = Qawale.choosePosition(position, state);

    if (nextState === undefined) {
        el("feedback").textContent = "That is not a legal choice.";
        return;
    }

    state = nextState;
    el("feedback").textContent = "";
    render();
};

//function to open up the guide and rules screen
const openGuide = function () {
    const dialog = el("guide_dialog");

    if (dialog.showModal !== undefined) {
        dialog.showModal();
    } else {
        dialog.setAttribute("open", "");
    }
};

const closeGuide = function () {
    const dialog = el("guide_dialog");

    if (dialog.open) {
        dialog.close();
    }
};

//attaching the buttons to the callback functions
el("open_guide").onclick = openGuide;
el("close_guide").onclick = closeGuide;


//code to make one cell button, keeps it's own location when set up
const makeCellButton = function (column, row) {
    const button = document.createElement("button");
    const position = [column, row];

    button.type = "button";
    button.className = "cell";
    button.setAttribute("role", "gridcell");

    button.onclick = function () {
        chooseCell(position);
    };

    // Arrow keys move focus around the boardEnter/Space activate buttons.
    button.onkeydown = function (event) {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            focusCell(column - 1, row);
        }
        if (event.key === "ArrowRight") {
            event.preventDefault();
            focusCell(column + 1, row);
        }
        if (event.key === "ArrowUp") {
            event.preventDefault();
            focusCell(column, row + 1);
        }
        if (event.key === "ArrowDown") {
            event.preventDefault();
            focusCell(column, row - 1);
        }
    };

    return button;
};

// cellButtons[column][row] stores each generated button after createBoard runs.
const cellButtons = COLUMNS.map(function () {
    return ROWS.map(function () {
        return null;
    });
});

//Build the 4x4 board, later renders update the buttons on this
//Tis is instead of just recreating the whole board every time
const createBoard = function () {
    const boardElement = el("game_board");

    ROWS_TOP_TO_BOTTOM.forEach(function (row) {
        COLUMNS.forEach(function (column) {
            const button = makeCellButton(column, row);

            cellButtons[column][row] = button;
            boardElement.append(button);
        });
    });
};

//Hover/focus previous of a stack for one cell
const renderStackPreview = function (stack) {
    const preview = document.createElement("span");

    preview.className = "stack_details";

    if (stack.length === 0) {
        preview.textContent = "Empty";
        return preview;
    }

    stack.forEach(function (stone) {
        preview.append(makeStoneImage(stone));
    });
    //add the image of each stone in the stack to the span

    return preview;
};

//Re-draw one cell based on the game state
const renderCell = function (position, legalChoices, gameOver) {
    const column = position[0];
    const row = position[1];
    const button = cellButtons[column][row];
    const stack = Qawale.stackAt(position, state);
    const topStone = Qawale.topStoneAt(position, state);
    const legal = (!gameOver && positionIsInList(position, legalChoices));

    button.className = "cell";
    button.classList.toggle("cell--empty", stack.length === 0);
    button.classList.toggle("cell--legal", legal);
    button.classList.toggle("cell--player-1", topStone === 1);
    button.classList.toggle("cell--player-2", topStone === 2);
    button.classList.toggle("cell--neutral", topStone === 0);
    //styling hooks to make it easier for css to style each group of buttons


    // aria-disabled keeps cells focusable for keyboard stack inspection.
    button.setAttribute("aria-disabled", String(!legal));
    const cellArgs = cellLabel(position, stack, topStone, legal);
    button.setAttribute("aria-label", cellArgs);
    button.replaceChildren();

    const top = document.createElement("span");
    top.className = "cell_top";

    if (topStone === undefined) {
        top.textContent = "·";
    } else {
        top.append(makeStoneImage(topStone));
    }

    const height = document.createElement("span");
    height.className = "cell_height";
    height.textContent = String(stack.length);
    height.setAttribute("aria-hidden", "true");

    const legality = document.createElement("span");
    legality.className = "cell_legal_text";
    legality.textContent = "";
    if (legal) {
        legality.textContent = "Legal";
    }

    button.append(top, height, legality, renderStackPreview(stack));
};

const gameIsOver = function () {
    return (
        state.phase === "ended" ||
        Qawale.winner(state) !== undefined
    );
};

//Function to redraw whole board cells
const renderBoard = function () {
    const legalChoices = Qawale.legalChoices(state);

    COLUMNS.forEach(function (column) {
        ROWS.forEach(function (row) {
            renderCell([column, row], legalChoices, gameIsOver());
        });
    });
};

//Change classes for the player themes and end state
const renderPageTheme = function () {
    document.body.classList.toggle("player-1-turn", state.player === 1);
    document.body.classList.toggle("player-2-turn", state.player === 2);
    document.body.classList.toggle("game-ended", gameIsOver());
};


const renderStatus = function () {
    const winner = Qawale.winner(state);
    const legalChoices = Qawale.legalChoices(state);

    el("p1_reserve").textContent = state.reserves["1"];
    el("p2_reserve").textContent = state.reserves["2"];

    if (winner !== undefined) {
        el("turn_status").textContent = "Game over";
        el("phase_status").textContent = "Player " + winner + " wins!";
        return;
    }

    if (legalChoices.length === 0) {
        el("turn_status").textContent = "Game over";
        el("phase_status").textContent = "There are no legal choices.";
        return;
    }

    el("turn_status").textContent = "Player " + state.player;

    if (state.phase === "selecting") {
        el("phase_status").textContent = "Player " + state.player +
            ": select a stack.";
    } else if (state.phase === "sowing") {
        el("phase_status").textContent = "Player " + state.player +
        ": sow the next stone.";
    } else {
        el("phase_status").textContent = "Game over.";
    }
};

//show the lifted stack of stones during during and hide otherwise
const renderMovingStack = function () {
    const panel = el("moving_stack_panel");
    const container = el("moving_stack");

    container.replaceChildren();

    if (state.move === null) {
        panel.hidden = true;
        return;
    }

    panel.hidden = false;

    state.move.stones.forEach(function (stone) {
        container.append(makeStoneImage(stone));
    });
    //add image of each stone in the lifted stack to the moving stakc element
};

const renderGameOverDialog = function () {
    const dialog = el("game_over_dialog");
    const winner = Qawale.winner(state);
    const over = gameIsOver();

    if (!over) {
        if (dialog.open) {
            dialog.close();
        }
        return;
    }

    if (winner !== undefined) {
        el("game_over_message").textContent = "Player " + winner + " wins!";
    } else {
        el("game_over_message").textContent = "No legal choices remain.";
    }

    if (!dialog.open) {
        if (dialog.showModal !== undefined) {
            dialog.showModal();
        } else {
            dialog.setAttribute("open", "");
        }
    }
};

//Main visual function, each visual part is updated from the currentstate
const render = function () {
    renderPageTheme();
    renderStatus();
    renderMovingStack();
    renderBoard();
    renderGameOverDialog();
};

const resetGame = function () {
    const dialog = el("game_over_dialog");

    if (dialog.open) {
        dialog.close();
    }

    state = Qawale.newGame();
    el("feedback").textContent = "";
    render();
    cellButtons[0][0].focus();
};

//Initial seutp
el("new_game").onclick = resetGame;
el("dialog_new_game").onclick = resetGame;

createBoard();
render(); //redner the board for the first time
openGuide(); //start by auto opening the guide
cellButtons[0][0].focus(); //start on the 0, 0 cell for focussing
