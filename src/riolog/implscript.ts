'use strict';

import { addPrint, addError, onConnect, onDisconnect, checkResize, } from './sharedscript';

export function sendMessage(message: any) {
    window.parent.postMessage(message, '*');
}

window.addEventListener('message', event => {
    if (event.data.type === 'print') {
        addPrint(event.data.message);
        document.body.scrollTop = document.body.scrollHeight;
    } else if (event.data.type === 'warning') {
        addError(event.data.message, 'warning');
        document.body.scrollTop = document.body.scrollHeight;
    } else if (event.data.type === 'error') {
        addError(event.data.message, 'error');
        document.body.scrollTop = document.body.scrollHeight;
    } else if (event.data.type === 'clear') {
        document.getElementById('list')!.innerHTML = '';
    } else if (event.data.type === 'batch') {
        for (let message of event.data.messages) {
            if (message.type === 'print') {
                addPrint(message.message);
            } else if (message.type === 'warning') {
                addError(message.message, 'warning');
            } else if (message.type === 'error') {
                addError(message.message, 'error');
            }
        }
        document.body.scrollTop = document.body.scrollHeight;
    } else if (event.data.type === 'pauseupdate') {
        let pause = document.getElementById('pause');
        if (pause !== null) {
            pause.innerHTML = 'Paused: ' + event.data.count;
        }
    } else if (event.data.type === 'connected') {
        onConnect();
    } else if (event.data.type === 'disconnected') {
        onDisconnect();
    }
    checkResize();
});
