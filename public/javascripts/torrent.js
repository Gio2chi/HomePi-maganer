let tabBtns = document.getElementsByClassName('tab-btn')

for (let i = 0; i < tabBtns.length - 1; i++) {
    tabBtns[i].onclick = () => {
        var tab = document.getElementsByClassName("tab");
        for (let j = 0; j < tab.length; j++) {
            tab[j].style.display = "none";
        }
        document.getElementById($(tabBtns[i]).data('target')).style.display = "block";
        for (let z = 0; z < tabBtns.length - 1; z++) {
            tabBtns[z].classList.remove('active')
        }
        tabBtns[i].classList.add('active');
    }
}

tabBtns[tabBtns.length - 1].onclick = () => {
    let tabBar = document.getElementById("tab-bar")
    let newSearchTab = document.createElement("div")
    let newSearchBtn = document.getElementById("template").cloneNode(true)

    let id = "download-" + (tabBar.children.length - 2)

    newSearchTab.classList.add("tab")
    newSearchTab.id = id
    newSearchTab.innerHTML = "hello from " + id
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

document.getElementById('upload').onclick = () => {
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
        url: "/api/torrent/upload",
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

let createList = async () => {
    let folders = await getfolders($("#select-folder .navbar span")[0].innerHTML)
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
    createList()
}

$("#select-folder .back")[0].onclick = () => {
    let txt = $("#select-folder .navbar span")[0].innerHTML
    if(txt == "/") return false;
    let arr = txt.split("/")
    txt = ""
    for (let i = 0; i != arr.length; i++) if (i <= arr.length - 3) txt += arr[i] + "/"
    $("#select-folder .navbar span")[0].innerHTML = txt

    $("#folders")[0].innerHTML = ""
    createList()
}
$("#folders").on("click", "div", (e) => {
    let div = $(e.currentTarget)
    let input = $(div.children("input")[0])

    $("#select-folder .navbar span")[0].innerHTML += input.val() + "/"
    
    $("#folders")[0].innerHTML = ""
    createList()
})
$("#select-folder .cancel")[0].onclick = () => {
    $("#select-folder").removeClass("active")
}
$("#select-folder .submit")[0].onclick = () => {
    let txt = $("#select-folder .navbar span")[0].innerHTML
    $("#selected-folder").val(txt)
    
    if(txt == "/") {
        $("#select-folder").removeClass("active")
        return false;
    }
    let arr = txt.split("/")
    $("#select-folder-button").val(arr[arr.length - 2]) 

    $("#select-folder").removeClass("active")
}
