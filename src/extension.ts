'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { RioLogWindow } from './riolog/riologwindow';
import * as path from 'path';
import { RioLogWebviewProvider, LiveRioConsoleProvider, RioLogViewerWebviewProvider, ViewerRioConsoleProvider } from './riolog/vscodeimpl';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "webview-test" is now active!');

    let extensionResourceLocation = path.join(context.extensionPath, 'resources');

    let viewProvider = new RioLogWebviewProvider(extensionResourceLocation);

    let rioConsoleProvider = new LiveRioConsoleProvider();

    let window = new RioLogWindow(viewProvider, rioConsoleProvider);

    let viewerViewProvider = new RioLogViewerWebviewProvider(extensionResourceLocation);
    let rioConsoleViewerProvider = new ViewerRioConsoleProvider();

    let window2 = new RioLogWindow(viewerViewProvider, rioConsoleViewerProvider);

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
        // The code you place here will be executed every time your command is executed

        window.start(9999);
        // Display a message box to the user
        //vscode.window.showInformationMessage('Hello World!');
    });

    let disposable2 = vscode.commands.registerCommand('extension.viewer', () => {
        window2.start(9999);
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(disposable2);
    context.subscriptions.push(window);
}

// this method is called when your extension is deactivated
export function deactivate() {
}