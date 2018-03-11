function sendMessage(message) {
    window.parent.postMessage(message, '*');
}

function checkResize() {
    let allowedHeight = document.documentElement.clientHeight - 80;
    let ul = document.getElementById('list');
    let listHeight = ul.clientHeight;
    if (listHeight < allowedHeight) {
        ul.style = 'list-style-type:none;padding:0;position:fixed;bottom:80px';
    } else {
        ul.style = 'list-style-type:none;padding:0'
    }
}

let paused = false;
function onPause() {
    if (paused === true) {
        paused = false;
        document.getElementById('pause').innerHTML = 'Pause';
        sendMessage({
            type: 'pause',
            value: false
        });
    } else {
        paused = true;
        document.getElementById('pause').innerHTML = 'Paused: 0';
        sendMessage({
            type: 'pause',
            value: true
        });
    }
}

let discard = false;
function onDiscard() {
    if (discard === true) {
        discard = false;
        document.getElementById('discard').innerHTML = 'Discard';
        sendMessage({
            type: 'discard',
            value: false
        });
    } else {
        discard = true;
        document.getElementById('discard').innerHTML = 'Resume';
        sendMessage({
            type: 'discard',
            value: true
        });
    }
}

function onClear() {
    document.getElementById("list").innerHTML = "";
}

let showWarnings = true;
function onShowWarnings() {
    if (showWarnings === true) {
        showWarnings = false;
        document.getElementById('showwarnings').innerHTML = 'Show Warnings';
    } else {
        showWarnings = true;
        document.getElementById('showwarnings').innerHTML = 'Don\'t Show Warnings';
    }
    let ul = document.getElementById("list");
    let items = ul.getElementsByTagName("li");
    for (let i = 0; i < items.length; ++i) {
        if (items[i].dataset.type === 'warning') {
            if (showWarnings === true) {
                items[i].style.display = 'inline';
            } else {
                items[i].style.display = 'none';
            }
        }
    }
    checkResize();
}

let showPrints = true;
function onShowPrints() {
    if (showPrints === true) {
        showPrints = false;
        document.getElementById('showprints').innerHTML = 'Show Prints';
    } else {
        showPrints = true;
        document.getElementById('showprints').innerHTML = 'Don\'t Show Prints';
    }
    let ul = document.getElementById("list");
    let items = ul.getElementsByTagName("li");
    for (let i = 0; i < items.length; ++i) {
        if (items[i].dataset.type === 'print') {
            if (showPrints === true) {
                items[i].style.display = 'inline';
            } else {
                items[i].style.display = 'none';
            }
        }
    }
    checkResize();
}

let autoReconnect = true;
function onAutoReconnect() {
    if (autoReconnect === true) {
        autoReconnect = false;
        document.getElementById('autoreconnect').innerHTML = 'Reconnect';
        // send a disconnect
        sendMessage({
            type: 'reconnect',
            value: false
        });
    } else {
        autoReconnect = true;
        document.getElementById('autoreconnect').innerHTML = 'Disconnect';
        sendMessage({
            type: 'reconnect',
            value: true
        });
    }
}

let showTimestamps = false;
function onShowTimestamps() {
    if (showTimestamps === true) {
        showTimestamps = false;
        document.getElementById('timestamps').innerHTML = 'Show Timestamps';
    } else {
        showTimestamps = true;
        document.getElementById('timestamps').innerHTML = 'Don\'t Show Timestamps';
    }
    let ul = document.getElementById("list");
    let items = ul.getElementsByTagName("li");
    for (let i = 0; i < items.length; ++i) {
        let spans = items[i].getElementsByTagName('span');
        if (spans === undefined) {
            continue;
        }
        for (let span of spans) {
            if (span.hasAttribute('data-timestamp')) {
                if (showTimestamps === true) {
                    span.style.display = 'inline';
                } else {
                    span.style.display = 'none';
                }
            }
        }
    }
    checkResize();
}

function onSaveLog() {
    let ul = document.getElementById("list");
    let items = ul.getElementsByTagName("li");
    let logs = [];

    for (let i = 0; i < items.length; ++i) {
        logs.push({
            type: items[i].dataset.type,
            message: items[i].dataset.message
        });
    }

    sendMessage({
        type: 'save',
        items: logs
    });
}

function onConnect() {
    let button = document.getElementById('autoreconnect');
    button.style.backgroundColor = 'Green';
}

function onDisconnect() {
    let button = document.getElementById('autoreconnect');
    button.style.backgroundColor = 'Red';
}

function insertMessage(ts, line, li, color) {
    let div = document.createElement('div');
    let tsSpan = document.createElement('span');
    tsSpan.appendChild(document.createTextNode(ts.toFixed(3) + ': '));
    tsSpan.dataset.timestamp = 'true';
    if (showTimestamps === true) {
        tsSpan.style.display = 'inline';
    } else {
        tsSpan.style.display = 'none';
    }
    div.appendChild(tsSpan);
    let span = document.createElement('span');
    let split = line.split('\n');
    let first = true;
    for (let item of split) {
        if (item.trim() === '') {
            continue;
        }
        if (first === false) {
            span.appendChild(document.createElement('br'));
        }
        first = false;
        let tNode = document.createTextNode(item);
        span.appendChild(tNode);
    }
    if (color !== undefined) {
        span.style.color = color
    }
    div.appendChild(span);
    li.appendChild(div);
}

function insertStackTrace(st, li, color) {
    let div = document.createElement('div');
    let split = st.split('\n');
    let first = true;
    for (let item of split) {
        if (item.trim() === '') {
            continue;
        }
        if (first === false) {
            div.appendChild(document.createElement('br'));
        }
        first = false;
        let tNode = document.createTextNode('\u00a0\u00a0\u00a0\u00a0 at: ' + item);
        div.appendChild(tNode);
    }
    if (color !== undefined) {
        div.style.color = color
    }
    li.appendChild(div);
}

function insertLocation(loc, li, color) {
    let div = document.createElement('div');
    let split = loc.split('\n');
    let first = true;
    for (let item of split) {
        if (item.trim() === '') {
            continue;
        }
        if (first === false) {
            li.appendChild(document.createElement('br'));
        }
        first = false;
        let tNode = document.createTextNode('\u00a0\u00a0 from: ' + item);
        li.appendChild(tNode);
    }
    if (color !== undefined) {
        div.style.color = color
    }
    li.appendChild(div);
}

function addPrint(message) {
    let ul = document.getElementById("list");
    let li = document.createElement("li");
    li.style.fontFamily = '"Courier New", Courier, monospace'
    insertMessage(message.timestamp, message.line, li);
    let str = JSON.stringify(message);
    li.dataset.message = str;
    li.dataset.type = 'print';
    if (showPrints === true) {
        li.style.display = 'inline';
    } else {
        li.style.display = 'none';
    }
    ul.appendChild(li);
}

function expandError(message, li, color) {
    // First append the message
    insertMessage(message.timestamp, message.details, li, color);
    // Then append location, tabbed in once
    insertLocation(message.location, li);
    // Then append stack trace, tabbed in twice
    insertStackTrace(message.callStack, li);
    li.appendChild(document.createElement('br'));
}

function addError(message, type) {
    let ul = document.getElementById("list");
    let li = document.createElement("li");
    li.style.fontFamily = '"Courier New", Courier, monospace'
    let str = JSON.stringify(message);
    li.dataset.expanded = false;
    li.dataset.message = str;
    li.dataset.type = type;
    if (type === 'warning') {
        insertMessage(message.timestamp, message.details, li, 'Yellow');
        li.dataset.type = 'warning';
        if (showWarnings === true) {
            li.style.display = 'inline';
        } else {
            li.style.display = 'none';
        }
    } else {
        insertMessage(message.timestamp, message.details, li, 'Red');
        li.dataset.type = 'error';
    }
    li.onclick = () => {
        if (li.dataset.expanded === 'true') {
            // shrink
            li.dataset.expanded = false;
            let parsed = JSON.parse(li.dataset.message);
            li.innerHTML = '';
            if (li.dataset.type === 'warning') {
                insertMessage(parsed.timestamp, parsed.details, li, 'Yellow');
            } else {
                insertMessage(parsed.timestamp, parsed.details, li, 'Red');
            }
        } else {
            // expand
            li.dataset.expanded = true;
            let parsed = JSON.parse(li.dataset.message);
            li.innerHTML = '';
            if (li.dataset.type === 'warning') {
                expandError(parsed, li, 'Yellow');
            } else {
                expandError(parsed, li, 'Red');
            }
        }
        checkResize();
    };
    ul.appendChild(li);
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
        document.getElementById("list").innerHTML = "";
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
        document.getElementById('pause').innerHTML = 'Paused: ' + event.data.count;
    } else if (event.data.type === 'connected') {
        onConnect();
    } else if (event.data.type === 'disconnected') {
        onDisconnect();
    }
    checkResize();
});

addEventListener('resize', () => {
    checkResize();
});