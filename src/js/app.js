import $ from 'jquery';
import {parseCode} from './code-analyzer';
let input_counter = 0;
$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();

        let inputs = [];
        for(let i = 0; i < input_counter; i++){
            inputs.push(document.getElementById('input_'+i).value);
        }
        let coloredCode = parseCode(codeToParse,inputs);
        document.getElementById('parsedCode').innerHTML = coloredCode;
    });

    $('#add-input-button').click(()=>{
        let element = document.createElement('input');
        element.type = 'text';
        element.id = 'input_'+input_counter++;
        document.getElementById('input_div').appendChild(element);
    });
});