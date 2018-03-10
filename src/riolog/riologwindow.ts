'use strict';

import * as vscode from 'vscode';
import { RioConsole } from './rioconsole';
import { PrintMessage, ErrorMessage, IMessage } from './message';
import * as path from 'path';
import * as fs from 'fs';

interface MessageStore {
  type: string;
  message: IMessage;
}

export class RioLogWindow {
  private webview: vscode.Webview | undefined = undefined;
  private riocon: RioConsole | undefined = undefined;
  private running: boolean = false;
  private disposables: vscode.Disposable[] = [];
  private htmlFile: string;
  private pausedArray: MessageStore[] = [];
  private paused: boolean = false;
  private hiddenArray: MessageStore[] = [];

  constructor(resourceRoot: string) {
    this.htmlFile = path.join(resourceRoot, 'index.html');
  }

  private createWebView() {
    this.webview = vscode.window.createWebview(vscode.Uri.parse('wpilib:riolog'), 'RioLog',
      vscode.ViewColumn.Three,
      {
        enableScripts: true,
        enableCommandUris: true,
        retainContextWhenHidden: true,
      }, );

    this.webview.html = fs.readFileSync(this.htmlFile, 'utf8');


    vscode.window.onDidChangeActiveEditor(async (e) => {
      if (this.webview === undefined) {
        return;
      }
      if (e === this.webview) {
        // Window goes active.
        await this.webview.postMessage({
          type: 'batch',
          messages: this.hiddenArray
        });
      }
    });

  }

  private createRioCon() {
    this.riocon = new RioConsole();
  }

  private async sendPaused() {
    if (this.webview === undefined) {
      return;
    }
    let success = await this.webview.postMessage({
      type: 'batch',
      messages: this.pausedArray
    });
    if (!success) {
      this.hiddenArray.push(...this.pausedArray);
    }
    this.pausedArray = [];
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

    this.webview!.onDidReceiveMessage(async (data) => {
      if (this.riocon === undefined) {
        return;
      }
      if (data.type === 'discard') {
        if (data.value === false) {
          this.riocon.setDiscard(false);
        } else {
          this.riocon.setDiscard(true);
        }
        // Discard

      } else if (data.type === 'pause') {
        let old = this.paused;
        this.paused = data.value;
        if (old === true && data.value === false) {
          await this.sendPaused();
        }
      } else if (data.type === 'save') {
        let deserializedLogs = [];
        for (let d of data.items) {
          let parsed = JSON.parse(d.message);
          deserializedLogs.push({
            type: d.type,
            message: parsed
          });
        }
        let serialized = JSON.stringify(deserializedLogs, null, 4);
        vscode.workspace.openTextDocument({
          language: 'json',
          content: serialized
        }).then((d) => {
          if (this.webview !== undefined) {
            vscode.window.showTextDocument(d, this.webview.viewColumn);
          }
          console.log('opened file');
        });
      }

      else if (data.type === 'click2') {
        if (this.webview === undefined) {
          return;
        }
        // Clear
        this.webview.postMessage({
          type: 'clear'
        });
      }
    }, null, this.disposables);

    this.riocon!.on('message', async (m: IMessage) => {
      if (this.webview === undefined) {
        return;
      }
      let message: MessageStore | undefined = undefined;
      if (m instanceof PrintMessage) {
        message = {
          type: 'print',
          message: m
        };
      } else if (m instanceof ErrorMessage) {
        if (m.isError()) {
          message = {
            type: 'error',
            message: m
          };
        } else {
          message = {
            type: 'warning',
            message: m
          };
        }
      }
      if (message === undefined) {
        return;
      }
      if (this.paused === true) {
        this.pausedArray.push(message);
        this.webview.postMessage({
          type: 'pauseupdate',
          count: this.pausedArray.length
        });
      } else {
        let success = await this.webview.postMessage(message);
        if (!success) {
          this.hiddenArray.push(message);
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