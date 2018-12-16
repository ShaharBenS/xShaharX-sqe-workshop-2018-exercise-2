/* eslint-disable max-lines-per-function,no-unused-vars,no-unused-function */
/*eslint complexity: [0, 0]*/

import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

let beautify = require('js-beautify');

let legalCharacters = ['+', '-', '/', '*', '<', '>', '=', '&', '|', '(', ')', ';', ',', '^','[',']','.','!'];
let charactersParenthesisRight = ['/', '*', '(', '[','.'];
let charactersParenthesisLeft = ['/', '*', ')','!'];

function copyMap(map){
    let new_map = new Map();
    Array.prototype.forEach.call(Object.keys(map),(key)=>{
        new_map[key] = map[key];
    });
    return new_map;
}

function getIndicesOf(searchStr, str) {
    let searchStrLen = searchStr.length;
    let startIndex = 0, index, indices = [];
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}

function substituteExpression(expression, vars) {
    let expression_as_string = originalCode.substring(expression.range[0], expression.range[1]);
    Object.keys(vars).forEach((key) => {
        let indices = getIndicesOf(key,expression_as_string);
        indices.reverse();
        Array.prototype.forEach.call(indices,(index)=>{
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
        });
    });
    return expression_as_string;
}

function substituteLine(statement, vars, should_return_line_on_variable_dec,parsed_function_params) {
    let substitutedCode = '';

    if (statement.type === 'VariableDeclaration') {
        //TODO: support arrays vars.
        //lines_to_delete.push(statement.loc.start.line);
        //if (statement.declarations[0].type === 'VariableDeclarator') {
        vars[statement.declarations[0].id.name] = substituteExpression(statement.declarations[0].init, vars);
        /*if(should_return_line_on_variable_dec){
            return {'substitutedCode':statement.kind +' '+ statement.declarations[0].id.name + ' = '+vars[statement.declarations[0].id.name]+';\n','vars':vars};
        }*/
        //}
    }
    else if (statement.type === 'IfStatement') {
        let alternate = statement.alternate;
        substitutedCode += 'if('+substituteExpression(statement.test,vars)+')\n';
        let returnValue = substituteLine(statement.consequent,copyMap(vars),false,parsed_function_params);
        substitutedCode += returnValue.substitutedCode;
        while(alternate != null && alternate.type === 'IfStatement'){
            substitutedCode += 'else if('+substituteExpression(alternate.test,vars)+')\n';
            returnValue = substituteLine(alternate.consequent,copyMap(vars),false,parsed_function_params);
            substitutedCode += returnValue.substitutedCode;
            alternate = alternate.alternate;
        }
        if(alternate != null){
            substitutedCode += 'else\n';
            returnValue = substituteLine(alternate,copyMap(vars),false,parsed_function_params);
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
        //if (statement.expression.type === 'AssignmentExpression'){
        //    if(statement.expression.left.type === 'Identifier'){
        let substitutedExpression = substituteExpression(statement.expression.right, vars);
        if (parsed_function_params.indexOf(statement.expression.left.name) < 0 && globalVars.indexOf(statement.expression.left.name) < 0) {
            vars[statement.expression.left.name] = substitutedExpression;
        } else {
            // Assignment into function parameter
            substitutedCode += originalCode.substring(statement.expression.left.range[0], statement.expression.left.range[1])
                + ' = ' + substitutedExpression + ';\n';
        }
        //     }
        /*if(statement.expression.left.type === 'MemberExpression'){
            //TODO: add array support
        }*/
        //}
        //TODO: check if there are more cases other than 'AssignmentExpression'
    }
    else if (statement.type === 'WhileStatement') {
        substitutedCode += 'while('+substituteExpression(statement.test,vars)+')\n';
        let returnValue = substituteLine(statement.body,copyMap(vars),false,parsed_function_params);
        substitutedCode += returnValue.substitutedCode;
    }
    else /*if (statement.type === 'ReturnStatement')*/{
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
                //let returnValue = substituteLine(line, global_vars, true);
                //global_vars = returnValue.vars;
                //substitutedCode_before += returnValue.substitutedCode;
                substitutedCode_before += originalCode.substring(line.range[0],line.range[1]);
            } else {
                //let returnValue = substituteLine(line, global_vars, true);
                //global_vars = returnValue.vars;
                //substitutedCode_after += returnValue.substitutedCode;
                substitutedCode_after += originalCode.substring(line.range[0],line.range[1]);
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
    }, new Map() /*global_vars*/);

    substitutedCode_function += '}\n';

    return beautify(substitutedCode_before+substitutedCode_function+substitutedCode_after,{indent_size:4});
}

function getColoredLines(line,func_and_global_vars) {
    let coloredLines = [];
    let done = false;
    if (line.type === 'IfStatement') {
        let alternate = line.alternate;
        let expression_to_eval = escodegen.generate(line.test);
        expression_to_eval = substituteVars(expression_to_eval,func_and_global_vars);
        let evaluated_expression = eval(expression_to_eval);
        if(evaluated_expression){
            done = true;
        }
        coloredLines.push({'line':line.loc.start.line,
            'color':evaluated_expression ? 'green' : 'red'});
        coloredLines = coloredLines.concat(getColoredLines(line.consequent,func_and_global_vars));
        while(alternate != null && alternate.type === 'IfStatement'){
            expression_to_eval = escodegen.generate(alternate.test);
            expression_to_eval = substituteVars(expression_to_eval,func_and_global_vars);
            if(done){
                coloredLines.push({'line':alternate.loc.start.line,
                    'color':'red'});
            }
            else{
                evaluated_expression = eval(expression_to_eval);
                if(evaluated_expression){
                    done = true;
                }
                coloredLines.push({'line':alternate.loc.start.line,
                    'color':evaluated_expression ? 'green' : 'red'});
            }
            coloredLines = coloredLines.concat(getColoredLines(alternate.consequent,func_and_global_vars));
            alternate = alternate.alternate;
        }
        if(alternate != null){
            coloredLines.push({'line':alternate.loc.start.line,
                'color': !done ? 'green' : 'red'});
            coloredLines = coloredLines.concat(getColoredLines(alternate,func_and_global_vars));
        }
    }
    /*else if (line.type === 'WhileStatement') {
        let expression_to_eval = escodegen.generate(line.test);
        expression_to_eval = substituteVars(expression_to_eval,func_and_global_vars);
        coloredLines.push({'line':line.loc.start.line,
            'color':eval(expression_to_eval) ? 'green' : 'red'});
    }*/
    else if(line.type === 'BlockStatement'){
        Array.prototype.forEach.call(line.body,(line)=>{
            coloredLines = coloredLines.concat(getColoredLines(line,func_and_global_vars));
        });
    }
    return coloredLines;
}


function substituteVars(expression,func_and_global_vars) {
    Array.prototype.forEach.call(Object.keys(func_and_global_vars),(key) => {
        let indices = getIndicesOf(key,expression);
        indices.reverse();
        Array.prototype.forEach.call(indices,(index)=>{
            let start_left = index, start_right = index + key.length - 1;
            while (expression[--start_left] === ' ') {/*MAGIC*/}
            while (expression[++start_right] === ' ') {/*MAGIC*/}
            let should_substitute = false;
            let with_parenthesis = false;
            if (start_left < 0) {
                if (start_right === expression.length) {
                    //Substitute and no parenthesis
                    should_substitute = true;
                }
                else if (legalCharacters.includes(expression[start_right])) {
                    // Substitute
                    should_substitute = true;
                    if (charactersParenthesisRight.includes(expression[start_right])) {
                        //Put parenthesis
                        with_parenthesis = true;
                    } else {
                        // No parenthesis
                    }
                }
            }
            else {
                if (start_right === expression.length) {
                    if (legalCharacters.includes(expression[start_left])) {
                        // Substitute
                        should_substitute = true;
                        if (charactersParenthesisLeft.includes(expression[start_left])) {
                            //Put parenthesis
                            with_parenthesis = true;
                        } else {
                            // No parenthesis
                        }
                    }
                }
                else {
                    if (legalCharacters.includes(expression[start_left]) && legalCharacters.includes(expression[start_right])) {
                        // Substitute
                        should_substitute = true;
                        if (charactersParenthesisLeft.includes(expression[start_left]) || charactersParenthesisRight.includes(expression[start_right])) {
                            //Put parenthesis
                            with_parenthesis = true;
                        } else {
                            // No parenthesis
                        }
                    }
                }
            }
            if (should_substitute) {
                let new_string = JSON.stringify(func_and_global_vars[key]);
                if (with_parenthesis) {
                    new_string = '(' + new_string + ')';
                }
                expression = expression.substr(0, index) + new_string + expression.substr(index + key.length);
            }

        });
    });
    return expression;
}


function colorFunction(functionCode, input) {
    let parsedCode = esprima.parseScript(functionCode,{loc:true,range:true});
    let _function = null;
    let global_vars = {};
    let function_vars = {};
    Array.prototype.forEach.call(parsedCode.body, (line) => {
        if(line.type === 'VariableDeclaration'){
            //if (line.declarations[0].type === 'VariableDeclarator') {
            global_vars[line.declarations[0].id.name] =
                eval(escodegen.generate(line.declarations[0].init));
            //}
        }
        else /*if(line.type === 'FunctionDeclaration')*/ {
            _function = line;
        }
    });
    Array.prototype.forEach.call(_function.params, (param,index) => {
        function_vars[param.name] = eval(input[index]);
    });
    let coloredLines = [];
    let func_and_global_vars = {};
    Array.prototype.forEach.call(Object.keys(global_vars),(key)=>{
        func_and_global_vars[key] = global_vars[key];
    });
    Array.prototype.forEach.call(Object.keys(function_vars),(key)=>{
        func_and_global_vars[key] = function_vars[key];
    });
    Array.prototype.forEach.call(_function.body.body, (line) => {
        coloredLines = coloredLines.concat(getColoredLines(line,
            func_and_global_vars));
    });
    let lines = functionCode.split('\n');
    Array.prototype.forEach.call(coloredLines,(line)=>{
        lines[line.line-1] = '<font color="'+line.color+'">'+lines[line.line-1]+'</font>';
    });
    lines = lines.map((line)=>{
        return line + '<br>';
    });

    return lines.join('\n').replace(/\s\s\s\s/g,'&nbsp;&nbsp;&nbsp;&nbsp;');
}


let globalVars = [];
let originalCode = '';
const parseCode = (codeToParse, functionInput) => {

    originalCode = codeToParse;
    let parsedCode = esprima.parseScript(codeToParse, {loc: true, range: true});
    let substitutedCode = symbolicSubstitution(parsedCode);
    return colorFunction(substitutedCode, functionInput);

};

export {parseCode};
