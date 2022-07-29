let startBtn = document.getElementById('start');
let stopBtn = document.getElementById('stop');
let consoleOutput = document.getElementById('console');

$('#console').click(function() {
    $('#cmd-command').focus();
});

let checkRunning = ()=> {
    $.ajax({
        type: "GET",
        url: "/api/minecraft/server-status",
        success: function (data) {
            if (data) {
                if (data.status == "server started" || data.status == "server running") {
                    startBtn.classList.add("active")
                    stopBtn.classList.add("active")
                    consoleOutput.classList.add("active")
                    consoleOutput.parentElement.classList.add("active")
                    //consoleOutput.contentWindow.location.reload();
                    startConsole()
                } else {
                    startBtn.classList.remove("active")
                    stopBtn.classList.remove("active")
                    consoleOutput.classList.remove("active")
                    consoleOutput.parentElement.classList.remove("active")
                }
            }
        }
    });
    return false;
}

checkRunning()

let startConsole = async () => {
    startBtn.classList.add("active")
    stopBtn.classList.add("active")
    consoleOutput.classList.add("active")
    let res = await fetch('/api/minecraft/console');
    let reader = res.body.getReader();
    let result;
    let decoder = new TextDecoder('utf8');
    while (!result?.done) {
        result = await reader.read();
        let chunks = decoder.decode(result.value).split("\n");

        for(let i = 0; i < chunks.length; i++) {
            let chunk = chunks[i]; 
            if(chunk == "") continue;
            let child = document.createElement('span');
            let br = document.createElement('br');
            child.innerHTML = chunk
            consoleOutput.appendChild(child)
            consoleOutput.appendChild(br)
            $('#console').scrollTop($('#console')[0].scrollHeight);
        }
    }
    return false;
};

let start = () => {
    $.ajax({
        type: "POST",
        url: "/api/minecraft/start-server",
        data: { server: $("select[name=server]").val() },
        dataType: "json",
        success: function (data) {
            if (data) {
                if (data.status == "server started" || data.status == "server running") {
                    startBtn.classList.add("active")
                    stopBtn.classList.add("active")
                    consoleOutput.classList.add("active")
                    consoleOutput.parentElement.classList.add("active")
                    //consoleOutput.contentWindow.location.reload();
                    startConsole()
                };
            }
        }
    });
    return false;
}
let stop = () => {
    $.ajax({
        type: "GET",
        url: "/api/minecraft/stop-server",
        dataType: "json",
        success: function (data) {
            if (data) {
                if (data.status == "server stopped" || data.status == "server running") {
                    startBtn.classList.remove("active")
                    stopBtn.classList.remove("active")
                    consoleOutput.classList.remove("active")
                    consoleOutput.parentElement.classList.remove("active")
                };
            }
        }
    });
    return false;
}
let cmd = () => {
    $.ajax({
        type: "POST",
        url: "/api/minecraft/server-command",
        data: { command: $("input[name=command]").val() },
    });
    $("input[name=command]").val("")
    setTimeout(checkRunning, 2000)
    return false;
}

document.getElementById("start").onsubmit = start
document.getElementById("stop").onsubmit = stop
document.getElementById("cmd").onsubmit = cmd