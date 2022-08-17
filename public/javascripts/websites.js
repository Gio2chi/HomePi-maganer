$('.console').click(function(e) {
    e.currentTarget.parentElement.querySelector('.cmd-command').focus()
});

let startConsole = async (console) => {
    let c
    let res = await fetch('/api/websites/console/'+ console.id);
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
            console.appendChild(child)
            console.appendChild(br)
            $(console).scrollTop($(console)[0].scrollHeight);
        }
    }
    return false;
};

document.querySelectorAll('.console').forEach(websiteConsole => {
    startConsole(websiteConsole)
})