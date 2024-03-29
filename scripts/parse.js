// const assert = require('node:assert');

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
    if (b === 0) {
        throw new EvalError("Division by 0")
    }
    return a / b;
};

// Break the math expression into correct groups
const tokenise = function (expr) {
    const regex = /[A-Za-z]+|([0-9]*[.])?[0-9]+|\S/g;
    // If expr.match return null, return empty array instead
    let tokens = (expr.match(regex) || []);
    return tokens;
}

const isFloat = function (token) {
    const regex = /^([0-9]*[.])?[0-9]+$/g;
    return (token !== undefined) && (token.match(regex) !== null);
}

const isVar = function (token) {
    const regex = /^[A-Za-z]+$/g;
    return (token !== undefined) && (token.match(regex) !== null);
}

const isFloatOrVar = function (token) {
    return (isFloat(token) || isVar(token));
}

const isOpr = function (chr) {
    return "+-x÷".includes(chr);
}

const parse = function (code) {
    let tokens = tokenise(code);
    let position = 0;

    // Get the next token without moving position
    const peekNext = function () {
        return tokens[position];
    }

    // Move position 1 token ahead safely (ie skip 1 ahead)
    const consume = function (token) {
        // Ensure token consumed is expected (e.g. close brackets in PrimaryExpr)
        // assert.strictEqual(token, tokens[position]);
        position++;
    }

    // PrimaryExpr should be a float, variable or brackets, as matched above
    const parsePrimaryExpr = function () {
        let t = peekNext();

        if (isFloat(t)) {
            consume(t);
            return { type: "Float", value: parseFloat(t) };
        } else if (t === '+' || t === '-') {
            // Parse expressions prefix with + or -
            let expr = parseUnaryExpr();
            return expr;
        } else if (isVar(t)) {
            // Var is implemented but not in use in this calculator
            consume(t);
            return { type: "Variable", id: t };
        } else if (t === '(') {
            consume(t);
            // Recursively parse AddExpr in brackets
            let expr = parseAddExpr();
            if (peekNext() !== ')') {
                throw new SyntaxError("Expected ')'");
            }
            consume(')');
            return expr;
        } else {
            throw new SyntaxError("Expected a number, a variable, or brackets");
        }
    }

    // UnaryExpr parses (+- PrimaryExpr)
    const parseUnaryExpr = function () {
        // let expr = parsePrimaryExpr();
        let negateCount = 0;
        let t = peekNext();
        // while allows chaining (+- ... - expr)
        while (t === '+' || t === '-') {
            if (t === '-') negateCount++;
            consume(t);
            t = peekNext();
        }
        const sign = ((negateCount % 2) === 0) ? 1 : -1;
        let expr = parsePrimaryExpr();
        let value = multiply(sign, expr.value);
        return { sign, expr, value }
    }

    // MulExpr parses (PrimaryExpr */ PrimaryExpr)
    const parseMulExpr = function () {
        let expr = parsePrimaryExpr();
        let t = peekNext();
        // while allows chaining (expr * expr * expr ...)
        while (t === '*' || t === '/') {
            consume(t);
            let rhs = parsePrimaryExpr();
            let value = 0;
            if (t === '*') {
                value = multiply(expr.value, rhs.value);
            } else {
                value = divide(expr.value, rhs.value);
            }
            expr = { type: t, left: expr, right: rhs, value };
            t = peekNext();
        }
        return expr;
    }

    // AddExpr parses (MulExpr +- MulExpr)
    // AddExpr takes in MulExpr as it has lower precedence due to PEMDAS
    const parseAddExpr = function () {
        let expr = parseMulExpr();
        let t = peekNext();
        // while allows chaining (expr + expr + expr ...)
        while (t === '+' || t === '-') {
            consume(t);
            let rhs = parseMulExpr();
            let value = 0;
            if (t === '+') {
                value = add(expr.value, rhs.value);
            } else {
                value = subtract(expr.value, rhs.value);
            }
            expr = { type: t, left: expr, right: rhs, value };
            t = peekNext();
        }
        return expr;
    }

    let result = parseAddExpr();
    // Ensure that the position reaches the last token
    if (position !== tokens.length) {
        throw new SyntaxError(`Unexpected '${peekNext()}' after ${position}`);
    }
    return result;
}

// const code = "6/2(1+2)";
// const parsedTree = parse(code);
// console.log(parsedTree);
export { tokenise, isFloat, isFloatOrVar, isOpr, parse }