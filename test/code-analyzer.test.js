/* eslint-disable max-lines-per-function,no-unused-vars */

import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';

describe('The javascript parser', () => {
    it('is coloring fib', ()=>{
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
        assert.equal(parseCode(codeToParse,[1]),expectedResult);
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
            parseCode(codeToParse,[1,2,3]),
            expectedResult
        );
    });

    it('is coloring big example 1',()=>{
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
        assert.equal(parseCode(codeToParse,[0,5,10]),expectedResult);
    });


});
