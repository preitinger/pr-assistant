/* eslint-disable eqeqeq */

import * as vscode from 'vscode';

export function upCase(s: string) {
    if (s === '') {
        return '';
    }

    const codeLowA = 'a'.charCodeAt(0);
    const codeLowZ = 'z'.charCodeAt(0);
    const codeCapA = 'A'.charCodeAt(0);
    const codeCapZ = 'Z'.charCodeAt(0);
    const diff = codeCapA - codeLowA;
    const first = s.charCodeAt(0);
    if (first >= codeLowA && first <= codeLowZ) {
        return String.fromCharCode(first + diff) + s.substring(1);
    } else {
        return s;
    }
}


export function workspaceRoot() {
    const wsFolders = vscode.workspace.workspaceFolders;
    if (wsFolders == null || wsFolders.length === 0) {
        throw new Error('ws folder?!');
    }
    const root = wsFolders[0].uri.fsPath;

    return root;
}

export function subPath(fsPath: string, relPath: string): string {
    if (fsPath.endsWith('/')) {
        if (relPath.startsWith('/')) {
            return fsPath.substring(0, fsPath.length - 1) + relPath;
        } else {
            return fsPath + relPath;
        }
    } else {
        if (relPath.startsWith('/')) {
            return fsPath + relPath;
        } else {
            return fsPath + '/' + relPath;
        }
    }
}

export const workspaceUri = (root: string) => (relPath: string) => {
    return vscode.Uri.file(subPath(root, relPath));
}
