/* eslint-disable max-lines-per-function,no-unused-vars */

import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';

describe('The javascript parser', () => {
    it('is coloring fib', () => {
        let codeToParse = 'function fib(n) {\n' +
            '    let index = n-1;\n' +
            '    if(index === 0 || index === 1){\n' +
            '        return 1;\n' +
            '    }\n' +
            '    else{\n' +
            '        return fib(index-1)+fib(index-2);\n' +
            '    }\n' +
            '}';
        let expectedResult = 'function fib(n) {<br>\n' +
            '<font color="green">&nbsp;&nbsp;&nbsp;&nbsp;if (n - 1 === 0 || n - 1 === 1) {</font><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; return 1;<br>\n' +
            '<font color="red">&nbsp;&nbsp;&nbsp;&nbsp;} else {</font><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; return fib(n - 1 - 1) + fib(n - 1 - 2);<br>&nbsp;&nbsp;&nbsp;&nbsp; }<br>\n' +
            '}<br>';
        assert.equal(parseCode(codeToParse, [1]), expectedResult);
    });

    it('is coloring example with arrays and strings', () => {
        let codeToParse = 'function foo(x,y){\n' +
            '    if(x[0][0] === y){\n' +
            '        return 0;\n' +
            '    }\n' +
            '    return 1;\n' +
            '}';
        let expectedResult = 'function foo(x, y) {<br>\n' +
            '<font color="green">&nbsp;&nbsp;&nbsp;&nbsp;if (x[0][0] === y) {</font><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; return 0;<br>&nbsp;&nbsp;&nbsp;&nbsp; }<br>&nbsp;&nbsp;&nbsp;&nbsp; return 1;<br>\n' +
            '}<br>';
        assert.equal(parseCode(codeToParse, ['[\'ab\', 2, true]', '\'a\'']), expectedResult);
    });

    it('is coloring example with globals and nested ifs', () => {
        let codeToParse = 'let a = 1;\n' +
            'let b = 2;\n' +
            'let c = 3;\n' +
            'let d = \'abc\';\n' +
            'function foo() {\n' +
            '    if(b > a){\n' +
            '        if(c > b){\n' +
            '            if(d.length === c){\n' +
            '                return true;\n' +
            '            }      \n' +
            '        }\n' +
            '    }\n' +
            '}';
        let expectedResult = 'let a = 1;<br>\n' +
            'let b = 2;<br>\n' +
            'let c = 3;<br>\n' +
            'let d = \'abc\';<br>\n' +
            '<br>\n' +
            'function foo() {<br>\n' +
            '<font color="green">&nbsp;&nbsp;&nbsp;&nbsp;if (b > a) {</font><br>\n' +
            '<font color="green">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (c > b) {</font><br>\n' +
            '<font color="green">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (d.length === c) {</font><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; return true;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; }<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; }<br>&nbsp;&nbsp;&nbsp;&nbsp; }<br>\n' +
            '}<br>';
        assert.equal(parseCode(codeToParse, []), expectedResult);
    });

    it('is coloring example from phase-b', () => {
        let codeToParse = 'function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    \n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '        return x + y + z + c;\n' +
            '    } else if (b < z * 2) {\n' +
            '        c = c + x + 5;\n' +
            '        return x + y + z + c;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' +
            '        return x + y + z + c;\n' +
            '    }\n' +
            '}\n';
        let expectedResult = 'function foo(x, y, z) {<br>\n' +
            '<font color="red">&nbsp;&nbsp;&nbsp;&nbsp;if (x + 1 + y < z) {</font><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; return x + y + z + 0 + 5;<br>\n' +
            '<font color="green">&nbsp;&nbsp;&nbsp;&nbsp;} else if (x + 1 + y < z * 2) {</font><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; return x + y + z + 0 + x + 5;<br>\n' +
            '<font color="red">&nbsp;&nbsp;&nbsp;&nbsp;} else {</font><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; return x + y + z + 0 + z + 5;<br>&nbsp;&nbsp;&nbsp;&nbsp; }<br>\n' +
            '}<br>';
        assert.equal(
            parseCode(codeToParse, [1, 2, 3]),
            expectedResult
        );
    });

    it('is coloring big example 1', () => {
        let codeToParse = 'let global1 = \'abc\';\n' +
            'function func(arg1,arg2) {\n' +
            '    let a = arg1;\n' +
            '    if(global1+a === global2){\n' +
            '        if(arg2){\n' +
            '            return global1;\n' +
            '        }\n' +
            '        else if(!arg2){\n' +
            '            return a;\n' +
            '        }\n' +
            '    }\n' +
            '}\n' +
            'let global2 = \'abc3\';';
        let expectedResult = 'let global1 = \'abc\';<br>\n' +
            '<br>\n' +
            'function func(arg1, arg2) {<br>\n' +
            '<font color="green">&nbsp;&nbsp;&nbsp;&nbsp;if (global1 + arg1 === global2) {</font><br>\n' +
            '<font color="green">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (arg2) {</font><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; return global1;<br>\n' +
            '<font color="red">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;} else if (!arg2) {</font><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; return arg1;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; }<br>&nbsp;&nbsp;&nbsp;&nbsp; }<br>\n' +
            '}<br>\n' +
            'let global2 = \'abc3\';<br>';
        assert.equal(parseCode(codeToParse, [3, '\'a\'']), expectedResult);

    });

    it('is coloring big example 2', () => {
        let codeToParse = 'let bb = 1;\n' +
            'let x = 3;\n' +
            'function goo(xx,xy,bbbabbbbbabb) {\n' +
            '    let b = xx;\n' +
            '    let a = 1 + bb;\n' +
            '    let c = xy + xy;\n' +
            '    if(x){\n' +
            '        return xx;\n' +
            '    }\n' +
            '    if(c + bbbabbbbbabb + b > 0){\n' +
            '        return bbbabbbbbabb + x;\n' +
            '    }\n' +
            '    if(0 > a + bbbabbbbbabb){\n' +
            '        c = 3;\n' +
            '    }\n' +
            '    return a + b;\n' +
            '}';
        let expectedResult = 'let bb = 1;<br>\n' +
            'let x = 3;<br>\n' +
            '<br>\n' +
            'function goo(xx, xy, bbbabbbbbabb) {<br>\n' +
            '<font color="green">&nbsp;&nbsp;&nbsp;&nbsp;if (x) {</font><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; return xx;<br>&nbsp;&nbsp;&nbsp;&nbsp; }<br>\n' +
            '<font color="green">&nbsp;&nbsp;&nbsp;&nbsp;if (xy + xy + bbbabbbbbabb + xx > 0) {</font><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; return bbbabbbbbabb + x;<br>&nbsp;&nbsp;&nbsp;&nbsp; }<br>\n' +
            '<font color="red">&nbsp;&nbsp;&nbsp;&nbsp;if (0 > 1 + bb + bbbabbbbbabb) {}</font><br>&nbsp;&nbsp;&nbsp;&nbsp; return 1 + bb + xx;<br>\n' +
            '}<br>';
        assert.equal(parseCode(codeToParse, [2, 5, 4]), expectedResult);
    });

    it('is coloring big example 3', () => {
        let codeToParse = 'let globalNumber1 = 0;\n' +
            'let globalNumber2 = 5;\n' +
            'let globalNumber3 = 10;\n' +
            'function myFunc(a,b,c)\n' +
            '{\n' +
            '\tlet x = a + 1;\n' +
            '\tlet y = x + 2;\n' +
            '\tlet z = y + 3;\n' +
            '\twhile(globalNumber3 > 0)\n' +
            '\t{\n' +
            '\t\ta = z - 2;\n' +
            '\t}\n' +
            '\tif(a < globalNumber1)\n' +
            '\t{\n' +
            '\t\tb = y * z;\n' +
            '\t}\n' +
            '\telse if(a > globalNumber1)\n' +
            '\t{\n' +
            '\t\tb = x * y;\n' +
            '\t}\n' +
            '\telse\n' +
            '\t{\n' +
            '\t\tb = x * y * z;\n' +
            '\t}\n' +
            '\treturn b;\n' +
            '}';
        let expectedResult = 'let globalNumber1 = 0;<br>\n' +
            'let globalNumber2 = 5;<br>\n' +
            'let globalNumber3 = 10;<br>\n' +
            '<br>\n' +
            'function myFunc(a, b, c) {<br>&nbsp;&nbsp;&nbsp;&nbsp; while (globalNumber3 > 0) {<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; a = a + 1 + 2 + 3 - 2;<br>&nbsp;&nbsp;&nbsp;&nbsp; }<br>\n' +
            '<font color="red">&nbsp;&nbsp;&nbsp;&nbsp;if (a < globalNumber1) {</font><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; b = (a + 1 + 2) * (a + 1 + 2 + 3);<br>\n' +
            '<font color="red">&nbsp;&nbsp;&nbsp;&nbsp;} else if (a > globalNumber1) {</font><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; b = (a + 1) * (a + 1 + 2);<br>\n' +
            '<font color="green">&nbsp;&nbsp;&nbsp;&nbsp;} else {</font><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; b = (a + 1) * (a + 1 + 2) * (a + 1 + 2 + 3);<br>&nbsp;&nbsp;&nbsp;&nbsp; }<br>&nbsp;&nbsp;&nbsp;&nbsp; return b;<br>\n' +
            '}<br>';
        assert.equal(parseCode(codeToParse, [0, 5, 10]), expectedResult);
    });


});
