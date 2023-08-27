// arguments : sat_norad, satname, mqtt_filename, subband_bw
rename('FM_demod');
print('Start FM_DEMOD');
include('settings.js');


var datenow=argv(2);
var frequency=argv(3);
var whisper_box = new SharedMap('dictionnary_1');

var IQ = new IQData('');
var samples = 0 ;
var filename = argv(0);
var nbfm_bandwidth = argv(1)
var SRinput= {'sample_rate' : nbfm_bandwidth};

if( !IQ.loadFromFile( filename ) ) {
    print('cannot open file:');
    exit();
}


// Input file : set samplerate
IQ.setSampleRate(parseInt(nbfm_bandwidth));

//Input file : display details
print('Input file : ', argv(0));
IQ.dump();
var demodulator = new NBFM('demod');
demodulator.configure( {'modulation_index': 0.2} );
var received_audio = demodulator.demodulate( IQ);
received_audio.saveToFile(filename + '.wav');

print ('sox volume ...');
    var c = {
	    'command' : '/usr/bin/sox', 
	    'args' : [filename + '.wav',  filename + '_FM.wav', 'gain', '-n', '10']
	    } ;

    var res = System.exec( c );
      print(JSON.stringify(c));
     sleep(200);
IO.fdelete(filename + '.wav');

// optional
print('sox spectrogram ...');
var c = {
  'command' : '/usr/bin/sox', 
  'args' : [filename + '_FM.wav', '-t', 'wav', '-n', 'spectrogram', '-o', filename + '_audio.png']
};

var res = System.exec( c );
print(JSON.stringify(c));
sleep(200);

print('FM_demod end.')
var data = filename + '_FM.wav';
var tid=getTID();
whisper_box.store( 'task_', data );
whisper_box.store( 'demod_' + tid, data);
var keys = whisper_box.keys();
print(JSON.stringify(keys));

var mytask = { 'task': [], 'file': []};

//var myfile;
var myfile=JSON.parse(IO.fread('/tmp/tasks.txt'));
print('File : ',JSON.stringify(myfile));
mytask.task.push('demod_' + tid);
mytask.file.push(data);
myfile.task.push('demod_' + tid);
myfile.file.push(data);
myfile.hostname.push(hostname);
myfile.frequency.push(frequency);
myfile.date.push(datenow);


print('New task :' + JSON.stringify(mytask));
IO.fwrite('/tmp/tasks.txt',JSON.stringify(myfile));