const add = function (a, b) {
    return a + b;
};

const subtract = function (a, b) {
    return a - b;
};

const multiply = function (a, b) {
    return a * b;
};

const divide = function (a, b) {
    return a / b;
};

const operate = function (operator, arg1, arg2) {
    return operator(arg1, arg2);
};

const updateDisplay = function (text) {
    display = document.querySelector('div.display');
    display.textContent = text;
};

const updateExp = function (expr, button) {
    // switch (button.id) {
    //     case('')
    // }
    updateDisplay(expr);
}

let currentExp = "";

const numBtns = document.querySelectorAll('.number, .operator');
numBtns.forEach(button => {
    button.addEventListener('click', () => {
        currentExp += button.textContent;
        updateDisplay(currentExp);
    })
});

const clearBtn = document.querySelector('button#ac');
clearBtn.addEventListener('click', () => {
    currentExp = "";
    updateDisplay(currentExp);
})

const delBtn = document.querySelector('button#del');
delBtn.addEventListener('click', () => {
    currentExp = currentExp.slice(0, -1);
    updateDisplay(currentExp);
})

