'use strict';

import { EventEmitter } from 'events';
import { IPrintMessage, IErrorMessage } from './message';

export enum SendTypes {
    Batch,
    ConnectionChanged,
    PauseUpdate,
    New
}

export interface IIPCSendMessage {
    type: SendTypes;
    message: IPrintMessage | IErrorMessage | (IPrintMessage | IErrorMessage)[] | boolean | number;
}

export enum ReceiveTypes {
    Discard,
    Pause,
    Save,
    Reconnect
}

export interface IIPCReceiveMessage {
    type: ReceiveTypes;
    message: boolean | string[];
}

export interface IWindowProvider {
    createWindowView(): IWindowView;
}

export interface IWindowView extends EventEmitter, IDisposable {
    postMessage(message: IIPCSendMessage): Promise<boolean>;
    handleSave(saveData: (IPrintMessage | IErrorMessage)[]): Promise<boolean>;
}

export interface IDisposable {
    // tslint:disable-next-line:no-any
    dispose(): any;
}

export interface IRioConsole extends EventEmitter, IDisposable {
    connected: boolean;
    discard: boolean;
    stop(): void;
    startListening(teamNumber: number): void;
    setAutoReconnect(autoReconnect: boolean): void;
    getAutoReconnect(): boolean;
    disconnect(): void;
}

export interface IRioConsoleProvider {
    getRioConsole(): IRioConsole;
}