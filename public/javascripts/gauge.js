let cpu_bar = document.getElementById('cpu-gauge-bar');
let cpu_number = document.getElementById('cpu-number');
let mem_bar = document.getElementById('mem-gauge-bar');
let mem_number = document.getElementById('mem-number');
let internet_bar = document.getElementById('internet-gauge-bar');
let internet_number = document.getElementById('internet-number');

let updateStats = setInterval(()=> {
    $.ajax({
        method: "GET",
        url: "http://localhost:3001/api/stats/server",
        dataType: "json",
        success: (data) => {
            if(data.status == 'error' || !data) clearInterval(updateStats)

            let cpu = parseFloat(data.cpu.totalUsage);
            cpu_bar.style = "--i: " + cpu.toFixed(2)
            cpu_number.innerHTML =  cpu.toFixed(2) + "%"

            let mem = parseFloat(data.mem.free/data.mem.total*100)
            mem_bar.style = "--i: " + mem.toFixed(2)
            mem_number.innerHTML = mem.toFixed(2) + "%"

            let net = parseFloat(data.network.transferSpeed/1024/1024)
            internet_bar.style = "--i: " + net.toFixed(2)
            internet_number.innerHTML = net.toFixed(2) + "%"
        }
    })
}, 750)