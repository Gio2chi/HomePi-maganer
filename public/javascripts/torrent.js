let tabBtns = document.getElementsByClassName('tab-btn')

for (let i = 0; i < tabBtns.length - 1; i++) {
    tabBtns[i].onclick = () => {
        var tab = document.getElementsByClassName("tab");
        for (let j = 0; j < tab.length; j++) {
            tab[j].style.display = "none";
        }
        document.getElementById('upload-form').classList.remove('active')
        document.getElementById('cover').classList.remove('active')
        document.getElementById('select-folder').classList.remove('active')
        if ($(tabBtns[i]).data('target') == "management") {
            $("#upload-form .txt-field")[0].style.display = "block"
        }
        else {
            $("#upload-form .txt-field")[0].style.display = "none"
        }
        document.getElementById($(tabBtns[i]).data('target')).style.display = "block";
        for (let z = 0; z < tabBtns.length - 1; z++) {
            tabBtns[z].classList.remove('active')
        }
        tabBtns[i].classList.add('active');
    }
}

tabBtns[tabBtns.length - 1].onclick = (e) => {
    let tabBar = document.getElementById("tab-bar")
    let newSearchTab = document.createElement("div")
    let newSearchBtn = document.getElementById("template").cloneNode(true)

    let id = "download-" + (tabBar.children.length - 2)

    newSearchTab.classList.add("tab")
    newSearchTab.id = id
    newSearchTab.innerHTML = `<div class="container">
            <form class="search-bar"><input class="search-btn" type="text" name="search-btn" autocomplete="off" placeholder="Search for torrents" /><button type="submit"> <span>search</span><img src="/images/magnifying-glass-solid.svg" width="35" height="35" /></button></form>
            <div class="search-results"></div>
        </div>`
    document.querySelector(".main").append(newSearchTab)

    newSearchBtn.dataset.target = id

    var tab = document.getElementsByClassName("tab");
    for (let j = 0; j < tab.length; j++) {
        tab[j].style.display = "none";
    }
    document.getElementById(id).style.display = "block";
    for (let z = 0; z < tabBtns.length - 1; z++) {
        tabBtns[z].classList.remove('active')
    }
    newSearchBtn.classList.add('active');

    newSearchBtn.onclick = () => {
        var tab = document.getElementsByClassName("tab");
        for (let j = 0; j < tab.length; j++) {
            tab[j].style.display = "none";
        }
        document.getElementById(id).style.display = "block";
        for (let z = 0; z < tabBtns.length - 1; z++) {
            tabBtns[z].classList.remove('active')
        }
        newSearchBtn.classList.add('active');
    }

    tabBar.insertBefore(newSearchBtn, tabBtns[tabBtns.length - 1])
}

document.getElementById('upload').onclick = (e) => {
    document.getElementById('upload-form').classList.toggle('active')
    document.getElementById('cover').classList.toggle('active')
    $("#selected-folder").val("/")
    $("#select-folder-button").val("Select Folder")
}

document.getElementById('cover').onclick = (e) => {
    if (e.target !== e.currentTarget) return;
    document.getElementById('upload-form').classList.toggle('active')
    document.getElementById('cover').classList.toggle('active')
    document.getElementById('select-folder').classList.remove('active')
}
document.getElementById('upload-form').onsubmit = () => {
    $.ajax({
        type: "POST",
        url: "/api/torrent/download",
        dataType: "json",
        data: { url: $("#url-input").val(), destination: $("#selected-folder").val() },
        success: function (data) {
            if (data) {
                if (data.status == "success") {
                    $("#url-input").val("")
                    $("#selected-folder").val("/")
                    document.getElementById('upload-form').classList.toggle('active')
                    document.getElementById('cover').classList.toggle('active')
                };
            }
        }
    });
    return false;
}

let getfolders = (dest) => {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            url: "/api/torrent/destinations",
            dataType: "json",
            data: { destination: dest },
            success: function (data) {
                if (!data.code) {
                    resolve(data.destinations);
                } else {
                    reject(data.code)
                }
            }
        });
    })
}
let createList = async (dest) => {
    let folders = await getfolders(dest)
    for (let i = 0; i != folders.length; i++) {
        let folderEl = document.createElement("div")
        folderEl.innerHTML =
            '<img src="/images/folder-solid.svg" width="35" height="35">\n' +
            "<strong>" + folders[i] + "</strong>\n" +
            "<input type='hidden' value='" + folders[i] + "'>"
        document.getElementById('folders').append(folderEl)
    }

}
document.getElementById('select-folder-button').onclick = (e) => {
    $("#select-folder").addClass("active")
    $("#select-folder .navbar span")[0].innerHTML = "/"
    $("#folders")[0].innerHTML = ""
    createList($("#select-folder .navbar span")[0].innerHTML)
}

let selectedAll = (list) => {
    for (let i = 0; i != list.children.length; i++) {
        if (!list.children[i].classList.contains("selected")) return false;
    }
    return true;
}
let getSelected = (list, remove) => {
    let arr = []
    for (let i = 0; i != list.length; i++) {
        if (list[i].classList.contains("selected")) {
            arr.push(Number((list[i].id).replace("torrent_", "")))
            if (remove) list[i].remove()
        }
    }
    return arr;
}
document.getElementById('select-all').onclick = (e) => {
    let list = document.getElementById("torrents-container")
    if (selectedAll(list)) {
        for (let i = 0; i != list.children.length; i++) {
            list.children[i].classList.remove("selected")
            list.children[i].classList.remove("first")
        }
        return;
    }
    for (let i = 0; i != list.children.length; i++) {
        list.children[i].classList.add("selected")
        list.children[i].classList.remove("first")
    }
    list.children[0].classList.add('first')
}
document.getElementById('remove').onclick = (e) => {
    let list = document.getElementById("torrents-container")
    if (selectedAll(list)) {
        $.ajax({
            method: "POST",
            url: "/api/torrent/setTorrentStatus",
            dataType: "json",
            data: { status: "REMOVE_ALL" }
        })
        document.querySelectorAll(".torrent").forEach(torrent => {
            torrent.remove();
        })
        return;
    }

    let torrents = document.querySelectorAll(".torrent")
    let ids = JSON.stringify(getSelected(torrents, true))
    $.ajax({
        method: "POST",
        url: "/api/torrent/setTorrentStatus",
        dataType: "json",
        data: { status: "REMOVE", ids: ids }
    })
}
document.getElementById('play').onclick = (e) => {
    let list = document.getElementById("torrents-container")
    if (selectedAll(list)) {
        $.ajax({
            method: "POST",
            url: "/api/torrent/setTorrentStatus",
            dataType: "json",
            data: { status: "START_ALL" }
        })
        return;
    }

    let torrents = document.querySelectorAll(".torrent")
    let ids = JSON.stringify(getSelected(torrents))
    $.ajax({
        method: "POST",
        url: "/api/torrent/setTorrentStatus",
        dataType: "json",
        data: { status: "START", ids: ids }
    })
}
document.getElementById('pause').onclick = (e) => {
    let list = document.getElementById("torrents-container")
    if (selectedAll(list)) {
        $.ajax({
            method: "POST",
            url: "/api/torrent/setTorrentStatus",
            dataType: "json",
            data: { status: "PAUSE_ALL" }
        })
        return;
    }

    let torrents = document.querySelectorAll(".torrent")
    let ids = JSON.stringify(getSelected(torrents))
    $.ajax({
        method: "POST",
        url: "/api/torrent/setTorrentStatus",
        dataType: "json",
        data: { status: "PAUSE", ids: ids }
    })
}

$("#select-folder .back")[0].onclick = () => {
    let txt = $("#select-folder .navbar span")[0].innerHTML
    if (txt == "/") return false;
    let arr = txt.split("/")
    txt = ""
    for (let i = 0; i != arr.length; i++) if (i <= arr.length - 3) txt += arr[i] + "/"
    $("#select-folder .navbar span")[0].innerHTML = txt

    $("#folders")[0].innerHTML = ""
    createList($("#select-folder .navbar span")[0].innerHTML)
}
$("#folders").on("click", "div", (e) => {
    let div = $(e.currentTarget)
    let input = $(div.children("input")[0])

    $("#select-folder .navbar span")[0].innerHTML += input.val() + "/"

    $("#folders")[0].innerHTML = ""
    createList($("#select-folder .navbar span")[0].innerHTML)
})
$("#select-folder .cancel")[0].onclick = () => {
    $("#select-folder").removeClass("active")
}
$("#select-folder .submit")[0].onclick = () => {
    let txt = $("#select-folder .navbar span")[0].innerHTML
    $("#selected-folder").val(txt)

    if (txt == "/") {
        $("#select-folder").removeClass("active")
        return false;
    }
    let arr = txt.split("/")
    $("#select-folder-button").val(arr[arr.length - 2])

    $("#select-folder").removeClass("active")
}

let getStatus = (code) => {
    switch (code) {
        case 0: {
            return "PAUSED"
        }
        case 1: {
            return "CHECK_WAIT"
        }
        case 2: {
            return "CHECK"
        }
        case 3: {
            return "DOWNLOAD_WAIT"
        }
        case 4: {
            return "DOWNLOAD"
        }
        case 5: {
            return "SEED_WAIT"
        }
        case 6: {
            return "SEED"
        }
        case 7: {
            return "ISOLATED"
        }
    }
}

setInterval(() => {
    $.ajax({
        url: "/api/torrent/info",
        method: "GET",
        success: (data) => {
            if (!data.torrents) return false;
            for (let i = 0; i != data.torrents.length; i++) {
                let torrentElement = document.getElementById("torrent_" + data.torrents[i].id)
                if (!torrentElement) {
                    torrentElement = document.createElement("div");
                    torrentElement.id = "torrent_" + data.torrents[i].id;
                    torrentElement.classList.add("torrent");
                    torrentElement.classList.add("draggable");
                    document.getElementById("torrents-container").appendChild(torrentElement);
                }
                $(torrentElement).css('--i', (data.torrents[i].percentDone * 100).toFixed(2) + '%')
                torrentElement.innerHTML = '<div class="torrent_name"> ' + data.torrents[i].name + '</div>' +
                    '<div class="torrent_grab">' + '<img src="/images/grip-dots-vertical.svg">' + '</div>' +
                    '<div class="torrent_peer_details">' + getStatus(data.torrents[i].status) + '</div>' +
                    '<div class="progress-bar">' + '</div>' +
                    '<div class="progress-status">' + (data.torrents[i].downloadedEver / 1024 / 1024 / 1024).toFixed(2) + "/" + (data.torrents[i].totalSize / 1024 / 1024 / 1024).toFixed(2) + "GB (" + (data.torrents[i].percentDone * 100).toFixed(2) + "%)" + '</div>'

                torrentElement.addEventListener("mousedown", mouseDownHandler)
            }
        }
    })
}, 1000)

/* dragging system */

let dragged;
let mouseY;
let relativeY;
let placeholder;

const isAbove = function (nodeA, nodeB) {
    // Get the bounding rectangle of nodes
    const rectA = nodeA.getBoundingClientRect();
    const rectB = nodeB.getBoundingClientRect();

    return rectA.top + rectA.height / 2 < rectB.top + rectB.height / 2;
};

const swap = function (nodeA, nodeB) {
    const parentA = nodeA.parentNode;
    const siblingA = nodeA.nextSibling === nodeB ? nodeA : nodeA.nextSibling;

    // Move `nodeA` to before the `nodeB`
    nodeB.parentNode.insertBefore(nodeA, nodeB);

    // Move `nodeB` to before the sibling of `nodeA`
    parentA.insertBefore(nodeB, siblingA);
};

const mouseUpHandler = (event) => {
    let torrents = document.querySelectorAll(".torrent")
    let ids = []
    torrents.forEach(torrent => {
        ids.push(Number((torrent.id).replace("torrent_", "")))
    })

    let jsonStr = '{ "torrentIds": ['
    ids.forEach(id => {
        jsonStr += id + ','
    })
    jsonStr = jsonStr.substring(0, jsonStr.length - 1)
    jsonStr += ']}'

    $.ajax({
        method: 'POST',
        url: '/api/torrent/setTorrentOrder',
        dataType: "json",
        data: { jsonStr }
    })

    document.removeEventListener("mouseup", mouseUpHandler)
    document.removeEventListener("mousemove", mouseMoveHandler)

    placeholder.remove()

    dragged.style.removeProperty('top');
    dragged.style.removeProperty('position');

    mouseY = null;
    relativeY = null;
    dragged = null;
}

const getIndex = (children, node) => {
    return Array.prototype.indexOf.call(children, node)
}
let multiselection = false;
let selectHandler = (event) => {
    if (event.button != 0) return true;
    if (!event.target.classList.contains("torrent_grab")) {
        if (event.ctrlKey) {
            event.currentTarget.classList.toggle("selected")
            return true;
        } else if (event.shiftKey) {
            multiselection = true;
            let children = event.currentTarget.parentNode.children
            let index = getIndex(children, event.currentTarget);
            let first = document.querySelector(".first")
            if (!first) {
                children[0].classList.add("first")
                first = document.querySelector(".first")
            }
            let index2 = getIndex(children, first)

            if (index > index2) {
                let tmp = index;
                index = index2;
                index2 = tmp
            }

            $(event.currentTarget).siblings().removeClass("selected");
            for (let i = index; i != index2 + 1; i++) {
                children[i].classList.add("selected")
            }

            return true;
        }

        $(event.currentTarget).siblings().removeClass("selected");
        $(event.currentTarget).siblings().removeClass("first");
        $(event.currentTarget).removeClass("first");
        if (multiselection) {
            multiselection = false;
            event.currentTarget.classList.add("first", "selected")
            return true;
        }
        event.currentTarget.classList.toggle("selected")
        if (event.currentTarget.classList.contains("selected")) event.currentTarget.classList.add("first")
        return true;
    };
    return false;
}

const mouseDownHandler = (event) => {
    if (selectHandler(event)) return;

    dragged = event.currentTarget

    var rect = event.currentTarget.getBoundingClientRect();
    relativeY = event.clientY - rect.top
    dragged.style.position = "absolute"

    const draggingRect = dragged.getBoundingClientRect();
    placeholder = document.createElement('div');
    placeholder.classList.add('placeholder');
    dragged.parentNode.insertBefore(placeholder, dragged.nextSibling);
    placeholder.style.height = `${draggingRect.height}px`;


    document.addEventListener("mouseup", mouseUpHandler)
    document.addEventListener("mousemove", mouseMoveHandler)
}

const mouseMoveHandler = (event) => {
    mouseY = event.clientY
    dragged.style.top = mouseY - relativeY - $("#torrent-navbar").outerHeight() - $("#tab-bar").outerHeight() + "px"

    const prevEle = dragged.previousElementSibling;
    const nextEle = placeholder.nextElementSibling;
    if (nextEle && isAbove(nextEle, dragged)) {
        swap(nextEle, placeholder);
        swap(nextEle, dragged);
        return;
    }
    if (prevEle && isAbove(dragged, prevEle)) {
        swap(placeholder, dragged);
        swap(placeholder, prevEle);
        return;
    }
}

$("#torrents-container")[0].onclick = (e) => {
    if (e.target == e.currentTarget) {
        let list = document.getElementById("torrents-container")
        for (let i = 0; i != list.children.length; i++)
            list.children[i].classList.remove("selected", "first")
    }
}

let list = document.getElementById("torrents-container").children
for (let i = 0; i < list.length; i++) {
    list[i].addEventListener("mousedown", mouseDownHandler)
}

let getMagnet = (torrent, element, link) => {
    $.ajax({
        url: '/api/torrent/getMagnet',
        method: 'POST',
        dataType: 'json',
        data: { torrent: JSON.stringify(torrent) },
        success: (data) => {
            if (data.status == 'error') return;
            $(element).val(data.magnet)
            link.onclick = () => {
                document.getElementById('upload-form').classList.toggle('active')
                document.getElementById('cover').classList.toggle('active')
                $("#selected-folder").val("/")
                $("#select-folder-button").val("Select Folder")
                $("#url-input").val(data.magnet)
            }
        }
    })
}

let torrentToElement = (torrent, element) => {
    let a = document.createElement('a')
    a.classList.add('download-link')

    let img = document.createElement('img')
    img.src = "/images/download-solid.svg"
    img.classList.add('download-search')
    a.appendChild(img)
    let titleEl = document.createElement("span")
    titleEl.innerHTML = torrent.title
    titleEl.classList.add("torrent-title")
    let dateEl = document.createElement("span")
    dateEl.innerHTML = torrent.time
    dateEl.classList.add("torrent-date")
    let seedersEl = document.createElement("span")
    seedersEl.innerHTML = torrent.seeds
    seedersEl.classList.add("torrent-seeders")
    let peersEl = document.createElement("span")
    peersEl.innerHTML = torrent.peers
    peersEl.classList.add("torrent-peers")
    let sizeEl = document.createElement("span")
    sizeEl.innerHTML = torrent.size
    sizeEl.classList.add("torrent-size")
    let magnet = document.createElement("input")
    magnet.type = "hidden"
    magnet.classList.add("torrent-magnet")

    element.appendChild(a)
    element.appendChild(magnet)
    element.appendChild(titleEl)
    element.appendChild(dateEl)
    element.appendChild(seedersEl)
    element.appendChild(peersEl)
    element.appendChild(sizeEl)

    getMagnet(torrent, magnet, a)
}

document.querySelectorAll(".container").forEach((search) => {
    search.onsubmit = (e) => {
        let research = $(e.target.children[0]).val()
        if (research == "") return false;
        $.ajax({
            url: '/api/torrent/search',
            method: 'POST',
            dataType: 'json',
            data: { search: research },
            success: (data) => {
                if (data.status == 'error') return false;
                let listEl = search.children[1]
                listEl.innerHTML = ""

                let headerEl = document.createElement("div")
                headerEl.classList.add("torrent-header")
                let titleEl = document.createElement("span")
                titleEl.innerHTML = "title"
                titleEl.classList.add("torrent-title")
                let dateEl = document.createElement("span")
                dateEl.innerHTML = "date"
                dateEl.classList.add("torrent-date")
                let seedersEl = document.createElement("span")
                seedersEl.innerHTML = "seeds"
                seedersEl.classList.add("torrent-seeders")
                let peersEl = document.createElement("span")
                peersEl.innerHTML = "peers"
                peersEl.classList.add("torrent-peers")
                let sizeEl = document.createElement("span")
                sizeEl.innerHTML = "size"
                sizeEl.classList.add("torrent-size")
                headerEl.appendChild(titleEl)
                headerEl.appendChild(dateEl)
                headerEl.appendChild(seedersEl)
                headerEl.appendChild(peersEl)
                headerEl.appendChild(sizeEl)

                listEl.appendChild(headerEl)

                for (let i = 0; i != data.torrents.length; i++) {
                    let torrentElement = document.createElement("div")
                    torrentElement.classList.add("torrent")
                    torrentToElement(data.torrents[i], torrentElement)
                    listEl.appendChild(torrentElement)
                }
            }
        })
        return false;
    }
})