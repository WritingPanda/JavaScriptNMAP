var active_tab = 1;

function select_tab(tab_no) {
    if(tab_no == 1) {
        if(active_tab == 1) {
            return;
        } else {
            active_tab = 1;
            document.getElementById('tab1').style.color = "#FFF";
            document.getElementById('tab1').style.backgroundColor = "#222";
            document.getElementById('tab2').style.color = "#000";
            document.getElementById('tab2').style.backgroundColor = "#CCC";
            document.getElementById('tab3').style.color = "#000";
            document.getElementById('tab3').style.backgroundColor = "#CCC";
            document.port_scan.style.display = "block";
            document.network_scan.style.display = "none";
            document.private_ip.style.display = "none";
        }
    } else if(tab_no == 2) {
        if(active_tab == 2) {
            return;
        } else {
            active_tab = 2;
            document.getElementById('tab2').style.color = "#FFF";
            document.getElementById('tab2').style.backgroundColor = "#222";
            document.getElementById('tab1').style.color = "#000";
            document.getElementById('tab1').style.backgroundColor = "#CCC";
            document.getElementById('tab3').style.color = "#000";
            document.getElementById('tab3').style.backgroundColor = "#CCC";
            document.port_scan.style.display = "none";
            document.network_scan.style.display = "block";
            document.private_ip.style.display = "none";
        }
    } else {
        if(active_tab == 3) {
            return;
        } else {
            active_tab = 3;
            document.getElementById('tab3').style.color = "#FFF";
            document.getElementById('tab3').style.backgroundColor = "#222";
            document.getElementById('tab1').style.color = "#000";
            document.getElementById('tab1').style.backgroundColor = "#CCC";
            document.getElementById('tab2').style.color = "#000";
            document.getElementById('tab2').style.backgroundColor = "#CCC";
            document.port_scan.style.display = "none";
            document.network_scan.style.display = "none";
            document.private_ip.style.display = "block";
        }
    }
}

var scan_type = 1;
var ip;
var start_port;
var end_port;
var start_ip = [];
var end_ip = [];
var port;
var blocked_ports = [0,1,7,9,11,13,15,17,19,20,21,22,23,25,37,42,43,53,77,79,87,95,101,102,103,104,109,110,111,113,115,117,119,123,135,139,143,179,389,465,512,513,514,515,526,530,531,532,540,556,563,587,601,636,993,995,2049,4045,6000];
var ws;
var xhr;
var start_time;
var current_port = 0;
var current_ip = [];
var open_port_max = 300;
var closed_port_max = 2000;
var ps_open_ports = [];
var ps_closed_ports = [];
var ps_timeout_ports = [];
var ns_hosts_up = [];
var network_address = [192,168,0,1];

function scan_ports() {
    scan_type=1;
    ip = document.getElementById('ip').value;
    start_port = document.getElementById('start_port').value;
    end_port = document.getElementById('end_port').value;
    if(!(is_valid_ip(ip.split(".")) && is_valid_port(start_port) && is_valid_port(end_port) && (end_port > start_port))) {
        alert("Invalid IP and port values entered");
        return;
    }

    current_port=0;
    ps_open_ports=[];
    ps_closed_ports=[];
    ps_timeout_ports=[];

    reset_scan_out();

    document.getElementById('log').innerHTML += "----------------<br><b>Scan Log:</b><br>";
    if(document.port_scan.protocol[0].checked) {
        setTimeout("scan_ports_xhr()",1);
    } else {
        setTimeout("scan_ports_ws()",1);
    }
}

function scan_ports_ws() {
    if(init_port_ps()) {
        return;
    }

    if(is_blocked(current_port)) {
        log(current_port + "  - blocked port");
        setTimeout("scan_ports_ws()",1);
        return;
    }

    start_time = (new Date).getTime();
    try
    {
        ws = new WebSocket("ws://" + ip + ":" + current_port);
        setTimeout("check_ps_ws()",5);
    }
    catch(err)
    {
        document.getElementById('result').innerHTML += "<b>Scan stopped. Exception: " + err + "</b>";
        return;
    }
}

function check_ps_ws() {
    var interval = (new Date).getTime() - start_time;

    if(ws.readyState == 0) {
        if(interval > closed_port_max) {
            log(current_port + " - time exceeded");
            ps_timeout_ports.push(current_port);
            setTimeout("scan_ports_ws()",1);
        } else {
            setTimeout("check_ps_ws()",5);
        }
    } else {
        if(interval < open_port_max) {
            log(current_port + " - open");
            ps_open_ports.push(current_port);
        } else {
            log(current_port + " - closed");
            ps_closed_ports.push(current_port);
        }

        setTimeout("scan_ports_ws()",1);
    }
}

function scan_ports_xhr() {
    if(init_port_ps()) {
        return;
    }

    if(is_blocked(current_port)) {
        log(current_port + "  - blocked port");
        setTimeout("scan_ports_xhr()",1);
        return;
    }

    start_time = (new Date).getTime();

    try
    {
        xhr = new XMLHttpRequest();
        xhr.open('GET', "http://" + ip + ":" + current_port);
        xhr.send();
        setTimeout("check_ps_xhr()",5);
    }
    catch(err)
    {
        document.getElementById('result').innerHTML += "<b>Scan stopped. Exception: " + err + "</b>";
        return;
    }
}

function check_ps_xhr() {
    var interval = (new Date).getTime() - start_time;
    if(xhr.readyState == 1) {
        if(interval > closed_port_max) {
            log(current_port + " - time exceeded");
            ps_timeout_ports.push(current_port);
            setTimeout("scan_ports_xhr()",1);
        } else {
            setTimeout("check_ps_xhr()",5);
        }
    } else {
        if(interval < open_port_max) {
            log(current_port + " - open");
            ps_open_ports.push(current_port);
        } else {
            log(current_port + " - closed");
            ps_closed_ports.push(current_port);
        }

        setTimeout("scan_ports_xhr()",1);
    }
}

function init_port_ps() {
    if(current_port == 0) {
        current_port = start_port;
    } else if(current_port == end_port) {
        results_ps();
        return true;
    } else {
        current_port++;
    }

    return false;
}

function results_ps() {
    document.getElementById('result').innerHTML = "<br><b>Open Ports:</b><br>" + ps_open_ports + "<br><br><b>Closed/Blocked Ports:</b><br>" + ps_closed_ports + "<br><br><b>Filtered/Application Type 3&4 Ports:</b><br>" + ps_timeout_ports + "<br><br>";
}

function scan_network() {
    scan_type = 2;
    reset_scan_out();
    document.getElementById('log').innerHTML += "----------------<br><b>Scan Log:</b><br>";
    start_ip = document.getElementById('start_ip').value.split(".");
    end_ip = document.getElementById('end_ip').value.split(".");
    port = document.getElementById('port').value;
    if(!(is_valid_ip(start_ip) && is_valid_ip(end_ip) && is_valid_port(port) && (compare_ip(start_ip,end_ip) == 3))) {
        alert("Invalid IP and port values entered");
        return;
    }
    current_ip = [];
    ns_hosts_up = [];

    if(is_blocked(port)) {
        document.getElementById('result').innerHTML = port + " is a blocked port";
        return;
    }

    if(document.network_scan.protocol[0].checked) {
        setTimeout("scan_network_xhr()",1);
    } else {
        setTimeout("scan_network_ws()",1);
    }
}

function scan_network_ws() {
    if(init_ip_ns()) {
        return;
    }

    start_time = (new Date).getTime();

    try
    {
        ws = new WebSocket("ws://" + current_ip.join(".") + ":" + port);
        setTimeout("check_ns_ws()",100);
    }
    catch(err)
    {
        document.getElementById('result').innerHTML += "<b>Scan stopped. Exception: " + err + "</b>";
        return;
    }
}

function check_ns_ws() {
    var interval = (new Date).getTime() - start_time;
    if(ws.readyState == 0) {
        if(interval > closed_port_max) {
            log(current_ip.join(".") + " - down");
            setTimeout("scan_network_ws()",1);
        } else {
            setTimeout("check_ns_ws()",100);
        }
    } else {
        log(current_ip.join(".") + " - up");
        ns_hosts_up.push(current_ip.join("."));
        setTimeout("scan_network_ws()",1);
    }
}

function scan_network_xhr() {
    if(init_ip_ns()) {
        return;
    }

    start_time = (new Date).getTime();

    try
    {
        xhr = new XMLHttpRequest();
        xhr.open('GET', "http://" + current_ip.join(".") + ":" + port);
        xhr.send();
        setTimeout("check_ns_xhr()",100);
    }
    catch(err)
    {
        document.getElementById('result').innerHTML += "<b>Scan stopped. Exception: " + err + "</b>";
        return;
    }
}

function check_ns_xhr() {
    var interval = (new Date).getTime() - start_time;

    if(xhr.readyState == 1) {
        if(interval > closed_port_max) {
            log(current_ip.join(".") + " - down");
            setTimeout("scan_network_xhr()",1);
        } else {
            setTimeout("check_ns_xhr()",100);
        }
    } else {
        log(current_ip.join(".") + " - up");
        ns_hosts_up.push(current_ip.join("."));
        setTimeout("scan_network_xhr()",1);
    }
}

function init_ip_ns() {
    if(current_ip.length == 0) {
        current_ip = copy_ip(start_ip);
    } else if(compare_ip(current_ip,end_ip) == 2) {
        results_ns();
        return true;
    } else {
        current_ip = increment_ip(current_ip);
    }

    return false;
}

function results_ns() {
    document.getElementById('result').innerHTML = "<br><b>Live Hosts:</b><br>" + ns_hosts_up + "<br><br>";
}

function find_private_ip() {
    scan_type=3;
    network_address = [192,168,0,1];
    reset_scan_out();
    document.getElementById('result').innerHTML = "Detection started<br>";
    find_network();
}

function find_network() {
    if(network_address[2] > 255) {
        network_address[2] == 0;
        document.getElementById('result').innerHTML = "The local network could not be identified...detection stopped";
    } else {
        document.getElementById('result').innerHTML += "Currently checking - " + network_address.join(".") + " ";
        network_address[2]++;
        is_dest_up(1);
    }
}

function find_ip(network) {
    if(network_address[3] > 254) {
        network_address[3] == 1;
        document.getElementById('result').innerHTML += "<br>IP could not be found";
    } else {
        network_address[3]++;
        document.getElementById('result').innerHTML = "Network discovered...looking for IP address<br>Currently checking - " + network_address.join(".");
        is_dest_up(2);
    }
}
function is_dest_up(pis_code) {
    var pis_port = 80;
    if(pis_code == 2) {
        pis_port = 30303;
    }

    start_time = (new Date).getTime();

    try
    {
        ws = new WebSocket("ws://" + network_address.join(".") + ":" + pis_port);
        if(pis_code == 2)
        {
            setTimeout("check_idp(2)",100);
        }
        else
        {
            setTimeout("check_idp(1)",100);
        }
    }
    catch(err)
    {
        document.getElementById('result').innerHTML += "<b>Scan stopped. Exception: " + err + "</b>";
        return;
    }
}

function check_idp(pis_code) {
    var interval = (new Date).getTime() - start_time;
    if(ws.readyState == 0) {
        if(interval > closed_port_max) {
            if(pis_code == 1) {
                setTimeout("find_network()",1);
            } else {
                setTimeout("find_ip()",1);
            }
        } else {
            setTimeout("check_idp(" + pis_code + ")",100);
        }
    } else {
        if(pis_code == 1) {
            document.getElementById('result').innerHTML = "Network found -- " + network_address.join(".") + "..checking for IP<br>";
            setTimeout("find_ip()",1);
        } else {
            document.getElementById('result').innerHTML = "Your internal IP address is " + network_address.join(".");
        }
    }
}

function is_blocked(port_no) {
    for(var i=0;i<blocked_ports.length;i++) {
        if(blocked_ports[i] == port_no) {
            return true;
        }
    }

    return false;
}

function copy_ip(source) {
    var dest = [];

    for(var i=0;i<source.length;i++) {
        dest[i] = source[i];
    }
    return dest;
}

function is_valid_ip(v_ip) {
    if(((v_ip[0] > 0) && (v_ip[0] <= 223)) &&((v_ip[1] >= 0) && (v_ip[1] <= 255)) && ((v_ip[2] >= 0) && (v_ip[2] <= 255)) && ((v_ip[3] > 0) && (v_ip[3] < 255))) {
        return true;
    } else {
        return false;
    }
}

function is_valid_port(v_port) {
    if(v_port > 0 && v_port < 65536) {
        return true;
    } else {
        return false;
    }
}

function compare_ip(a,b) {
    for(var i=0;i<4;i++) {
        var r = _compare_int(a[i],b[i]);
        if(r == 1) {
            return 1;//a is greater than b
        } else if(r == 3) {
            return 3;//b is greater than a
        }
    }
    return 2;//b is equal to a
}

function _compare_int(_a,_b) {
    if(_a > _b) {
        return 1;//_a is greater than _b
    } else if(_a == _b) {
        return 2;//_a is equal to _b
    } else {
        return 3;//_a is lesser than _b
    }
}

function increment_ip(inc_ip) {
    inc_ip[3]++;
    for(var i=3;i>=0;i--) {
        if(inc_ip[i] == 255) {
            inc_ip[i] = 0;
            inc_ip[i-1]++;
        }
    }

    return inc_ip;
}

function log(to_log) {
    document.getElementById('log').innerHTML += to_log + ", ";
}

function reset_scan_out() {
    document.getElementById('result').innerHTML = "";
    document.getElementById('log').innerHTML = "";
}
