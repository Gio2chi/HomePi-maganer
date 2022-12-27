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
        let children = $(this.#server).children()

        for (const child of children) {
            child.setAttribute("data-server", serverName)
        }
        $(".main")[0].appendChild(this.#server)
        this.#server.id = serverName
        this.#server.classList.add('server')

        this.#startConsole()
        $("#" + serverName + ' .console').click(function () {
            $("#" + serverName + ' .cmd-command').focus();
        });

        $(this.#server).find(".cmd")[0].addEventListener('submit', (e) => {
            e.preventDefault()
            this.#cmd()
            return false
        })

        $(this.#server).find(".stop")[0].addEventListener('submit', (e) => {
            e.preventDefault()
            this.#stop()
            return false
        })
    }

    #cmd() {
        $.ajax({
            type: "POST",
            url: "/api/minecraft/server-command",
            data: { command: $("#" + this.#serverName + " input[name=command]").val(), server: this.#serverName },
        });
        $("input[name=command]").val("")
        setTimeout(checkRunning, 2000)
    }
    #stop() {
        let tmp = this.#server
        let serverName = this.#serverName
        let interval = this.#interval
        $.ajax({
            type: "POST",
            url: "/api/minecraft/stop-server",
            dataType: "json",
            data: { server: this.#serverName },
            dataType: "json",
            success: function (data) {
                if (data) {
                    if (data.status == "server stopped") {
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
        this.#interval = setInterval(() => {
            $.ajax({
                type: "POST",
                url: "/api/minecraft/console",
                data: { server: serverName, lines: 10, index: this.#index },
                dataType: "json",
                success: function (res) {
                    if (res) {
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
                    }
                }
            });
        }, 500)
        
        return false;
    }
}

let servers = []

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

let checkRunning = () => {
    $("#start option").each(function() {
        let serverName = $(this).val()
        $.ajax({
            type: "POST",
            url: "/api/minecraft/server-status",
            data: { server: serverName },
            dataType: "json",
            success: function (data) {
                if (data) {
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
setInterval(checkRunning, 60 * 1000)
