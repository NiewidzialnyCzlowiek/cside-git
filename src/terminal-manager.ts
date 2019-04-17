import * as vscode from 'vscode';
import { Environment } from './interfaces/environment';

export class TerminalManager {
    private readonly environmentGlobalId = "environment";
    readonly terminalName = "cside-git";
    private terminal: vscode.Terminal = vscode.window.createTerminal(this.terminalName);
    private navModulesLoaded: boolean = false;
    
    constructor(private context: vscode.ExtensionContext) { 
        this.initializeTerminal(false);
    }

    tryToRestartTerminalOnDidCloseTerminal(forceRestart?: boolean) {
        if(forceRestart) {
            const terminal = vscode.window.terminals.find((term) => term.name === this.terminalName);
            if(terminal) {
                terminal.dispose();
            }
            this.initializeTerminal(true);
        } else {
            this.askIfRestartTerminal()
                .then(() => {
                    this.initializeTerminal(true);
                })
                .catch((e) => {
                    vscode.window.showErrorMessage(e.message);
                });
        }
    }
    
    runLoadNavModules(env?: Environment) {
        if(env) {
            this.runCommand(`&"${env.navModulesPath}"`, []);
            this.navModulesLoaded = true;
        } else {
            this.getEnvironment()
                .then((env) => {
                    this.runCommand(`&"${env.navModulesPath}"`, []);
                    this.navModulesLoaded = true;
                })
                .catch((e) => {
                    vscode.window.showErrorMessage(e.message);
                });
        }
    }

    runInitializeEnvironement() {
        this.getEnvironment()
            .then((env) => {
                if(!this.navModulesLoaded) {
                    this.runLoadNavModules(env);
                }
                this.runCommand("Initialize-NAVEnvironment", [`-Repo "${env.repository}"`, `-DatabaseName "${env.databaseName}"`]);	
            })
            .catch((e) => {
                vscode.window.showErrorMessage(`Cannot initialize local environemnt. ${e.message}`);
            });
    }

    runUpdateLocalRepo() {
        this.getEnvironment()
            .then((env) => {
                if(!this.navModulesLoaded) {
                    this.runLoadNavModules(env);
                }
                this.runCommand("Update-LocalRepo", [`-DatabaseName "${env.databaseName}"`]);	
            })
            .catch((e) => {
                vscode.window.showErrorMessage(`Cannot update local repository. ${e.message}`);
            });
    }

    private getEnvironment() {
        return new Promise<Environment>((resolve, reject) => {
            let env: Environment | undefined = this.context.workspaceState.get(this.environmentGlobalId);
            if(env) {
                return resolve(env);
            }
            else {
                return reject(new Error("The C/SIDE environment is not loaded."));
            }
        });
    }

    private initializeTerminal(createTerminal: boolean) {
        if(createTerminal) {
            this.terminal = vscode.window.createTerminal(this.terminalName);
            this.navModulesLoaded = false;
        }
        if (this.terminal) {
            this.terminal.sendText('powershell');
            this.terminal.sendText('Import-Module ' + this.context.asAbsolutePath('PSModules/Core.psm1'));
            this.terminal.show(true);
        }
    }

    public runCommand(command: string, params: string[]) {
        command = `${command} ${params.join(" ")}`;
        if (!vscode.window.terminals.find((term) => term.name === this.terminalName)) {
            vscode.window.showErrorMessage('Cannot find active cside-git terminal. You can create a new terminal with Create Terminal command in Command Pallet.');
        } else {
            this.terminal.sendText(command);
        }
        // if(this.terminal) {
        //     this.terminal.sendText(command);
        // } else {
        //     this.askIfRestartTerminal()
        //         .then(() => this.terminal.sendText(command))
        //         .catch(() => vscode.window.showErrorMessage("Cannot find active cside-git terminal"));
        // }
    }
    
    public showTerminal() {
        this.terminal.show(true);
    }
    
    public hideTerminal() {
        this.terminal.hide();
    }
    
    public finalize() {
        this.terminal.dispose();
    }
    
    private async askIfRestartTerminal() {
        return new Promise<boolean>((resolve, reject) => {
            const messageItems = [
                { title: 'Yes' },
                { title: 'No' }
            ] as vscode.MessageItem[];
            vscode.window.showErrorMessage('C/SIDE Git terminal has been closed. Should we restart it?', { modal: false }, messageItems[0], messageItems[1])
                .then((value: vscode.MessageItem | undefined) => {
                    if (value) {
                        if (value.title === messageItems[0].title) {
                            resolve(true);
                        } else {
                            reject(new Error("Couldn't restart terminal"));
                        }
                    }
                });
        });
    }
}
