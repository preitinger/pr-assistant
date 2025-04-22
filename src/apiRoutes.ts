/* eslint-disable eqeqeq */
import * as vscode from 'vscode';
import { upCase, workspaceRoot, workspaceUri } from './utils';
import { constants, open } from 'fs/promises';

/*

1. User gibt ein z.B. message/send oder api/message/send oder /api/message/send oder /message/send oder app/api/message/send oder /app/api/message/send
2. System checkt ob app/api/message/send vorhanden, wenn ja Abbruch mit Fehlermeldung
3. System checkt ob in app/_lib/both/requests.ts MessageSendReq oder MessageSendRes oder TMessageSendReq oder TMessageSendRes vorhanden ist
   (/\WMessageSendReq\W/, /\WTMessageSendReq\W/, ...); wenn ja Abbruch mit Fehlermeldung
4. Am Ende der Datei app/_lib/both/requests.ts Definitionen fuer MessageSendReq, TMessageSendReq, MessageSendRes und TMessageSendRes erzeugen.
5. /api/message/send/route.ts generieren aus templates/apiRoute.ts.txt


*/

export async function genApiRoute() {
    const root = workspaceRoot();
    const wsUri = workspaceUri(root);

    const input = await vscode.window.showInputBox({
        prompt: "Requestpfad relativ zu app/api/",
        placeHolder: 'some/request'
    });
    if (input == null) {
        return;
    }
    const re = /^\/?([a-zA-Z]\w*(\/\w+)*)\/?$/;
    const m = re.exec(input);
    if (m == null) {
        vscode.window.showWarningMessage('Unerlaubte Eingabe!');
        return;
    }

    const normalizedRoute = m[1];
    console.log('to generate', normalizedRoute);

    const itemRe = /(\w+)(\/|$)/g;
    const segments: string[] = [];
    let innerMatch;
    const limit = 50;
    for (let i = 0; i < limit && (innerMatch = itemRe.exec(normalizedRoute)); ++i) {
        console.log('innerMatch', innerMatch[1]);
        segments.push(innerMatch[1]);
    }

    const camelCase = segments.map(upCase).join("");
    {
        const reqConst = camelCase + 'Req';
        const resConst = camelCase + 'Res';
        const reqType = 'T' + reqConst;
        const resType = 'T' + resConst;

        console.log('reqConst', reqConst, 'reqType', reqType, 'resConst', resConst, 'resType', resType);
    }
    const requestProm = appendRequest(wsUri, camelCase);
    const routeFileProm = genRouteFile(wsUri, segments, camelCase);

    await requestProm;
}

async function genRouteFile(wsUri: (relPath: string) => vscode.Uri, segments: string[], camelCase: string) {

    const templateFd = await open(wsUri('../pr-assistant/templates/apiRoute.ts.txt').fsPath, constants.O_RDONLY);
    // TODO
    const content = new TextDecoder().decode(await templateFd.readFile())
        .replaceAll('${CAMEL_CASE}', camelCase);
    templateFd.close();

    const uri = wsUri(['app/api', ...segments, 'route.ts'].join('/'));
    console.log('uri for route', uri);
    const e = new vscode.WorkspaceEdit();

    e.createFile(
        uri,
        {
            overwrite: false,
            contents: new TextEncoder().encode(content)
        }
    );

    const success = await vscode.workspace.applyEdit(e);

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

}

async function appendRequest(wsUri: (relPath: string) => vscode.Uri, camelCase: string) {

    const uri = wsUri('app/_lib/both/requests.ts');
    const fd = await open(uri.fsPath, constants.O_WRONLY | constants.O_APPEND, constants.S_IRUSR | constants.S_IWUSR);

    await fd.appendFile(`

export const ${camelCase}Req = rt.Record({
    id: rt.String
});
export type T${camelCase}Req = rt.Static<typeof ${camelCase}Req>;

export const ${camelCase}Res = rt.Union(
    rt.Record({
        type: rt.Literal('success'),
        // TODO individual result values?
    }),
    rt.Record({
        type: SessionErrorType
    }),
    rt.Record({
        type: rt.Literal('noAuth') // TODO notwendig, wenn checkAdmin oder checkAuthor verwendet wird
    }),
    // TODO more specific error types?
);
export type T${camelCase}Res = rt.Static<typeof ${camelCase}Res>;
`
    );
    await fd.close();

    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc);
    console.log('doc shown for ', uri);
    await vscode.commands.executeCommand('workbench.action.keepEditor');
    console.log('kept editor for ', uri);

}