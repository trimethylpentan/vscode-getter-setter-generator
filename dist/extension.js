/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("fs");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
const vscode = __webpack_require__(1);
const path = __webpack_require__(2);
const fs = __webpack_require__(3);
function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.generateGetterAndSetters', function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const selection = editor.selection;
        const text = editor.document.getText(selection);
        const extensionName = path.extname(editor.document.fileName).slice(1);
        if (text.length < 1) {
            vscode.window.showErrorMessage('No selected properties.');
            return;
        }
        try {
            const getterAndSetter = createGetterAndSetter(text, extensionName);
            editor.edit(edit => editor.selections.forEach(selection => {
                edit.insert(selection.end, getterAndSetter);
            }));
            // format getterAndSetter
            vscode.commands.executeCommand('editor.action.formatSelection');
        }
        catch (error) {
            console.log(error);
            vscode.window.showErrorMessage('Something went wrong! Try that the properties are in this format: "private String name;"');
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function toPascalCase(string) {
    return string.replace(/\w+/g, w => w[0].toUpperCase() + w.slice(1));
}
function createGetterAndSetter(textProperties, fileType) {
    // Split lines and ignore comments
    const properties = textProperties
        .split(/\r?\n/)
        .filter(line => line.length > 2)
        .map(line => line.replace(';', ''))
        .filter(line => !line.match(/(\/\/|#|\/\*|\*|\*\/).*/));
    let generatedCode = '\n';
    for (let property of properties) {
        property = property.trim();
        let words = property.split(" ").map(x => x.replace(/\r?\n/, ''));
        let type = '';
        let attribute = '';
        // if words == ["private", "String", "name"];
        if (words.length > 2) {
            type = words[1];
            attribute = words[2];
            generatedCode += generateCode(attribute, type, fileType);
        }
        // if words == ["String", "name"];
        else if (words.length === 2) {
            type = words[0];
            attribute = words[1];
            generatedCode += generateCode(attribute, type, fileType);
        }
        // if words == ["name"];
        else if (words.length) {
            type = "Object";
            attribute = words[0];
            generatedCode += generateCode(attribute, type, fileType);
        }
    }
    return generatedCode;
}
function generateCode(attribute, type, fileType) {
    if (attribute.startsWith('$')) {
        attribute = attribute.slice(1);
    }
    const getterTemplate = path.join(__dirname, '..', 'templates', fileType, 'getter.template');
    const setterTemplate = path.join(__dirname, '..', 'templates', fileType, 'setter.template');
    if (!fs.existsSync(getterTemplate) || !fs.existsSync(setterTemplate)) {
        vscode.window.showErrorMessage(`Filetype ${fileType} is not supported`);
    }
    let generatedCode = '\n';
    generatedCode += fs.readFileSync(getterTemplate).toString()
        .replaceAll('{{PROPERTY_NAME_UPPERCASE}}', toPascalCase(attribute))
        .replaceAll('{{PROPERTY_NAME}}', attribute)
        .replaceAll('{{PROPERTY_TYPE}}', type);
    generatedCode += '\n';
    generatedCode += fs.readFileSync(setterTemplate).toString()
        .replaceAll('{{PROPERTY_NAME_UPPERCASE}}', toPascalCase(attribute))
        .replaceAll('{{PROPERTY_NAME}}', attribute)
        .replaceAll('{{PROPERTY_TYPE}}', type);
    return generatedCode;
}
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map