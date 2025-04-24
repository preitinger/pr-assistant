/* eslint-disable eqeqeq */
import { exec, execSync } from "child_process";
import * as vscode from 'vscode';
import { asyncShell, myOutputChannel, sanitizedInput, subPath, syncShell, workspaceRoot } from "./utils";
import assert from "assert";

export async function commonSubmoduleAdd() {
    const root = workspaceRoot();

    const submodule = await sanitizedInput({
        prompt: "URL of Git Repository With The Submodule",
        placeHolder: 'git@github.com:preitinger/user-management-client.git',
        value: 'git@github.com:preitinger/<...>.git',
        forbid: /["\\]/
    });

    if (submodule == null) {
        return;
    }

    const branch = (await sanitizedInput({
        prompt: "Branch of the Git Repository to checkout. Leave empty for default branch.",
    }))?.trim() ?? '';

    try {
        const proc = exec(`cd ${root}; pr-local-scripts/script/common-submodule-add.sh . "${submodule}"${branch ? ` "${branch}"` : ''}`);
        proc.stdout?.setEncoding('utf-8');
        proc.stderr?.setEncoding('utf-8');
        const out = myOutputChannel();

        proc.on('exit', (code) => {
            console.log('exit code of common-submodule-add.sh: ', code);
            if (code === 0) {
                vscode.window.showInformationMessage('common-submodule-add.sh successful.');
            } else {
                vscode.window.showErrorMessage('common-submodule-add.sh failed.');
            }
        });
        proc.on('message', (message, sendHandle) => {
            console.log('message with', message, sendHandle);
        });
        proc.on('error', (err) => {
            console.log('error with', err);
        });
        proc.on('disconnect', () => {
            console.log('disconnect');
        });
        proc.on('spawn', () => {
            console.log('spawn');
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

    } catch (reason) {
        console.error('common-submodule-add.sh threw', reason);
        if (reason instanceof Error) {
            vscode.window.showErrorMessage(`common-submodule-add.sh threw ${reason.name}: ${reason.message}`);
        }
        return;
    }
}

export async function submodulesToMain() {
    const root = workspaceRoot();

    const out = myOutputChannel();

    await asyncShell(`cd ${root}; pr-local-scripts/script/submodules-to-main.sh .`, out);
    // try {
    //     const proc = exec(`cd ${root}; pr-local-scripts/script/submodules-to-main.sh .`);
    //     proc.stdout?.setEncoding('utf-8');
    //     proc.stderr?.setEncoding('utf-8');
    //     const out = vscode.window.createOutputChannel('submodules-to-main.sh');
    //     out.show();

    //     proc.on('exit', (code) => {
    //         console.log('exit code of submodules-to-main.sh: ', code);
    //         if (code === 0) {
    //             vscode.window.showInformationMessage('submodules-to-main.sh successful.');
    //         } else {
    //             vscode.window.showErrorMessage('submodules-to-main.sh failed.');
    //         }
    //     });
    //     proc.on('message', (message, sendHandle) => {
    //         console.log('message with', message, sendHandle);
    //     });
    //     proc.on('error', (err) => {
    //         console.log('error with', err);
    //     });
    //     proc.on('disconnect', () => {
    //         console.log('disconnect');
    //     });
    //     proc.on('spawn', () => {
    //         console.log('spawn');
    //     });
    //     proc.stdout?.on('data', (chunk) => {
    //         assert(typeof chunk === 'string');
    //         console.log('stdout data', chunk);
    //         out.appendLine(chunk);
    //     });
    //     proc.stderr?.on('data', (chunk) => {
    //         assert(typeof chunk === 'string');
    //         console.log('stderr data', chunk);
    //         out.appendLine(chunk);
    //     });

    // } catch (reason) {
    //     console.error('submodules-to-main.sh threw', reason);
    //     if (reason instanceof Error) {
    //         vscode.window.showErrorMessage(`submodules-to-main.sh threw ${reason.name}: ${reason.message}`);
    //     }
    //     return;
    // }

}

/**
 * @deprecated
 */
let featureBranch: string = '';

export async function startCommonFeatureBranch() {
    const root = workspaceRoot();
    await asyncShell(`cd "${root}"; pwd`, myOutputChannel());
    const curBranch = syncShell(`cd "${root}"; git branch --show-current`).trim();

    
    if (curBranch !== 'local') {
        vscode.window.showErrorMessage('startCommonFeatureBranch nur ausführbar, wenn im Branch local, aber in branch "' + curBranch + "'");
        return;
    }

    const branch = await sanitizedInput({
        prompt: 'name of the new feature branch to create',
        value: 'for-common',
        allow: /^[a-zA-Z-_0-9]+$/,
    });
    
    if (branch == null) {
        return;
    }

    const out = myOutputChannel();
    out.show();
    const res = await asyncShell(`cd "${root}"; git switch -c "${branch}"`, out);
    
    if (res.code === 0) {
        featureBranch = branch;
    }
}

export async function finishCommonFeatureBranch() {
    const root = workspaceRoot();
    await asyncShell(`cd "${root}"; pwd`, myOutputChannel());
    const curBranch = syncShell(`cd "${root}"; git branch --show-current`).trim();

    if (curBranch === 'local' || curBranch === 'common' || curBranch === 'main') {
        vscode.window.showErrorMessage('Must not be in one of the standard branches local, main or common, but in a feature branch!');
        return;
    }

    await asyncShell(`cd "${root}"; pr-local-scripts/script/rebase-and-merge-feature-branch.sh . "${curBranch}"`, myOutputChannel());
}