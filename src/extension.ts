'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { RioLogWindow } from './riolog/riologwindow';
import * as path from 'path';
import * as fs from 'fs';
import { IHTMLProvider, IWindowProvider, IWindowView } from './riolog/interfaces';
import { EventEmitter } from 'events';

class RioLogWindowView extends EventEmitter implements IWindowView {
    private webview: vscode.Webview;
    private disposables: vscode.Disposable[] = [];

    constructor() {
        super();
        this.webview = vscode.window.createWebview(vscode.Uri.parse('wpilib:riolog'),
            'RioLog', vscode.ViewColumn.Three, {
                enableScripts: true,
                enableCommandUris: true,
                retainContextWhenHidden: true
            });
        
        this.disposables.push(this.webview);
        
        vscode.window.onDidChangeActiveEditor(async (e) => {
            if (e === this.webview) {
                this.emit('windowActive');
            }
        }, null, this.disposables);

        this.webview.onDidReceiveMessage((data) => {
            this.emit('didReceiveMessage', data);
        }, null, this.disposables);

        this.webview.onDidDispose(() => {
            this.emit('didDispose');
        }, null, this.disposables);
    }

    setHTML(html: string, scripts: string): void {
        let htmlString = `${html}
<script>
${scripts}
</script>
`;
        this.webview.html = htmlString;
    }
    postMessage(message: any): Thenable<boolean> {
        return this.webview.postMessage(message);
    }
    dispose() {
        for (let d of this.disposables) {
            d.dispose();
        }
    }
}

class RioLogWebviewProvider implements IWindowProvider {
    createWindowView(): IWindowView {
        return new RioLogWindowView();
    }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "webview-test" is now active!');

    let extensionResourceLocation = path.join(context.extensionPath, 'resources');

    let html = fs.readFileSync(path.join(extensionResourceLocation, 'index.html'), 'utf8');
    let js = fs.readFileSync(path.join(extensionResourceLocation, 'scripts.js'), 'utf8');

    let htmlProvider: IHTMLProvider = {
        getHTML() {
            return html;
        },
        getScripts() {
            return js;
        }
    };

    let viewProvider = new RioLogWebviewProvider();

    let window = new RioLogWindow(htmlProvider, viewProvider);

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
        // The code you place here will be executed every time your command is executed

        window.start(9999);
        // Display a message box to the user
        //vscode.window.showInformationMessage('Hello World!');
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(window);
}

// this method is called when your extension is deactivated
export function deactivate() {
}