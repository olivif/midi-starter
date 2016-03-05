//http://stackoverflow.com/questions/23687635/how-to-stop-audio-in-an-iframe-using-web-audio-api-after-hiding-its-container-di
var log = console.log.bind(console),
    midi;

var AudioContext = AudioContext || webkitAudioContext; // for ios/safari
var context = new AudioContext();
var data, cmd, channel, type, note, velocity;

// request MIDI access
if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({ sysex: false }).then(onMIDISuccess, onMIDIFailure);
}
else {
    alert("No MIDI support in your browser.");
}

var sampleMap = {
    key60: 1,
    key61: 2,
    key62: 3,
    key63: 4,
    key64: 5
};

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
    switch (type) {
        case 144: // noteOn message 
            noteOn(note, velocity);
            break;
        case 128: // noteOff message 
            noteOff(note, velocity);
            break;
    }
			
    printKey(data);
}

// Prints one key to the console
function printKey(keyData) {
    
    var message = "";
    message += " channel = " + (keyData[0] & 0xf);
    message += " cmd = " + (keyData[0] >> 4);
    message += " type = " + (keyData[0] & 0xf0);
    message += " note = " + keyData[1];
    message += " velocity = " + keyData[2];
    
    console.log(message);
}

function onStateChange(event) {
    printInputDevice(midi);
    var port = event.port, state = port.state, name = port.name, type = port.type;
    if (type == "input")
        log("name", name, "port", port, "state", state);

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
    console.error("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + e);
}

// MIDI utility functions
function printInputDevice(midiAccess) {

    var input = getInput(midiAccess).value;
    
    console.log("Connection " + input.connection);
    console.log("State " + input.state);
    console.log("Manufacturer " + input.manufacturer);
    console.log("Version " + input.version);
}