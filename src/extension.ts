// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TerminalManager } from './terminal-manager';
import { Environment, EnvironmentType } from './interfaces/environment';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createDefaultEnvironment, createDefaultLocalEnvironment, createDefaultContainerEnvironment } from './default-values';

let globalContext: vscode.ExtensionContext;
const environmentGlobalId = "environment";

export function activate(context: vscode.ExtensionContext) {
	globalContext = context;
	let terminalManager = new TerminalManager(globalContext);
	importEnvironmentSettings();

	globalContext.subscriptions.push(vscode.commands.registerCommand('cside-git.newProject', () => {
		createCSIDEProject();
	}));
	globalContext.subscriptions.push(vscode.commands.registerCommand('cside-git.createTerminal', () => {
		terminalManager.tryToRestartTerminalOnDidCloseTerminal(true);
	}));
	globalContext.subscriptions.push(vscode.commands.registerCommand('cside-git.loadNavModules', () => {
		terminalManager.runLoadNavModules();
	}));
	globalContext.subscriptions.push(vscode.commands.registerCommand('cside-git.initializeRemoteWithLocalDev', () => {
		terminalManager.runInitializeRemoteRepoWithLocalDev()
	}))
	globalContext.subscriptions.push(vscode.commands.registerCommand('cside-git.initializeEnvironment', () => {
		terminalManager.runInitializeEnvironement();
	}));	
	globalContext.subscriptions.push(vscode.commands.registerCommand('cside-git.updateLocalRepo', () => {
		terminalManager.runUpdateLocalRepoWithLocalDev();
	}));	
	globalContext.subscriptions.push(vscode.commands.registerCommand('cside-git.updateLocalDev', () => {
		terminalManager.runUpdateLocalDevWithLocalRepo();
	}));
	globalContext.subscriptions.push(vscode.commands.registerCommand('cside-git.updateRemoteRepo', () => {
		terminalManager.runUpdateRemoteRepoWithLocalRepo();
	}));
	globalContext.subscriptions.push(vscode.commands.registerCommand('cside-git.updateLocalRepoWithRemote', () => {
		terminalManager.runUpdateLocalRepoWithRemoteRepo();
	}));

	globalContext.subscriptions.push(vscode.workspace.onDidSaveTextDocument((document) => {
		if(document.fileName.includes("envir")) {
			importEnvironmentSettings();
		}
	}));
	globalContext.subscriptions.push(vscode.window.onDidCloseTerminal((terminal) => {
		if(terminal.name === terminalManager.terminalName) {
			terminalManager.tryToRestartTerminalOnDidCloseTerminal();
		}
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {}

async function createCSIDEProject() {
	const options: vscode.OpenDialogOptions = {
		canSelectFiles: false,
		canSelectFolders: true,
		canSelectMany: false,
		openLabel: "Select project location"
	};
	vscode.window.showOpenDialog(options)
		.then((uri) => {
			if(uri && uri[0]) {
				createAndOpenNewProject(uri[0]);
			}
		});
}

function createAndOpenNewProject(uri: vscode.Uri) {
	const projectLocation = createProjectDirectory(uri);
	const [items, options] = createEnvironmentQuickPickItemsAndOptions();
	const path = join(projectLocation, "nav-environment.json");
	if(!existsSync(path)) {
		vscode.window.showQuickPick(items, options)
			.then((selectedItem) => {
				if (selectedItem) {
					let env = createDefaultEnvironment();
					if(selectedItem.label === EnvironmentType.local) {
						env = createDefaultLocalEnvironment();
					}
					else {
						env = createDefaultContainerEnvironment();
					}
					writeFileSync(path, JSON.stringify(env, undefined, 4), 'utf8');
				}
			})
			.then(() => {
				vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.parse("file:///" + projectLocation));
			});
	} else {
		vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.parse("file:///" + projectLocation));
	}
}

function createProjectDirectory(uri: vscode.Uri) {
	const location = uri.fsPath;
	if(!existsSync(location)) {
		mkdirSync(location);
	}
	return location;
}


function createEnvironmentQuickPickItemsAndOptions(): [vscode.QuickPickItem[], vscode.QuickPickOptions] {
	const items: vscode.QuickPickItem[] = [
		{
			label: EnvironmentType.local,
			description: "Local installation of development environement"
		},
		{
			label: EnvironmentType.container,
			description: "Development environment hosted inside a container"
		}
	]
	const options: vscode.QuickPickOptions = {
		canPickMany: false,
		ignoreFocusOut: true
	};
	return [items, options];
}


function importEnvironmentSettings() {
	vscode.workspace.findFiles('*envir*', 'node_modules', 1)
		.then((uris) => {
			return vscode.workspace.openTextDocument(uris[0]);
		})
		.then((document) => {
			const env = JSON.parse(document.getText()) as Environment;
			vscode.window.showTextDocument(document);
			return env;
		})
		.then((env) => {
			globalContext.workspaceState.update(environmentGlobalId, env);
		});
}
