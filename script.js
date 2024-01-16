import { tokenise, isFloat, isFloatOrVar, parse } from './eval.js';

const isOpr = function (chr) {
    return "+-x÷".includes(chr);
}

let displayInfo = {
    input: "",
    ans: "",
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
        console.log({tokens})
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
    if (!isFloat(lastToken)) {
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
    displayInfo.ans = "";
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
    const inputDisp = document.querySelector('div#input');
    inputDisp.textContent = displayInfo.input;
    if (displayInfo.input.length === 0) {
        displayInfo.ans = ""
    } else {
    // If the new input is malformed and 
    // raises an exception, do not update the ans
        try {
            const input = sanitiseInput(displayInfo.input);
            console.table(displayInfo);
            console.log({input});
            const parsedTree = parse(input);
            if (parsedTree.value !== undefined) {
                displayInfo.ans = parsedTree.value.toString();
            }
        } catch (err) {
            // displayInfo.ans = err.message;
        }
    }
    const ansDisp = document.querySelector('#ans');
    ansDisp.textContent = displayInfo.ans;
};

const sanitiseInput = function () {
    let input = displayInfo.input;
    // Replace input symbols for parsing
    input = input.replaceAll('x', '*')
                 .replaceAll('÷', '/')
                 .replaceAll('%', '/100');
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