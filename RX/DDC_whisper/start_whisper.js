//  ./main -m ./models/ggml-tiny.en.bin -otxt 

include('settings.js');
rename('whisper_queue');
print('Start whisper');

if (use_mqtt) {
	var stations_whisper = {
		'host': mqtt_server,
		'login': '',
		'pass' : '',
		'topic': 'SDR/' + hostname + '/whisper',
		'mode' : 'write' 
	};
	print('Create MQTT : SDR/' + hostname + '/whisper');
	MBoxCreate('whisper', stations_whisper);

	var whisper_tasks = {
		'host': mqtt_server,
		'login': '',
		'pass' : '',
		'topic': 'SDR/' + hostname + '/whisper',
		'mode' : 'write' 
	};
	print('Create MQTT : SDR/' + hostname + '/whisper_tasks');
	MBoxCreate('whisper_tasks',whisper_tasks);
}

for (;;) {
	var myfile=JSON.parse(IO.fread('/tmp/tasks.txt'));
	var datenow=myfile.date.shift();
	var frequency=myfile.frequency.shift()
	if (use_mqtt) {
		MBoxPost('whisper_tasks',myfile.task.length);
	}
	if (myfile.task.length > 0) {
		print('Nb : ' , myfile.task.length, ' - ', JSON.stringify(myfile));
	}
	if (use_mqtt) {
		MBoxPost('whisper_tasks',myfile.task.length);
	}
	if (myfile.task.length > 0) {
		var nextone=myfile.file.shift();
		var demod_name=myfile.task.shift();
		IO.fwrite('/tmp/tasks.txt',JSON.stringify(myfile));
		print('Processing ' , demod_name, '  - File :  ' , nextone);

		var whisper = {
	    	'command' : whisper_path + 'main', 
	    	'args' : ['-m' , whisper_path +'models/' + whisper_model, '-otxt', nextone]
	    };
		
		print(JSON.stringify(whisper));	
		var res = System.exec( whisper );

        // Debug : whisper full output (sdtout + stderr)
		sleep(2000);
		if (debug) {
			print( 'Whisper.cpp result -->  ' ,  JSON.stringify(res) )
		}
		else {
			print('\033[31m',res.stdout,'\033[39m');
		}
		// send whisper result to MQTT
		if (use_mqtt && res.stdout.length > 0) {
			print('posting')
			var mqtt_whisper = {
				'station': hostname,
				'date': datenow,
				'whisper_msg': res.stdout,
				'frequency': frequency
			};
			MBoxPost('whisper', JSON.stringify(mqtt_whisper));
		}
		print('whisper end for ' , demod_name , ' --  ', nextone);
	}
	sleep(2000);
}
