import { tokenise, isFloat, isFloatOrVar, isOpr, parse } from './parse.js';

const maintainAspectRatio = function () {
    const calculator = document.getElementById('calculator');
    const aspectRatio = 2 / 3;
    // offset width and height in px to remove scrollbar
    const offset = 30;
    // width and height in px
    const width = window.innerWidth - offset;
    const height = window.innerHeight - offset;
    if (width / height <= aspectRatio) {
        calculator.style.width = width.toString() + 'px';
        calculator.style.height = (width / aspectRatio).toString() + 'px';
    } else {
        calculator.style.height = height.toString() + 'px';
        calculator.style.width = (height * aspectRatio).toString() + 'px';
    }
    updateDisplay();
}
window.addEventListener('resize', () => { maintainAspectRatio(); })
maintainAspectRatio();

let displayInfo = {
    input: "",
    ans: 0,
    bracketCount: 0
};

const btns = document.querySelectorAll('.number, #add, #subtract');
btns.forEach(button => {
    button.addEventListener('click', () => {
        displayInfo.input += button.textContent;
        return updateDisplay();
    })
});

const mulBtns = document.querySelectorAll('#multiply, #divide, #percent');
mulBtns.forEach(button => {
    button.addEventListener('click', () => {
        const tokens = tokenise(displayInfo.input);
        console.log({ tokens })
        if (tokens.length === 0) {
            // They should not be the first symbol 
            return; // Nothing changed, no need updateDisplay()
        }
        const lastToken = tokens.pop();
        if ((lastToken !== '(') && (!isOpr(lastToken))) {
            // nor be added after another operation nor '('
            displayInfo.input += button.textContent;
            return updateDisplay();
        }
    })
})

const decimalBtn = document.querySelector('#decimal');
decimalBtn.addEventListener('click', () => {
    const tokens = tokenise(displayInfo.input);
    if (tokens.length === 0) {
        displayInfo.input += decimalBtn.textContent;
        return updateDisplay();
    }
    const lastToken = tokens.pop();
    if (lastToken === '.') {
        // Do not repeate decimal point
        return updateDisplay();
    } else if (!isFloat(lastToken)) {
        // Allow implicit decimal, ie .1=0.1
        displayInfo.input += decimalBtn.textContent;
    } else if (isFloat(lastToken) && !lastToken.includes('.')) {
        // Decimal point only applies to integers, not floats
        displayInfo.input += decimalBtn.textContent;
    }
    return updateDisplay();
})

const bracketBtn = document.querySelector('#bracket');
bracketBtn.addEventListener('click', () => {
    const input = tokenise(displayInfo.input);
    if (input.length === 0 || displayInfo.bracketCount === 0) {
        displayInfo.input += '(';
        displayInfo.bracketCount++;
    } else {
        const lastToken = input.pop();
        if (lastToken === '(' || isOpr(lastToken)) {
            // Do not close empty brackets, i.e. not () but ((
            // Do not close operators, i.e. not +) but +(
            displayInfo.input += '(';
            displayInfo.bracketCount++;
        } else {
            displayInfo.input += ')';
            displayInfo.bracketCount--;
        }
    }
    updateDisplay();
})

const clearBtn = document.querySelector('#ac');
clearBtn.addEventListener('click', () => {
    displayInfo.input = "";
    displayInfo.ans = 0;
    displayInfo.bracketCount = 0;
    updateDisplay();
})

const delBtn = document.querySelector('#del');
delBtn.addEventListener('click', () => {
    const lastChr = displayInfo.input.slice(-1);
    // if deleted chr is bracket, update bracketCount appropriately
    if (lastChr === '(') {
        displayInfo.bracketCount--;
    } else if (lastChr === ')') {
        displayInfo.bracketCount++;
    }
    displayInfo.input = displayInfo.input.slice(0, -1);
    updateDisplay();
})

const equalBtn = document.querySelector('#equal');
equalBtn.addEventListener('click', () => {
    const ans = displayInfo.ans;
    if (isFloat(ans)) {
        displayInfo.input = ans;
    } else {
        displayInfo.ans = "Incorrect Format!";
    }
    updateDisplay();
})

const updateDisplay = function () {
    const inputDisp = document.querySelector('#input');
    inputDisp.textContent = insertCommas(displayInfo.input);
    const ansDisp = document.querySelector('#ans');
    if (displayInfo.input.length === 0) {
        return ansDisp.textContent = "";
    }
    // If the new input is malformed and 
    // raises an exception, do not update the ans
    try {
        const input = sanitiseInput(displayInfo.input);
        const tokens = tokenise(input)
        console.table(displayInfo);
        console.log({ input, tokens });
        const parsedTree = parse(input);
        if (parsedTree.value !== undefined) {
            displayInfo.ans = parsedTree.value;
        }
    } catch (err) {
        // displayInfo.ans = err.message;
    }
    resizeOutput(displayInfo.ans, ansDisp);
};

const sanitiseInput = function () {
    let input = displayInfo.input;
    // Replace input symbols for parsing
    input = input.replaceAll('x', '*')
        .replaceAll('÷', '/')
        .replaceAll('%', '/100')
    input = insertCloseBrackets(input);
    input = insertImpliedMul(input);
    return input;
}

// Insert '*' token for implicit multiplication
const insertImpliedMul = function (input) {
    let newString = "";
    for (let i = 0; i < input.length - 1; i++) {
        let current = input[i];
        let next = input[i + 1];
        newString += current;

        if (isFloatOrVar(current) && next === '(') {
            newString += '*';
        }
        if (current === ')' && isFloatOrVar(next)) {
            newString += '*';
        }
        if (current === ')' && next === '(') {
            newString += '*';
        }
    }
    // Unable to loop last chr as i+1 will be out of range
    newString += input[input.length - 1];
    return newString;
}

const insertCloseBrackets = function (input) {
    let bracketCount = displayInfo.bracketCount;
    if (bracketCount < 0) {
        throw new SyntaxError("Missing open brackets");
    }
    const closing = (bracketCount > 0) ? ')'.repeat(bracketCount) : "";
    input += closing;
    return input;
}

const insertCommas = function (input) {
    // Add commas to format numbers
    let outputString = "";
    const tokens = tokenise(input);
    tokens.forEach((token) => {
        if (isFloat(token) && parseFloat(token) >= 1000) {
            const subString = parseFloat(token).toLocaleString();
            outputString += subString;
        } else {
            outputString += token;
        }
    });
    return outputString;
}

const resizeOutput = function (ans, ansDisp) {
    // Ans is resized so it does not exceed the display
    // Original ans is still stored in displayInfo
    let sigFig = 21;
    ansDisp.textContent = ans.toLocaleString("en-US", { maximumSignificantDigits: sigFig });
    while (isOverflow(ansDisp)) {
        sigFig--;
        // Attempt to display ans in scientific notation with as many sf as possible
        ansDisp.textContent = ans.toExponential(sigFig);
    }
}

const isOverflow = function (element) {
    return (element.scrollWidth > element.clientWidth);
}

updateDisplay();