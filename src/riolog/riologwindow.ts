'use strict';

import * as vscode from 'vscode';
import { RioConsole } from './rioconsole';
import { PrintMessage, ErrorMessage, IMessage } from './message';
import * as path from 'path';
import * as fs from 'fs';

export class RioLogWindow {
  private webview: vscode.Webview | undefined = undefined;
  private riocon: RioConsole | undefined = undefined;
  private running: boolean = false;
  private disposables: vscode.Disposable[] = [];
  private htmlFile: string;

  constructor(resourceRoot: string) {
    this.htmlFile = path.join(resourceRoot, 'index.html');
  }

  private createWebView() {
    this.webview = vscode.window.createWebview(vscode.Uri.parse('wpilib:riolog'), 'RioLog',
      vscode.ViewColumn.Three,
      {
        enableScripts: true,
        enableCommandUris: true
      });

    this.webview.html = fs.readFileSync(this.htmlFile,'utf8');
  }

  private createRioCon() {
    this.riocon = new RioConsole();
  }

  start(teamNumber: number) {
    if (this.running) {
      return;
    }
    this.running = true;
    this.createWebView();
    this.createRioCon();
    this.webview!.onDidDispose(() => {
      if (this.riocon !== undefined) {
        this.riocon.stop();      
        this.riocon.removeAllListeners();  
      }
      this.riocon = undefined;
      this.webview = undefined;
      this.running = false;
    });

    this.webview!.onDidReceiveMessage((data) => {
      if (this.riocon === undefined) {
        return;
      }
      if (data.type === 'pause') {
        if (this.riocon.getDiscard()) {
          this.riocon.setDiscard(false);
        } else {
          this.riocon.setDiscard(true);
        }
        // Discard

      } else if (data.type === 'click2') {
        if (this.webview === undefined) {
          return;
        }
        // Clear
        this.webview.postMessage({
          type: 'clear'
        });
      }
    }, null, this.disposables);

    this.riocon!.on('message', (m: IMessage) => {
      if (this.webview === undefined) {
        return;
      }
      if (m instanceof PrintMessage) {
        this.webview.postMessage({
              type: 'print',
              message: m
          });
      } else if (m instanceof ErrorMessage) {
          if (m.isError()) {
            this.webview.postMessage({
                  type: 'error',
                  message: m
              });
          } else {
            this.webview.postMessage({
                  type: 'warning',
                  message: m
              });
          }
      }
     });

    this.riocon!.startListening(teamNumber);
  }

  stop() {
    if (this.webview !== undefined) {
      this.webview.dispose();
    }
  }

  dispose() {
    this.stop();
    for (let d of this.disposables) {
      d.dispose();
    }
  }
}