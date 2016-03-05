//http://stackoverflow.com/questions/23687635/how-to-stop-audio-in-an-iframe-using-web-audio-api-after-hiding-its-container-di
var log = console.log.bind(console),
    keyData = document.getElementById('key_data'),
    deviceInfoInputs = document.getElementById('inputs'),
    midi;

var AudioContext = AudioContext || webkitAudioContext; // for ios/safari
var context = new AudioContext();
var activeNotes = [];
var btnBox = document.getElementById('content'), btn = document.getElementsByClassName('button');
var data, cmd, channel, type, note, velocity;

// request MIDI access
if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({ sysex: false }).then(onMIDISuccess, onMIDIFailure);
}
else {
    alert("No MIDI support in your browser.");
}

// add event listeners
document.addEventListener('keydown', keyController);
document.addEventListener('keyup', keyController);
for (var i = 0; i < btn.length; i++) {
    btn[i].addEventListener('mousedown', clickPlayOn);
    btn[i].addEventListener('mouseup', clickPlayOff);
}

var sampleMap = {
    key60: 1,
    key61: 2,
    key62: 3,
    key63: 4,
    key64: 5
};
// user interaction 
function clickPlayOn(e) {
    e.target.classList.add('active');
    e.target.play();
}

function clickPlayOff(e) {
    e.target.classList.remove('active');
}

function keyController(e) {
    if (e.type == "keydown") {
        switch (e.keyCode) {
            case 81:
                btn[0].classList.add('active');
                btn[0].play();
                break;
            case 87:
                btn[1].classList.add('active');
                btn[1].play();
                break;
            case 69:
                btn[2].classList.add('active');
                btn[2].play();
                break;
            case 82:
                btn[3].classList.add('active');
                btn[3].play();
                break;
            case 84:
                btn[4].classList.add('active');
                btn[4].play();
                break;
            default:
            //console.log(e);
        }
    }
    else if (e.type == "keyup") {
        switch (e.keyCode) {
            case 81:
                btn[0].classList.remove('active');
                break;
            case 87:
                btn[1].classList.remove('active');
                break;
            case 69:
                btn[2].classList.remove('active');
                break;
            case 82:
                btn[3].classList.remove('active');
                break;
            case 84:
                btn[4].classList.remove('active');
                break;
            default:
            //console.log(e.keyCode);
        }
    }
}

// Returns the first input found, null if none found. 
function getInput(midiAccess) {
    
    // Get all inputs
    var inputs = midiAccess.inputs.values();

    // Iterate through
    var foundInput = null;
    for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
        if (foundInput === null) {
            foundInput = input;
        }
    }

    return foundInput;     
}

// midi functions
function onMIDISuccess(midiAccess) {

    var input = getInput(midiAccess);
    input.value.onmidimessage = onMIDIMessage;
    
    // listen for connect/disconnect message
    midiAccess.onstatechange = onStateChange;

    printInputDevice(midiAccess);
}

function onMIDIMessage(event) {
    data = event.data,
    cmd = data[0] >> 4,
    channel = data[0] & 0xf,
    type = data[0] & 0xf0, // channel agnostic message type. Thanks, Phil Burk.
    note = data[1],
    velocity = data[2];
    // with pressure and tilt off
    // note off: 128, cmd: 8 
    // note on: 144, cmd: 9
    // pressure / tilt on
    // pressure: 176, cmd 11: 
    // bend: 224, cmd: 14
    log('MIDI data', data);
    switch (type) {
        case 144: // noteOn message 
            noteOn(note, velocity);
            break;
        case 128: // noteOff message 
            noteOff(note, velocity);
            break;
    }
			
    //log('data', data, 'cmd', cmd, 'channel', channel);
    logger(keyData, 'key data', data);
}

function onStateChange(event) {
    printInputDevice(midi);
    var port = event.port, state = port.state, name = port.name, type = port.type;
    if (type == "input")
        log("name", name, "port", port, "state", state);

}

function listInputs(inputs) {
    var input = inputs.value;
				log("Input port : [ type:'" + input.type + "' id: '" + input.id +
        "' manufacturer: '" + input.manufacturer + "' name: '" + input.name +
        "' version: '" + input.version + "']");
}

function noteOn(midiNote, velocity) {
    player(midiNote, velocity);
}

function noteOff(midiNote, velocity) {
    player(midiNote, velocity);
}

function player(note, velocity) {
    var sample = sampleMap['key' + note];
    if (sample) {
        if (type == (0x80 & 0xf0) || velocity == 0) { //needs to be fixed for QuNexus, which always returns 144
            btn[sample - 1].classList.remove('active');
            return;
        }
        btn[sample - 1].classList.add('active');
        btn[sample - 1].play(velocity);
    }
}

function onMIDIFailure(e) {
    log("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + e);
}

// MIDI utility functions
function printInputDevice(midiAccess) {

    var input = getInput(midiAccess).value;
    
    console.log("Connection " + input.connection);
    console.log("State " + input.state);
    console.log("Manufacturer " + input.manufacturer);
    console.log("Version " + input.version);
}

// utility functions
function logger(container, label, data) {
    messages = label + " [channel: " + (data[0] & 0xf) + ", cmd: " + (data[0] >> 4) + ", type: " + (data[0] & 0xf0) + " , note: " + data[1] + " , velocity: " + data[2] + "]";
    container.textContent = messages;
}