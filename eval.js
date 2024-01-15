const assert = require('node:assert');

// Break the math expression into correct groups
function tokenise(expr) {
    const regex = /[A-Za-z]+|([0-9]*[.])?[0-9]+|\S/g;
    let tokens = expr.match(regex);
    tokens = insertCloseBrackets(tokens);
    tokens = insertImpliedMul(tokens);
    return tokens;
}

function isFloat(token) {
    const regex = /^([0-9]*[.])?[0-9]+$/g;
    return (token !== undefined) && (token.match(regex) !== null);
}

function isVar(token) {
    const regex = /^[A-Za-z]+$/g;
    return (token !== undefined) && (token.match(regex) !== null);
}

function isFloatOrVar(token) {
    return (isFloat(token) || isVar(token));
}

// Insert '*' token for implicit multiplication
function insertImpliedMul(tokens) {
    let updatedTokens = [];
    for (let i = 0; i < tokens.length - 1; i++) {
        let current = tokens[i];
        let next = tokens[i + 1];
        updatedTokens.push(current);

        if (isFloatOrVar(current) && next === '(') {
            updatedTokens.push('*');
        }
        if (current === ')' && isFloatOrVar(next)) {
            updatedTokens.push('*');
        }
        if (current === ')' && next === '(') {
            updatedTokens.push('*');
        }
    }
    // Unable to loop last token as i+1 will be out of range
    updatedTokens.push(tokens.pop());
    return updatedTokens;
}

function insertCloseBrackets(tokens) {
    let openCount = 0;
    tokens.forEach(token => {
        if (token === '(') {
            openCount++;
        } else if (token === ')') {
            openCount--;
        }
    });
    if (openCount < 0) {
        throw new SyntaxError("Missing open brackets");
    }
    while (openCount > 0) {
        tokens.push(')');
        openCount--;
    }
    return tokens;
}

function parse(code) {
    let tokens = tokenise(code);
    console.log(tokens);
    let position = 0;

    // Get the next token without moving position
    function peekNext() {
        return tokens[position];
    }

    // Move position 1 token ahead safely (ie skip 1 ahead)
    function consume(token) {
        // Ensure token consumed is expected (e.g. close brackets in PrimaryExpr)
        assert.strictEqual(token, tokens[position]);
        position++;
    }

    // PrimaryExpr should be a float, variable or brackets, as matched above
    function parsePrimaryExpr() {
        let t = peekNext();

        if (isFloat(t)) {
            consume(t);
            return { type: "Float", value: t };
        } else if (t === '+' || t === '-') {
            // Parse expressions prefix with + or -
            let expr = parseUnaryExpr();
            return expr;
        } else if (isVar(t)) {
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
    function parseUnaryExpr() {
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
        return { sign, expr }
    }

    // MulExpr parses (PrimaryExpr */ PrimaryExpr)
    function parseMulExpr() {
        let expr = parsePrimaryExpr();
        let t = peekNext();
        // while allows chaining (expr * expr * expr ...)
        while (t === '*' || t === '/') {
            consume(t);
            let rhs = parsePrimaryExpr();
            expr = { type: t, left: expr, right: rhs };
            t = peekNext();
        }
        return expr;
    }

    // AddExpr parses (MulExpr +- MulExpr)
    // AddExpr takes in MulExpr as it has lower precedence due to PEMDAS
    function parseAddExpr() {
        let expr = parseMulExpr();
        let t = peekNext();
        // while allows chaining (expr + expr + expr ...)
        while (t === '+' || t === '-') {
            consume(t);
            let rhs = parseMulExpr();
            expr = { type: t, left: expr, right: rhs };
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

const code = "1(2)+ (3";
// const code = "1(2+3)";
const parsedTree = parse(code);
console.log(parsedTree);
