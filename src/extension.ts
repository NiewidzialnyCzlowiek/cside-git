// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TerminalManager } from './terminal-manager';
import { Environment } from './interfaces/environment';

let globalContext: vscode.ExtensionContext;
const environmentGlobalId = "environment";

export function activate(context: vscode.ExtensionContext) {
	globalContext = context;
	let terminalManager = new TerminalManager(globalContext);
	importEnvironmentSettings();

	globalContext.subscriptions.push(vscode.commands.registerCommand('cside-git.createTerminal', () => {
		terminalManager.tryToRestartTerminalOnDidCloseTerminal(true);
	}));
	globalContext.subscriptions.push(vscode.commands.registerCommand('cside-git.loadNavModules', () => {
		terminalManager.runLoadNavModules();
	}));
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

	vscode.workspace.onDidSaveTextDocument((document) => {
		if(document.fileName.includes("envir")) {
			importEnvironmentSettings();
		}
	});
	vscode.window.onDidCloseTerminal((terminal) => {
		if(terminal.name === terminalManager.terminalName) {
			terminalManager.tryToRestartTerminalOnDidCloseTerminal();
		}
	});
}

// this method is called when your extension is deactivated
export function deactivate() {}

function importEnvironmentSettings() {
	try {
		vscode.workspace.findFiles('*envir*', 'node_modules', 1)
			.then((uris) => {
				return vscode.workspace.openTextDocument(uris[0]);
			})
			.then((document) => {
				let env = JSON.parse(document.getText());
				return env;
			})
			.then((env) => {
				globalContext.workspaceState.update(environmentGlobalId, env);
				vscode.window.showInformationMessage("Environment settings have been loaded");
			});
	} catch(e) {
		console.log(e.message);
	}
}
