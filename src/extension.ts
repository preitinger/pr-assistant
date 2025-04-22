/* eslint-disable eqeqeq */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// import { constants, existsSync } from 'fs';
import assert from 'assert';
import { existsSync } from 'fs';
import { constants as constantsProm, open, writeFile } from 'fs/promises';
import * as vscode from 'vscode';
import { genApiRoute } from './apiRoutes';
import { findRoute } from './findRoute';
import { subPath, upCase, workspaceRoot, workspaceUri } from './utils';
import { subModuleInstall } from './subModule';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // // Use the console to output diagnostic information (console.log) and errors (console.error)
    // // This line of code will only be executed once when your extension is activated
    // console.log('Congratulations, your extension "helloworld" is now active!');

    // // The command has been defined in the package.json file
    // // Now provide the implementation of the command with registerCommand
    // // The commandId parameter must match the command field in package.json
    // const disposable = vscode.commands.registerCommand('helloworld.helloWorld', () => {
    // 	// The code you place here will be executed every time your command is executed
    // 	// Display a message box to the user
    // 	vscode.window.showInformationMessage('Hello Peter!');
    //     const inputBox = vscode.window.createInputBox();
    //     inputBox.onDidAccept(() => {
    //         console.log("inputBox.value", inputBox.value);
    //         inputBox.hide();
    //         vscode.commands.executeCommand('workbench.action.files.openFile', inputBox.value);
    //         // vscode.commands.getCommands().then((commands) => {
    //         //     commands.forEach(cmd => {
    //         //         console.log(cmd);
    //         //     });
    //         // });
    //     });
    //     inputBox.show();

    // });

    // context.subscriptions.push(disposable);

    // const d2 = vscode.commands.registerCommand('helloworld.openBla', () => {
    //     vscode.workspace.findFiles('code*').then(async (uris) => {
    //         console.log('uris.length', uris.length);
    //         for (let i = 0; i < Math.min(5, uris.length); ++i) {
    //             console.log(uris[i].path);
    //         }

    //         if (uris.length > 0) {
    //             const execHandle = execFile('/home/peter/my_projects/individual-gits/pr-desktop-tools/build/pr-desktop-tools');
    //             execHandle.on('error', (err) => {
    //                 console.log('error', err);
    //             });
    //             execHandle.on('close', (code) => {
    //                 console.log('pr-desktop-tools closed with code ', code);
    //             });
    //             const doc = await vscode.workspace.openTextDocument(uris[0]);
    //             await vscode.window.showTextDocument(doc);
    //             console.log('after openTextDocument');
    //             vscode.commands.executeCommand('workbench.action.tasks.runTask', 'bla');
    //         }
    //     });
    //     context.subscriptions.push(d2);
    //     // vscode.commands.executeCommand('workbench.action.files.openFile', );
    // });
    // context.subscriptions.push(
    //     vscode.commands.registerCommand('helloworld.dumpWorkspace', () => {
    //         dumpWorkspace();
    //     })
    // );
    context.subscriptions.push(
        vscode.commands.registerCommand('pr-assistant.createNewFile', () => {
            createNewFile();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('pr-assistant.genState', () => {
            genState();
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('pr-assistant.genTestFile', addTestFile)
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('pr-assistant.genApiRoute', genApiRoute)
    );
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand("pr-assistant.findRoute", findRoute)
    );
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand("pr-assistant.switchDevelop", switchDevelop)
    );
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand("pr-assistant.mergeToMain", mergeToMain)
    );
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand("pr-assistant.subModuleInstall", subModuleInstall)
    );
}

async function switchDevelop() {
    // TODO switch from branch main to branch develop
}

async function mergeToMain() {
    // From branch develop commit all and create a tag on branch develop.
    // Increment webapp version.
    // Convert submodules in private git repositories to copies of the content
    // without any .git folder or file.
    // Merge to main (or reset or whatever is best in git).
}

async function genState() {
    const input = await vscode.window.showInputBox({
        prompt: "Zusammenhängender Name für neuen Zustand"
    });

    if (input == null) {
        console.log('input canceled');
        return;
    } else {
        console.log('input was "' + input + '"');
    }

    if (stateExists(input)) {
        vscode.window.showErrorMessage('Dieser Zustand existiert bereits!');
        return;
    }

    const root = workspaceRoot();

    await genStatePage(root, input);
    await appendSinglePage(root, input);
    await genPageEntry(root, input);
}

function stateExists(state: string) {
    const root = workspaceRoot();
    console.log('root in stateExists', root);
    return existsSync(subPath(root, `app/_states/_${state}`));
}

function normalizeStateName(name: string): string {
    const re = /^[a-zA-Z]\w*$/;
    const myMatch = name.match(re);
    console.log('myMatch', myMatch);
    if (myMatch == null) {
        throw new Error('did not match');
    }

    assert(name.length > 0); // otherwise, regex had not matched

    const downCaseDiff = 'a'.charCodeAt(0) - 'A'.charCodeAt(0);

    if (name[0] >= 'A' && name[0] <= 'Z') {
        return String.fromCharCode(name.charCodeAt(0) + downCaseDiff) + name.substring(1);
    }
    return name;
}

async function appendSinglePage(root: string, state: string) {
    const wsUri = workspaceUri(root);

    const capState = upCase(state);

    try {
        const uri = subPath(root, '/app/components/SinglePage.tsx');
        let content2;
        {
            const fd = await open(subPath(root, '/app/components/SinglePage.tsx'), constantsProm.O_RDONLY);
            const content = new TextDecoder().decode(await fd.readFile());
            const closeProm = fd.close();
            const toInsert = `    <${capState}Page l={l} 
                userData={userData} 
                userAgent={userAgent} 
                histState2={histState2}
                dark={dark}
                setHistState2={setHistState2}
                setOtherSession={setOtherSession}
            />
        </Container>`;

            content2 = content.replace('</Container>', toInsert);
            await closeProm;
        }
        {
            const fd = await open(uri, constantsProm.O_WRONLY);
            await fd.writeFile(content2);
            await fd.close();
        }
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc);
        console.log('doc shown for ', uri);
        await vscode.commands.executeCommand('workbench.action.keepEditor');
        console.log('kept editor for ', uri);
    } catch (reason) {
        console.error(reason);
    }
}

async function genPageEntry(root: string, state: string) {
    function wsUri(relPath: string) {
        return vscode.Uri.file(subPath(root, relPath));
    }

    try {
        const lowState = normalizeStateName(state);
        const capState = upCase(lowState);
        console.log('lowState', lowState, 'capState', capState);
        // TODO:
        // open('/home/peter/my_projects', constantsProm.O_RDONLY)
        try {
            const templateFd = await open(subPath(root, '../pr-assistant/templates/entryPage.tsx.txt'), constantsProm.O_RDONLY);
            // TODO
            const content = new TextDecoder().decode(await templateFd.readFile())
                .replaceAll('${CAP_STATE}', capState).replaceAll('${LOW_STATE}', lowState);
            templateFd.close();
            const e = new vscode.WorkspaceEdit();
            const uri = wsUri(`app/[lang]/${lowState}/[exampleAttribute]/page.tsx`);
            e.createFile(
                uri,
                {
                    overwrite: false,
                    contents: new TextEncoder().encode(content)
                }
            );
            vscode.workspace.applyEdit(e).then(async success => {
                if (success) {
                    const doc = await vscode.workspace.openTextDocument(uri);
                    await vscode.window.showTextDocument(doc);
                    console.log('doc shown for ', uri);
                    await vscode.commands.executeCommand('workbench.action.keepEditor');
                    console.log('kept editor for ', uri);
                } else {
                    vscode.window.showErrorMessage(`Fehler beim Erzeugen der Datei ${uri}. Wahrscheinlich existiert sie schon...`);
                    return;
                }
            });
        } catch (reason) {
            console.error(reason);
            const reasonStr = reason instanceof Error ? reason.name + ": " + reason.message : JSON.stringify(reason);
            vscode.window.showErrorMessage('Could not open template file Page.tsx.txt: ' + reasonStr);
        }
    } catch (reason) {
        console.error('caught in normalizeStateName', reason);
    }

}

async function genStatePage(root: string, state: string) {

    function wsUri(relPath: string) {
        return vscode.Uri.file(subPath(root, relPath));
    }

    try {
        const lowState = normalizeStateName(state);
        const capState = upCase(lowState);
        console.log('lowState', lowState, 'capState', capState);
        // TODO:
        // open('/home/peter/my_projects', constantsProm.O_RDONLY)
        try {
            const templateFd = await open(subPath(root, '../pr-assistant/templates/Page.tsx.txt'), constantsProm.O_RDONLY);
            // TODO
            const content = new TextDecoder().decode(await templateFd.readFile())
                .replaceAll('${CAP_STATE}', capState).replaceAll('${LOW_STATE}', lowState);
            templateFd.close();
            const e = new vscode.WorkspaceEdit();
            const uri = wsUri(`app/_states/_${lowState}/${capState}Page.tsx`);
            e.createFile(
                uri,
                {
                    overwrite: false,
                    contents: new TextEncoder().encode(content)
                }
            );
            vscode.workspace.applyEdit(e).then(async success => {
                if (success) {
                    const doc = await vscode.workspace.openTextDocument(uri);
                    const editor = await vscode.window.showTextDocument(doc);
                    console.log('doc shown for ', uri);
                    await vscode.commands.executeCommand('workbench.action.keepEditor');
                    console.log('kept editor for ', uri);

                } else {
                    vscode.window.showErrorMessage(`Fehler beim Erzeugen der Datei ${uri}. Wahrscheinlich existiert sie schon...`);
                    return;
                }
            });
        } catch (reason) {
            console.error(reason);
            const reasonStr = reason instanceof Error ? reason.name + ": " + reason.message : JSON.stringify(reason);
            vscode.window.showErrorMessage('Could not open template file Page.tsx.txt: ' + reasonStr);
        }
    } catch (reason) {
        console.error('caught in normalizeStateName', reason);
    }
}

async function addTestFile() {
    const myEdit = new vscode.WorkspaceEdit();

    const root = workspaceRoot();

    // TODO begin remove me
    {
        const input = await vscode.window.showInputBox({
            prompt: "Zusammenhängender Name für neuen Zustand"
        });

        if (input != null) {
            genStatePage(root, input);
        }
    }
    // TODO end remove me


    const uri = vscode.Uri.file(subPath(root, 'app/testCreate0815.txt'));

    myEdit.createFile(uri, {
        overwrite: false,
        contents: new TextEncoder().encode('bla')
    });
    vscode.workspace.applyEdit(myEdit).then(async value => {
        console.log('value of applyEdit', value);
        if (value) {
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(doc);
            await vscode.commands.executeCommand('workbench.action.keepEditor');
        }
    }, (reason) => {
        console.error('reason', reason);
    });

}

function dumpWorkspace() {
    console.log('workspaceFolders:');
    vscode.workspace.workspaceFolders?.forEach((folder) => {
        console.log(folder.uri.fsPath);
    });
}

async function createNewFile() {
    const wsFolders = vscode.workspace.workspaceFolders;
    if (wsFolders != null && wsFolders.length > 0) {
        const newFile = wsFolders[0].uri.fsPath + '/newFile.ts';
        try {
            const fd = await open(newFile, constantsProm.O_WRONLY | constantsProm.O_CREAT | constantsProm.O_EXCL, constantsProm.S_IRUSR | constantsProm.S_IWUSR);
            await writeFile(fd, 'Test');
            await fd.close();
            console.log('Test written to new file');
        } catch (reason) {
            console.error(reason);
            vscode.window.showErrorMessage(`Fehler beim Erzeugen der Datei ${newFile}. Wahrscheinlich existiert sie schon...`);
        }
    }
}

// This method is called when your extension is deactivated
export function deactivate() {
    console.log('deactivate');
}
