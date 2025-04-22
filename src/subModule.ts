import {mkdir, rm, rmdir } from "fs/promises";
import * as vscode from 'vscode';
import { subPath, workspaceRoot } from "./utils";
import { chdir, execArgv, execPath } from "process";
import { exec, execFile, execSync } from "child_process";
import { execOnce } from "next/dist/shared/lib/utils";
import { chmod, constants } from "fs";

export async function subModuleInstall() {
    const root = workspaceRoot();
    const folder = subPath(root, 'app/_lib/submodules/pr-undo-manager');

    try {
        const output = execSync(`git clone --depth=1 git@github.com:preitinger/pr-undo-manager.git ${folder}`, {
            encoding: 'utf-8'
        });
        console.log('output of execSync:', output);
    } catch (reason) {
        console.error('execSync for git clone threw', reason);
        return;
    }

    try {
        await rm(subPath(folder, '.git'), {
            recursive: true,
        });
    } catch (reason) {
        console.error('caught in rmdir', reason);
        return;
    }

    try {
        execSync(`chmod -R -w ${folder}`);
    } catch (reason) {
        console.error('caught in execSync for chmod', reason);
    }

    // try {
    //     chmod(folder, constants.R_OK, (err) => {
    //         if (err) {
    //             console.error(err);
    //         } else {
    //             console.log('chmod successful');
    //         }
    //     });
    // } catch (reason) {
    //     console.error('caught in chmod', reason);
    // }
}