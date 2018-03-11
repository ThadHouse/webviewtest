import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { IWindowView, IWindowProvider, IHTMLProvider } from './interfaces';
import * as path from 'path';
import * as fs from 'fs';

export class RioLogWindowView extends EventEmitter implements IWindowView {
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

    handleSave(_: any): Promise<boolean> {
        return new Promise((resolve, _) => {
            resolve();
        });
    }
}

export class RioLogWebviewProvider implements IWindowProvider {
    createWindowView(): IWindowView {
        return new RioLogWindowView();
    }
}

export class RioLogHTMLProvider implements IHTMLProvider {
    private html: string | undefined;
    private js: string | undefined;

    async load(resourceRoot: string): Promise<void> {
        let htmlFile = path.join(resourceRoot, 'index.html');
        let jsFile = path.join(resourceRoot, 'scripts.js');

        let htmlPromise = new Promise<string>((resolve, reject) => {
            fs.readFile(htmlFile, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });

        let jsPromise = new Promise<string>((resolve, reject) => {
            fs.readFile(jsFile, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });

        await Promise.all([htmlPromise, jsPromise]);
    }

    getHTML(): string {
        if (this.html === undefined) {
            return '';
        }
        return this.html;
    }
    
    getScripts() {
        if (this.js === undefined) {
            return '';
        }
        return this.js;
    }
}