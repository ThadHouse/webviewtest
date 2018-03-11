'use strict';
import { EventEmitter } from 'events';

export interface IWindowProvider {
    createWindowView(): IWindowView;
}

export interface IWindowView extends EventEmitter, IDisposable {
    setHTML(html: string, scripts: string): void;
    postMessage(message: any): Thenable<boolean>;
    handleSave(saveData: any): Promise<boolean>;
}

export interface IDisposable {
    dispose(): any;
}

export interface IHTMLProvider {
    getHTML(): string;
    getScripts(): string;
}