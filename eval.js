const assert = require('node:assert');

// Break the math expression into correct groups
function tokenise(expr) {
    const regex = /[A-Za-z]+|([0-9]*[.])?[0-9]+|\S/g;
    let tokens = expr.match(regex);
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

function parse(code) {
    let tokens = tokenise(code);
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
        } 
        // else if (t === '+' || t === '-') {
        //     consume(t);
        //     let expr = parseNegateExpr();
        //     // let next = peakNext();
        //     // if (next === '*' ||  next === '/') {
        //     //     throw new SyntaxError(`Unexpected '${next}'`);
        //     // }
        //     return expr;
        // } 
        else if (isVar(t)) {
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

    // // NegateExpr parses (+- PrimaryExpr)
    // function parseNegateExpr() {
    //     let expr = parsePrimaryExpr();
    //     let t = peekNext();
    //     // while allows chaining (- - ... +- expr)
    // }

    // MulExpr parses (PrimaryExpr */ PrimaryExpr)
    function parseMulExpr() {
        let expr = parsePrimaryExpr();
        let t = peekNext();
        // while allows chaining (expr * expr * expr ...)
        while ((t === '*' || t === '/')) {
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
        while ((t === '+' || t === '-')) {
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
        throw new SyntaxError("Unexpected '" + peek() + "'");
    }
    return result;
}

const code = "((1+2))+3";
const parsedTree = parse(code);
console.log(parsedTree);
