// Get nodes from string
let getNodes = str => new DOMParser().parseFromString(str, 'text/html').body.childNodes;

class Server {
    #server = document.createElement('div')
    #serverName
    #interval
    #index = 0
    constructor(serverName) {
        this.#serverName = serverName;
        let nodes = (getNodes('<div class="title">' + serverName + '</div> <div class="console-container"><div class="header">Console</div><div class="console"></div><form class="cmd" autocomplete="off"><img src="/images/angle-right-solid.svg" width="20px" height="20px"><input type="text" name="command" autocomplete="off" required="" class="cmd-command"><input type="submit" style="height: 0px; width: 0px; border: none; padding: 0px;" hidefocus="true"></form></div><form class="stop"> <input type="submit" value="Stop"></form>'))
        this.#server.append(...nodes)

        $(".main")[0].appendChild(this.#server)
        this.#server.id = serverName
        this.#server.classList.add('server')

        // Start logging
        this.#startConsole()
        
        // Setting event handlers 
        // On console click focus command line
        $("#" + serverName + ' .console').click(function () {
            $("#" + serverName + ' .cmd-command').focus();
        });
        // On command submit execute command 
        $(this.#server).find(".cmd")[0].addEventListener('submit', (e) => {
            e.preventDefault()
            this.#cmd()
            return false
        })

        // On stop submit stop server 
        $(this.#server).find(".stop")[0].addEventListener('submit', (e) => {
            e.preventDefault()
            this.#stop()
            return false
        })
    }

    #cmd() {
        // Request to run a server command
        $.ajax({
            type: "POST",
            url: "/api/minecraft/server-command",
            data: { command: $("#" + this.#serverName + " input[name=command]").val(), server: this.#serverName },
        });
        //empty command line
        $("#" + this.#serverName + " input[name=command]").val("")

        // check if the command was stopping the server
        setTimeout(checkRunning, 5000)
    }
    #stop() {
        let tmp = this.#server
        let serverName = this.#serverName
        let interval = this.#interval

        // Request to stop the server
        $.ajax({
            type: "POST",
            url: "/api/minecraft/stop-server",
            dataType: "json",
            data: { server: this.#serverName },
            dataType: "json",
            success: function (data) {
                if (data) {
                    if (data.status == "server stopped") { // If the server stopped remove the console and reset to default config 
                        tmp.remove()
                        servers[serverName] = undefined
                        $("#start select").append('<option value="' + serverName + '"> ' + serverName + '</option>')
                        clearInterval(interval)
                    };
                }
            }
        });
    }
    #startConsole() {
        let server = this
        let serverName = this.#serverName

        // Check for console update every 5 sec
        this.#interval = setInterval(() => {
            $.ajax({
                type: "POST",
                url: "/api/minecraft/console",
                data: { server: serverName, lines: 10, index: this.#index },
                dataType: "json",
                success: function (res) {
                    if (res && !res.status) { // Update server console
                        server.#index = parseInt(res.index);
                        let data = res.data
                        for(let i=0; i!=data.length; i++) {
                            let child = document.createElement('span');
                            let br = document.createElement('br');
                            child.innerHTML = data[i]
                            $('#' + serverName + ' .console')[0].appendChild(child)
                            $('#' + serverName + ' .console')[0].appendChild(br)
                            $('#' + serverName + ' .console').scrollTop($('#' + serverName + ' .console')[0].scrollHeight)
                        }
                    } else if(res.status == 'server not running') server.#stop() // remove console if the server is offline
                }
            });
        }, 500)
        
        return false;
    }
}

let servers = []

// Start a server on form submission
document.getElementById("start").onsubmit = (e) => {
    let serverName = $("#start select").val()
    $.ajax({
        type: "POST",
        url: "/api/minecraft/start-server",
        data: { server: serverName },
        dataType: "json",
        success: function (data) {
            if (data) {
                if (data.status == "server started") {
                    servers[serverName] = new Server(serverName)
                    $('#start option[value="' + serverName + '"]').remove()
                };
            }
        }
    });
    return false;
}

// Check some server is running
let checkRunning = () => {
    // check every server
    $("#start option").each(function() {
        let serverName = $(this).val()
        $.ajax({
            type: "POST",
            url: "/api/minecraft/server-status",
            data: { server: serverName },
            dataType: "json",
            success: function (data) {
                if (data) {
                    // if the server is running create server console
                    if (data.status == "server started" || data.status == "server running") {
                        servers[serverName] = new Server(serverName)
                        $('#start option[value="' + serverName + '"]').remove()
                    }
                }
            }
        });
    });
}

checkRunning()
// Check every minute if some server is running
setInterval(checkRunning, 60 * 1000)