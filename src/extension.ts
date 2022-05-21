import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext): void
{
    let disposable = vscode.commands.registerCommand('extension.generateGetterAndSetters', function ()
    {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const selection = editor.selection;
        const text = editor.document.getText(selection);
        const extensionName = path.extname(editor.document.fileName).slice(1);

        if (text.length < 1)
        {
            vscode.window.showErrorMessage('No selected properties.');
            return;
        }

        try
        {
            const getterAndSetter = createGetterAndSetter(text, extensionName);

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

function toPascalCase(string: string)
{
    return string.replace(/\w+/g,w => w[0].toUpperCase() + w.slice(1));
}

function createGetterAndSetter(textProperties: string, fileType: string)
{
    // Split lines and ignore comments
    const properties = textProperties
        .split(/\r?\n/)
        .filter(line => line.length > 2)
        .map(line => line.replace(';', ''))
        .filter(line => !line.match(/(\/\/|#|\/\*|\*|\*\/).*/));

    let generatedCode = '\n';
    for (let property of properties)
    {
        property = property.trim();

        let words = property.split(" ").map(x => x.replace(/\r?\n/, ''));
        let type = '';
        let attribute = '';

        // if words == ["private", "String", "name"];
        if (words.length > 2)
        {
            type = words[1];
            attribute = words[2];

            generatedCode += generateCode(attribute, type, fileType);

        }
        // if words == ["String", "name"];
        else if (words.length === 2)
        {
            type = words[0];
            attribute = words[1];

            generatedCode += generateCode(attribute, type, fileType);

        }
        // if words == ["name"];
        else if (words.length)
        {
            type = "Object";
            attribute = words[0];

            generatedCode += generateCode(attribute, type, fileType);
        }
    }

    return generatedCode;
}

function generateCode(attribute: string, type: string, fileType: string): string {
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
export function deactivate() { }
