import * as vscode from 'vscode';
import { Environment, EnvironmentType } from './interfaces/environment';

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
            if(env.type === EnvironmentType.local) {
                this.runCommand(`&"${env.navModules.navModelToolsPath}"`, []);
                if(env.navModules.navAdminToolPath) {
                    this.runCommand(`&"${env.navModules.navAdminToolPath}"`, []);
                }
                this.navModulesLoaded = true;
            }
        } else {
            this.getEnvironment()
                .then((env) => {
                    this.runCommand(`&"${env.navModules.navModelToolsPath}"`, []);
                    if(env.navModules.navAdminToolPath) {
                        this.runCommand(`&"${env.navModules.navAdminToolPath}"`, []);
                    }
                    this.navModulesLoaded = true;
                })
                .catch((e) => {
                    vscode.window.showErrorMessage(e.message);
                });
        }
    }

    runInitializeRemoteRepoWithLocalDev() {
        this.getEnvironment()
            .then((env) => {
                if(env.type == EnvironmentType.container) {
                    this.runCommand("Initialize-RemoteRepoWithLocalDev", 
                        [`-RemoteRepo "${env.repository.remoteRepository}"`,
                        `-DatabaseName "${env.database.databaseName}"`,
                        `-SourcesDirectory "${env.repository.localSourcesDirectory}"`,
                        `-ContainerName "${env.container.name}"`,
                        '-UseContainers $true']);
                    }
                    else {
                        if(!this.navModulesLoaded) {
                            this.runLoadNavModules(env);
                        }
                        this.runCommand("Initialize-RemoteRepoWithLocalDev",
                        [`-RemoteRepo "${env.repository.remoteRepository}"`,
                        `-DatabaseName "${env.database.databaseName}"`,
                        `-SourcesDirectory "${env.repository.localSourcesDirectory}"`,
                        '-UseContainers $false']);
                }
            })
            .catch((e) => {
                vscode.window.showErrorMessage(`Cannot initialize remote repository. ${e.message}`);
            });
    }

    runInitializeEnvironement() {
        this.getEnvironment()
            .then((env) => {
                if(env.type == EnvironmentType.container) {
                    this.runCommand("Initialize-NavEnvironment", 
                        [`-RemoteRepo "${env.repository.remoteRepository}"`,
                        `-DatabaseName "${env.database.databaseName}"`, 
                        `-SourcesDirectory "${env.repository.localSourcesDirectory}"`,
                        `-ContainerName "${env.container.name}"`,
                        '-UseContainers $true']);
                }
                else {
                    if(!this.navModulesLoaded) {
                        this.runLoadNavModules(env);
                    }
                    this.runCommand("Initialize-NavEnvironment",
                        [`-RemoteRepo "${env.repository.remoteRepository}"`,
                        `-DatabaseName "${env.database.databaseName}"`,
                        `-SourcesDirectory "${env.repository.localSourcesDirectory}"`,
                        '-UseContainers $false']);	
                }
            })
            .catch((e) => {
                vscode.window.showErrorMessage(`Cannot initialize local environemnt. ${e.message}`);
            });
    }
    
    runUpdateLocalRepoWithLocalDev() {
        this.getEnvironment()
            .then((env) => {
                if(env.type === EnvironmentType.container) {
                    this.runCommand("Update-LocalRepoWithContainerDev",
                        [`-ContainerName "${env.container.name}"`,
                        `-DatabaseName "${env.database.databaseName}"`,
                        `-SourcesDirectory "${env.repository.localSourcesDirectory}"`,
                        `-ExportToNewSyntax \$${env.container.exportObjectsToNewSyntax}`]);	
                }
                else {
                    if(!this.navModulesLoaded) {
                        this.runLoadNavModules(env);
                    }
                    this.runCommand("Update-LocalRepoWithLocalDev", [`-DatabaseName "${env.database.databaseName}"`, `-SourcesDirectory "${env.repository.localSourcesDirectory}"`]);	
                }
            })
            .catch((e) => {
                vscode.window.showErrorMessage(`Cannot update local repository. ${e.message}`);
            });
    }

    runUpdateLocalDevWithLocalRepo() {
        this.getEnvironment()
            .then((env) => {
                if(env.type === EnvironmentType.container) {
                    this.runCommand("Update-ContainerDevWithLocalRepo", 
                        [`-ContainerName "${env.container.name}"`,
                        `-DatabaseName "${env.database.databaseName}"`,
                        `-SourcesDirectory "${env.repository.localSourcesDirectory}"`]);	
                }
                else {
                    if(!this.navModulesLoaded) {
                        this.runLoadNavModules(env);
                    }
                    this.runCommand("Update-LocalDevWithLocalRepo", [`-DatabaseName "${env.database.databaseName}"`, `-SourcesDirectory "${env.repository.localSourcesDirectory}"`]);	
                }
            })
            .catch((e) => {
                vscode.window.showErrorMessage(`Cannot update local development environment. ${e.message}`);
            });
    }

    runUpdateLocalRepoWithRemoteRepo() {
        this.getEnvironment()
            .then((env) => {
                if(!this.navModulesLoaded) {
                    this.runLoadNavModules(env);
                }
                this.runCommand("Update-LocalRepoWithRemoteRepo", [`-SourcesDirectory "${env.repository.localSourcesDirectory}"`]);	
            })
            .catch((e) => {
                vscode.window.showErrorMessage(`Cannot update local development environment. ${e.message}`);
            });
    }

    runUpdateRemoteRepoWithLocalRepo() {
        this.getEnvironment()
            .then((env) => {
                if(!this.navModulesLoaded) {
                    this.runLoadNavModules(env);
                }
                this.runCommand("Update-RemoteRepoWithLocalRepo", [`-SourcesDirectory "${env.repository.localSourcesDirectory}"`]);
            })
            .catch((e) => {
                vscode.window.showErrorMessage(`Cannot update local development environment. ${e.message}`);
            });
    }

    private getEnvironment() {
        return new Promise<Environment>((resolve, reject) => {
            let env: Environment | undefined = this.context.workspaceState.get(this.environmentGlobalId);
            if(env) {
                return resolve(env);
            }
            else {
                return reject(new Error("The environment settings have not benn loaded."));
            }
        });
    }

    private initializeTerminal(createTerminal: boolean) {
        if(createTerminal) {
            this.terminal = vscode.window.createTerminal(this.terminalName);
            this.navModulesLoaded = false;
        }
        if(this.terminal) {
            this.terminal.show(true);
            if (!this.isPowershellDefaultShell()) {
                this.terminal.sendText('powershell');
            }
            this.terminal.sendText(`Import-Module "${this.context.asAbsolutePath('PSModules/Core')}"`);
        }
    }

    public runCommand(command: string, params: string[]) {
        command = `${command} ${params.join(" ")}`;
        if(!vscode.window.terminals.find((term) => term.name === this.terminalName)) {
            vscode.window.showErrorMessage('Cannot find active cside-git terminal. You can create a new terminal using Create Terminal command in Command Pallet.');
        } else {
            this.terminal.sendText(command);
        }
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
                    if(value) {
                        if(value.title === messageItems[0].title) {
                            resolve(true);
                        } else {
                            reject(new Error("Couldn't restart terminal"));
                        }
                    }
                });
        });
    }

    private isPowershellDefaultShell(): boolean { 
        const integratedShellPath = vscode.workspace.getConfiguration('terminal.integrated.shell').get<string>('windows');
        if (integratedShellPath) {
            return integratedShellPath.includes('powershell') ? true: false;
        } else {
            return true;
        }
    }
}
