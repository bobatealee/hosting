


const scriptsInEvents = {

	async Game_events_Event1_Act1(runtime, localVars)
	{
		window.addEventListener("wheel", e => e.preventDefault(), { passive:false })
	}

};

self.C3.ScriptsInEvents = scriptsInEvents;

