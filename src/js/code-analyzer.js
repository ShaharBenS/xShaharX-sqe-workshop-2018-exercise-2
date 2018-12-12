import * as esprima from 'esprima';
let beautify = require('js-beautify');


let legalCharacters = ['+', '-', '/', '*', '<', '>', '=', '&', '|', '(', ')', ';', ',', '^'];
let charactersParenthesisRight = ['/', '*', '(', '['];
let charactersParenthesisLeft = ['/', '*', ')'];

function copyMap(map){
    let new_map = new Map();
    Array.prototype.forEach.call(Object.keys(map),(key)=>{
        new_map[key] = map[key];
    });
    return new_map;
}

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

function substituteLine(statement, vars, should_return_line_on_variable_dec,parsed_function_params) {
    let substitutedCode = '';

    if (statement.type === 'VariableDeclaration') {
        //TODO: support arrays vars.
        //lines_to_delete.push(statement.loc.start.line);
        if (statement.declarations[0].type === 'VariableDeclarator') {
            vars[statement.declarations[0].id.name] = substituteExpression(statement.declarations[0].init, vars);
            if(should_return_line_on_variable_dec){
                return {'substitutedCode':statement.kind +' '+ statement.declarations[0].id.name + ' = '+vars[statement.declarations[0].id.name]+';\n','vars':vars};
            }
        }
    }
    else if (statement.type === 'IfStatement') {
        let alternate = statement.alternate;
        substitutedCode += 'if('+substituteExpression(statement.test,vars)+')\n';
        let returnValue = substituteLine(statement.consequent,copyMap(vars),false,parsed_function_params);
        substitutedCode += returnValue.substitutedCode;
        while(alternate.type != null && alternate.type === 'IfStatement'){
            substitutedCode += 'else if('+substituteExpression(statement.test,vars)+')\n';
            returnValue = substituteLine(statement.consequent,copyMap(vars),false,parsed_function_params);
            substitutedCode += returnValue.substitutedCode;
            alternate = alternate.alternate;
        }
        if(alternate != null){
            substitutedCode += 'else('+substituteExpression(statement.test,vars)+')\n';
            returnValue = substituteLine(statement.consequent,copyMap(vars),false,parsed_function_params);
            substitutedCode += returnValue.substitutedCode;
        }

    }
    else if(statement.type === 'BlockStatement'){
        substitutedCode+='{\n';
        statement.body.reduce((vars, statement) => {
            let return_value = substituteLine(statement, vars, false, parsed_function_params);
            substitutedCode += return_value.substitutedCode;
            return return_value.vars;
        }, vars);
        substitutedCode+='}\n';
    }
    else if (statement.type === 'ExpressionStatement') {
        if (statement.expression.type === 'AssignmentExpression'){
            if(statement.expression.left.type === 'Identifier'){
                let substitutedExpression = substituteExpression(statement.expression.right,vars);
                if(parsed_function_params.indexOf(statement.expression.left.name) < 0 && globalVars.indexOf(statement.expression.left.name) < 0){
                    vars[statement.expression.left.name] = substitutedExpression;
                }
                else{
                    // Assignment into function parameter
                    substitutedCode += originalCode.substring(statement.expression.left.range[0],statement.expression.left.range[1])
                        + ' = '+substitutedExpression+';\n';
                }
            }
            //TODO: add array support
        }
        //TODO: check if there are more cases other than 'AssignmentExpression'
    }
    else if (statement.type === 'WhileStatement') {
        substitutedCode += 'while('+substituteExpression(statement.test,vars)+')\n';
        let returnValue = substituteLine(statement.body,copyMap(vars),false,parsed_function_params);
        substitutedCode += returnValue.substitutedCode;
    }
    else if (statement.type === 'ReturnStatement'){
        substitutedCode += 'return ' + substituteExpression(statement.argument,vars) +';\n';
    }
    return {'vars': vars, 'substitutedCode': substitutedCode};
}

function symbolicSubstitution(parsedCode) {
    let substitutedCode_before = '';
    let substitutedCode_after = '';
    let _function = null;
    let substitutedCode_function = '';
    let global_vars = new Map();
    Array.prototype.forEach.call(parsedCode.body, (line) => {
        if (line.type === 'VariableDeclaration') {
            if (_function == null) {
                let returnValue = substituteLine(line, global_vars, true);
                global_vars = returnValue.vars;
                substitutedCode_before += returnValue.substitutedCode;
            } else {
                let returnValue = substituteLine(line, global_vars, true);
                global_vars = returnValue.vars;
                substitutedCode_after += returnValue.substitutedCode;
            }
        }
        if (line.type === 'FunctionDeclaration') {
            _function = line;
        }
    });
    globalVars = Object.keys(global_vars);
    let parsedFunctionParams = _function.params.map((param) => {
        return param.name;
    });
    substitutedCode_function += originalCode.substring(_function.range[0],_function.body.range[0]) + '{';
    substitutedCode_function += '\n';
    _function.body.body.reduce((vars, statement) => {
        let return_value = substituteLine(statement, vars, false, parsedFunctionParams);
        substitutedCode_function += return_value.substitutedCode;
        return return_value.vars;
    }, global_vars);

    substitutedCode_function += '}\n';

    return beautify(substitutedCode_before+substitutedCode_function+substitutedCode_after,{indent_size:4});
}

function colorFunction(functionCode, input) {

}

let globalVars = [];
let originalCode = '';
const parseCode = (codeToParse, functionInput) => {
    originalCode = codeToParse;
    let parsedCode = esprima.parseScript(codeToParse, {loc: true, range: true});
    let substitutedCode = symbolicSubstitution(parsedCode);
    let coloredLines = colorFunction(esprima.parseScript(substitutedCode), functionInput);
    //let returnValue = {code: substitutedCode, colors: coloredLines};
    return substitutedCode;

};

export {parseCode};
