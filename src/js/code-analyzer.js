import * as esprima from 'esprima';

let legalCharacters = ['+', '-', '/', '*', '<', '>', '=', '&', '|', '(', ')', ';', ',', '^'];
let charactersParenthesisRight = ['/', '*', '(', '['];
let charactersParenthesisLeft = ['/', '*', ')'];

function substituteExpression(expression, vars) {
    let expression_as_string = originalCode.substring(expression.range[0], expression.range[1]);
    Object.keys(vars).forEach((key) => {
        let index = expression_as_string.search(key);
        if (index >= 0) {
            let start_left = index, start_right = index + key.length - 1;
            while (expression_as_string[--start_left] === ' ') {/*MAGIC*/}
            while (expression_as_string[++start_right] === ' ') {/*MAGIC*/}
            let should_substitute = false;
            let with_parenthesis = false;
            if (start_left < 0) {
                if (start_right === expression_as_string.length) {
                    //Substitute and no parenthesis
                    should_substitute = true;
                }
                else if (legalCharacters.includes(expression_as_string[start_right])) {
                    // Substitute
                    should_substitute = true;
                    if (charactersParenthesisRight.includes(expression_as_string[start_right])) {
                        //Put parenthesis
                        with_parenthesis = true;
                    } else {
                        // No parenthesis
                    }
                }
            }
            else {
                if (start_right === expression_as_string.length) {
                    if (legalCharacters.includes(expression_as_string[start_left])) {
                        // Substitute
                        should_substitute = true;
                        if (charactersParenthesisLeft.includes(expression_as_string[start_left])) {
                            //Put parenthesis
                            with_parenthesis = true;
                        } else {
                            // No parenthesis
                        }
                    }
                }
                else {
                    if (legalCharacters.includes(expression_as_string[start_left]) && legalCharacters.includes(expression_as_string[start_right])) {
                        // Substitute
                        should_substitute = true;
                        if (charactersParenthesisLeft.includes(expression_as_string[start_left]) || charactersParenthesisRight.includes(expression_as_string[start_right])) {
                            //Put parenthesis
                            with_parenthesis = true;
                        } else {
                            // No parenthesis
                        }
                    }
                }
            }

            if (should_substitute) {
                let new_string = vars[key];
                if (with_parenthesis) {
                    new_string = '(' + new_string + ')';
                }
                expression_as_string = expression_as_string.substr(0, index) + new_string + expression_as_string.substr(index + key.length);
            }
        }
    });
    return expression_as_string;
}

function substituteLine(statement, vars) {
    let lines_to_delete = [];

    if (statement.type === 'VariableDeclaration') {
        //TODO: support arrays vars.
        lines_to_delete.push(statement.loc.start.line);
        if (statement.declarations[0].type === 'VariableDeclarator') {
            vars[statement.declarations[0].id.name] = substituteExpression(statement.declarations[0].init, vars);
        }
    }
    else if (statement.type === 'IfStatement') {

    }
    else if (statement.type === 'ExpressionStatement') {

    }
    else if (statement.type === 'WhileStatement') {

    }
    else if (statement.type === 'ReturnStatement'){
        substituteExpression(statement.argument,vars);
    }
    return {'vars': vars, 'lines_to_delete': lines_to_delete};
}

function symbolicSubstitution(codeToParse) {
    let lines_to_delete = [];
    let global_vars = new Map();
    Array.prototype.forEach.call(codeToParse.body, (line) => {
        if (line === 'VariableDeclaration') {
            substituteLine(line,global_vars);
        }
        if (line === 'FunctionDeclaration') {
            /*let parsedFunctionParams = line.params.map((param) => {
                return param.name;
            });*/
            line.body.body.reduce((vars, statement) => {
                let return_value = substituteLine(statement, vars);
                lines_to_delete = lines_to_delete.concat(return_value.lines_to_delete);
                return return_value.vars;
            }, global_vars);
        }
    });

    let lines = originalCode.split('\n');
    for (let i = 0; i < lines_to_delete; i++) {
        lines.splice(lines_to_delete[i], 1);
    }

    return lines_to_delete;
}

function colorFunction(functionCode, input) {
    return functionCode + input;
}

var originalCode = '';
const parseCode = (codeToParse, functionInput) => {
    originalCode = codeToParse;
    let parsedCode = esprima.parseScript(codeToParse, {loc: true, range: true});

    let substitutedCode = symbolicSubstitution(parsedCode);
    let coloredLines = colorFunction(substitutedCode, functionInput);

    //let returnValue = {code: substitutedCode, colors: coloredLines};
    return substitutedCode;

};

export {parseCode};
