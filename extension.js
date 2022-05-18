const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

function activate(context) 
{

    let disposable = vscode.commands.registerCommand('extension.generateGetterAndSetters', function () 
    {
        var editor = vscode.window.activeTextEditor;
        if (!editor)
            return; // No open text editor

        var selection = editor.selection;
        var text = editor.document.getText(selection);
        const extensionName = path.extname(editor.document.fileName).slice(1);

        if (text.length < 1)
        {
            vscode.window.showErrorMessage('No selected properties.');
            return;
        }

        try 
        {
            var getterAndSetter = createGetterAndSetter(text, extensionName);

            editor.edit(
                edit => editor.selections.forEach(
                  selection => 
                  {
                    edit.insert(selection.end, getterAndSetter);
                  }
                )
              );

            // format getterAndSetter
            vscode.commands.executeCommand('editor.action.formatSelection');
        } 
        catch (error) 
        {
            console.log(error);
            vscode.window.showErrorMessage('Something went wrong! Try that the properties are in this format: "private String name;"');
        }
    });

    context.subscriptions.push(disposable);
}

function toPascalCase(str) 
{
    return str.replace(/\w+/g,w => w[0].toUpperCase() + w.slice(1));
}

function createGetterAndSetter(textProperties, fileType)
{
    var properties = textProperties.split(/\r?\n/).filter(x => x.length > 2).map(x => x.replace(';', ''));

    var generatedCode = `
`;
    for (let p of properties) 
    {
        while (p.startsWith(" ")) p = p.substr(1);
        while (p.startsWith("\t")) p = p.substr(1);

        let words = p.split(" ").map(x => x.replace(/\r?\n/, ''));
        let type, attribute, pascalCasedAttribute = "";
        let create = false;
        
        // if words == ["private", "String", "name"];
        if (words.length > 2)
        {
            type = words[1];
            attribute = words[2];
            pascalCasedAttribute = toPascalCase(words[2]);

            create = true;
        }
        // if words == ["String", "name"];
        else if (words.length == 2)
        {
            type = words[0];
            attribute = words[1];
            pascalCasedAttribute = toPascalCase(words[1]);
            
            create = true;            
        }
        // if words == ["name"];
        else if (words.length)
        {
            type = "Object";
            attribute = words[0];
            pascalCasedAttribute = toPascalCase(words[0]);
            
            create = true;            
        }

        if (create) {
            if (attribute.startsWith('$')) {
                attribute = attribute.slice(1);
                pascalCasedAttribute = pascalCasedAttribute.slice(1);
            }

            const getterTemplate = path.join(__dirname, 'templates', fileType, 'getter.template');
            const setterTemplate = path.join(__dirname, 'templates', fileType, 'setter.template');

            if (!fs.existsSync(getterTemplate) || !fs.existsSync(setterTemplate)) {
                vscode.window.showErrorMessage(`Filetype ${fileType} is not supported`);
            }

            generatedCode += fs.readFileSync(getterTemplate).toString()
                .replaceAll('{{PROPERTY_NAME_UPPERCASE}}', pascalCasedAttribute)
                .replaceAll('{{PROPERTY_NAME}}', attribute)
                .replaceAll('{{PROPERTY_TYPE}}', type);

            generatedCode += fs.readFileSync(setterTemplate).toString()
                .replaceAll('{{PROPERTY_NAME_UPPERCASE}}', pascalCasedAttribute)
                .replaceAll('{{PROPERTY_NAME}}', attribute)
                .replaceAll('{{PROPERTY_TYPE}}', type);
        }
    }

    return generatedCode;
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }

exports.deactivate = deactivate;
