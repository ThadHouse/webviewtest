'use strict';

import { IMessage } from './message';
import { IWindowView, IDisposable, IHTMLProvider, IWindowProvider, IRioConsole, IRioConsoleProvider } from './interfaces';


interface MessageStore {
  type: string;
  message: IMessage;
}

export class RioLogWindow {
  private webview: IWindowView | undefined = undefined;
  private rioConsole: IRioConsole | undefined = undefined;
  private running: boolean = false;
  private disposables: IDisposable[] = [];
  private pausedArray: MessageStore[] = [];
  private paused: boolean = false;
  private hiddenArray: MessageStore[] = [];
  private htmlProvider: IHTMLProvider;
  private windowProvider: IWindowProvider;
  private rioConsoleProvider: IRioConsoleProvider;

  constructor(htmlProv: IHTMLProvider, windowProv: IWindowProvider, rioConProivder: IRioConsoleProvider) {
    this.htmlProvider = htmlProv;
    this.windowProvider = windowProv;
    this.rioConsoleProvider = rioConProivder;
  }

  private createWebView() {
    this.webview = this.windowProvider.createWindowView();
    this.webview.setHTML(this.htmlProvider.getHTML(), this.htmlProvider.getScripts());
    this.webview.on('windowActive', async () => {
      if (this.webview === undefined) {
        return;
      }
      // Window goes active.
      await this.webview.postMessage({
        type: 'batch',
        messages: this.hiddenArray
      });
      if (this.rioConsole !== undefined) {
        if (this.rioConsole.connected === true) {
          await this.webview.postMessage({
            type: 'connected'
          });
        } else {
          await this.webview.postMessage({
            type: 'disconnected'
          });
        }
      }
    });
  }

  private createRioConsole() {
    this.rioConsole = this.rioConsoleProvider.getRioConsole();
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
    this.createRioConsole();
    this.webview!.on('didDispose', () => {
      if (this.rioConsole !== undefined) {
        this.rioConsole.stop();
        this.rioConsole.removeAllListeners();
      }
      this.rioConsole = undefined;
      this.webview = undefined;
      this.running = false;
    });

    this.webview!.on('didReceiveMessage', async (data: any) => {
      this.onMessageReceived(data);
    });

    this.rioConsole!.on('connectionChanged', async (c: boolean) => {
      this.onConnectionChanged(c);
    });

    this.rioConsole!.on('message', (m: IMessage) => {
      this.onNewMessageToSend(m);
    });

    this.rioConsole!.startListening(teamNumber);
  }

  private async onConnectionChanged(connected: boolean) {
    if (this.webview === undefined) {
      return;
    }
    if (connected) {
      await this.webview.postMessage({
        type: 'connected'
      });
    } else {
      await this.webview.postMessage({
        type: 'disconnected'
      });
    }
  }

  private async onNewMessageToSend(m: any) {
    if (this.webview === undefined) {
      return;
    }
    let message: MessageStore | undefined = undefined;
    if ('line' in m) {
      message = {
        type: 'print',
        message: m
      };
    } else if ('details' in m) {
      if ((m.flags & 1) !== 0) {
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
      await this.webview.postMessage({
        type: 'pauseupdate',
        count: this.pausedArray.length
      });
    } else {
      let success = await this.webview.postMessage(message);
      if (!success) {
        this.hiddenArray.push(message);
      }
    }
  }

  private async onMessageReceived(data: any): Promise<void> {
    if (this.rioConsole === undefined) {
      return;
    }
    if (data.type === 'discard') {
      if (data.value === false) {
        this.rioConsole.discard = false;
      } else {
        this.rioConsole.discard = true;
      }
    } else if (data.type === 'pause') {
      let old = this.paused;
      this.paused = data.value;
      if (old === true && data.value === false) {
        await this.sendPaused();
      }
    } else if (data.type === 'save') {
      if (this.webview === undefined) {
        return;
      }
      let deserializedLogs = [];
      for (let d of data.items) {
        let parsed = JSON.parse(d.message);
        deserializedLogs.push({
          type: d.type,
          message: parsed
        });
      }
      await this.webview.handleSave(deserializedLogs);
    } else if (data.type === 'reconnect') {
      this.rioConsole.setAutoReconnect(data.value);
      if (data.value === false) {
        this.rioConsole.disconnect();
      }
    }
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