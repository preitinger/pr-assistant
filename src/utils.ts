/* eslint-disable eqeqeq */

import assert from 'assert';
import { exec, execSync } from 'child_process';
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
};

export async function sanitizedInput({ prompt, placeHolder, value, allow, forbid }: { prompt?: string; placeHolder?: string; value?: string; allow?: RegExp; forbid?: RegExp }) {
    do {
        const inp = await vscode.window.showInputBox({
            prompt,
            placeHolder,
            value,
        });

        if (inp == null) {
            return inp;
        }

        if (allow != null) {
            if (!allow.test(inp)) {
                vscode.window.showErrorMessage(`The input must match ${allow.source}, but does not.`);
                continue;
            }
        }

        if (forbid != null) {
            if (forbid.test(inp)) {
                vscode.window.showErrorMessage(`The input must not match ${forbid.source}, but does.`);
                continue;
            }
        }

        return inp;
    } while (true);
}

export type RunShellRes = {
    code: number | null;
    signal: NodeJS.Signals | null;
}

export function asyncShell(cmd: string, out: vscode.OutputChannel) {
    return new Promise<RunShellRes>((res, rej) => {
        const proc = exec(cmd);
        proc.stdout?.setEncoding('utf-8');
        proc.stderr?.setEncoding('utf-8');

        proc.on('exit', (code, signal) => {
            console.log('exit code of submodules-to-main.sh: ', code);
            if (code != null) {
                out.appendLine(`\n[exit code ${code} ]`);
            }
            if (signal != null) {
                out.appendLine(`\nKilled by signal ${signal}`);
            }
            res({
                code: code,
                signal: signal
            });
        });
        proc.on('error', (err) => {
            vscode.window.showErrorMessage(`${cmd} failed: ${err.name} - ${err.message}`);
        });
        proc.stdout?.on('data', (chunk) => {
            assert(typeof chunk === 'string');
            console.log('stdout data', chunk);
            out.appendLine(chunk);
        });
        proc.stderr?.on('data', (chunk) => {
            assert(typeof chunk === 'string');
            console.log('stderr data', chunk);
            out.appendLine(chunk);
        });

    });

}

/**
 * calls execSync, so throws if exit code is non-zero or throws a signal or times out.
 * @param cmd command to execute
 */
export function syncShell(cmd: string): string {
    return execSync(cmd, {
        encoding: 'utf-8'
    });
}

let myChannel: vscode.OutputChannel | null = null;

export function myOutputChannel(): vscode.OutputChannel {
    if (myChannel == null) {
        myChannel = vscode.window.createOutputChannel('pr-assistant');
    }

    myChannel.show();
    return myChannel;
}