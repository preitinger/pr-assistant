/* eslint-disable eqeqeq */
import * as vscode from 'vscode';

export function findRoute(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, ...args: any[]): void {
    // const textInWordRange = textEditor.document.getText(textEditor.document.getWordRangeAtPosition(textEditor.selection.active, /'([^']|\\')*'/));
    const wordRangeAtPosition = textEditor.document.getWordRangeAtPosition(textEditor.selection.active, /(\w|\/)+/);
    if (wordRangeAtPosition != null) {
        const textInWordRange = textEditor.document.getText(wordRangeAtPosition);
        const selText = textInWordRange;
        const search = 'app' + selText + '/route.ts';
        vscode.workspace.findFiles(search).then(uris => {
            uris.forEach(uri => {
                console.log('uri', uri);
            });

            if (uris.length > 0) {
                vscode.workspace.openTextDocument(uris[0]).then(doc => {
                    vscode.window.showTextDocument(doc);
                });

            } else {
                vscode.window.showInformationMessage(`${search} not found.`);
            }
        });
    } else {
        vscode.window.showInformationMessage('Please move cursor to a route uri like /api/testRoute');
    }
}
