'use strict';

import * as vscode from 'vscode';
import { RioConsole } from './rioconsole';
import { PrintMessage, ErrorMessage } from './message';

export class RioLogWindow {
  private webview: vscode.Webview | undefined = undefined;
  private riocon: RioConsole | undefined = undefined;
  private running: boolean = false;
  private disposables: vscode.Disposable[] = [];

  private createWebView() {
    this.webview = vscode.window.createWebview(vscode.Uri.parse('wpilib:riolog'), 'RioLog',
      vscode.ViewColumn.Three,
      {
        enableScripts: true,
        enableCommandUris: true
      });

    this.webview.html = `
<ul id="list" style="list-style-type:none;padding:0;position:fixed;bottom: 40px"></ul>
<ul style="position:fixed;bottom: 0px;left:0px;list-style-type:none;padding-bottom:0;padding-left:0;padding-top:0;padding-right:0;width: 49.8%; margin-bottom: 1px">
    <li style="margin-bottom: 2px">
        <button type="button" onclick="
window.parent.postMessage({
    type: 'click1'
    }, '*');
" style="width: 100%">Click Me!</button>
    </li>
    <li>
        <button type="button" onclick="
window.parent.postMessage({
    type: 'click3'
    }, '*');
" style="width: 100%">Click 3!</button>
    </li>
</ul>
<ul style="position:fixed;bottom: 0px;right:0px;list-style-type:none;padding-bottom:0;padding-left:0;padding-top:0;padding-right:0;width: 49.8%;margin-bottom: 1px">
    <li style="margin-bottom: 2px">
        <button type="button" onclick="
window.parent.postMessage({
    type: 'click2'
    }, '*');
" style="width: 100%">Click 2!</button>
    </li>
    <li>
        <button type="button" onclick="
window.parent.postMessage({
    type: 'click4'
    }, '*');
" style="width: 100%">Click 4!</button>
    </li>
</ul>

<script>
    window.addEventListener('message', event => {
        if (event.data.type === 'print') {
            var ul = document.getElementById("list");
            var li = document.createElement("li");
            li.innerHTML = event.data.message.line;
            ul.appendChild(li);
            document.body.scrollTop = document.body.scrollHeight
        } else if (event.data.type === 'warning') {
            var ul = document.getElementById("list");
            var li = document.createElement("li");
            li.setAttribute("style", "color:Yellow;")
            li.innerHTML = event.data.message.details;
            ul.appendChild(li);
            document.body.scrollTop = document.body.scrollHeight
        } else if (event.data.type === 'error') {
            var ul = document.getElementById("list");
            var li = document.createElement("li");
            li.setAttribute("style", "color:Red;")
            li.innerHTML = event.data.message.details;
            ul.appendChild(li);
            document.body.scrollTop = document.body.scrollHeight
        } else if (event.data.type === 'clear') {
            document.getElementById("list").innerHTML = "";
        }
    });
</script>
`;

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
        this.riocon.clearListener();  
      }
      this.riocon = undefined;
      this.webview = undefined;
      this.running = false;
    });

    this.webview!.onDidReceiveMessage((data) => {
      if (this.riocon === undefined) {
        return;
      }
      if (data.type === 'click1') {
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

    this.riocon!.addListener((m) => {
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