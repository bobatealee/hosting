if (triggerFinger === undefined) var triggerFinger = {};
Game.registerMod("triggerFinger",{
	init:function(){
		triggerFinger.version = "2.3";
		triggerFinger.mode = 0;
		triggerFinger.scrollRate = 0;
		triggerFinger.clickGains = 0;

		window.GetModPath = (modName) => {
			let mod = App.mods[modName];
			let pos = mod.dir.lastIndexOf('\\');
			if(pos == -1) return '../mods/' + (mod.local ? 'local' : 'workshop') + '/' + mod.path;
			else return '../mods/' + mod.dir.substring(pos + 1);
		};
		
		triggerFinger.path = (App ? window.GetModPath('triggerFinger') : 'https://bobatealee.com/hosting/mods/triggerFinger');
		
		Game.registerHook("check", triggerFingerCheck);
		Game.registerHook("logic", triggerFingerLogic);
		Game.registerHook("reset", triggerFingerReset);

		// ======================================================================================
		// ABOUT
		// ======================================================================================
		// thanks to Lookas and z MANNNNNNN from the Dashnet Discord server for a few things here
		// this is my first big mod and by proxy a huge, bloated mess
		// i documented what i can so hopefully it helps you if you want to make your own mode
		// if you want to make your own challenge mode, feel free to use code here with credit
		// ======================================================================================
		// LOCALIZATION
		// ======================================================================================

		// replace '*' with 'EN' when localization for mod stuff is actually possible
		ModLanguage('*',{
			// ModLanguage doesn't support a lot of things so we're kind of just stuck with this for now
			"Trigger finger [ascension type]": "Trigger finger",
			"Since you\'re in a <b>Trigger finger</b> run, this upgrade also increases scrolling rate by <b>+%1%</b>.": "Since you\'re in a <b>Trigger finger</b> run, this upgrade also increases scrolling rate by <b>+%1%</b>.",  // would use "/", but...
			"Since you\'re in a <b>Trigger finger</b> run, this upgrade also increases clicking gains by <b>+%1</b> cookies for each cursor owned.": "Since you\'re in a <b>Trigger finger</b> run, this upgrade also increases clicking gains by <b>+%1</b> cookies for each cursor owned.",
			"Bake <b>%1</b> in one Trigger finger ascension.": "Bake <b>%1</b> in one Trigger finger ascension.",
			"Bake <b>%1</b> in one Trigger finger ascension.<div class=\"line\"></div>Owning this achievement unlocks a special heavenly upgrade.": "Bake <b>%1</b> in one Trigger finger ascension.<div class=\"line\"></div>Owning this achievement unlocks a special heavenly upgrade.",
			"In a Trigger finger run, have a scroll rate of <b>%1%</b>.": "In a Trigger finger run, have a scroll rate of <b>%1%</b>.",
			"Bake <b>%1</b> in one Trigger finger ascension without owning more than <b>10 cursors</b>.": "Bake <b>%1</b> in one Trigger finger ascension without owning more than <b>10 cursors</b>.",
		});

		// ======================================================================================
		// REPLACEMENT + HOOKS
		// ======================================================================================

		// ported over so it works here
		function writeIcon(icon) {
			return (icon[2]?'background-image:url(\''+icon[2].replace(/'/g,"\\'")+'\');':'')+'background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;';
		}

		// resets the mode upon hard reset
		function triggerFingerReset(hard) {
			if (hard) {
				triggerFinger.mode = 0
			}
		}

		// add additional ascension mode. this uses a decimal value (which is apparently somehow valid) to not interfere with any other potential future modes
		// if you use this mod as a base for your own challenge mode, please use some kind of big decimal to prevent errors when used with other modded modes. be mindful!
		
		triggerFinger.modeId = Object.keys(Game.ascensionModes).length
		
		Game.ascensionModes[triggerFinger.modeId] = {name:'Trigger finger',dname:loc("Trigger finger [ascension type]"),desc:loc("In this run, scrolling your mouse wheel on the cookie counts as clicking it. Some upgrades introduce new clicking behaviors. No clicking achievements may be obtained in this mode.<div class=\"line\"></div>Reaching 1 quadrillion cookies in this mode unlocks a special heavenly upgrade."),icon:[12,0]}, Game.ascensionModes

		// we're not actually going to be using the modded id, because that would break saves
		// we're going to immediately set the mode to 1 (Born again)
		// this gives the added benefit of Born again's rules (no heavenly upgrades, certain achievement unlocks, etc.) as well as not breaking saves
		triggerFinger.reincarnateStr = Game.Reincarnate.toString();
		triggerFinger.reincarnateStr = triggerFinger.reincarnateStr.replace('Game.ascensionMode=Game.nextAscensionMode;','Game.ascensionMode=Game.nextAscensionMode;' + `
				if (Game.ascensionMode == triggerFinger.modeId) {Game.ascensionMode = 1; triggerFinger.mode = 1;} else {triggerFinger.mode = 0}`)

		eval('Game.Reincarnate=' + triggerFinger.reincarnateStr);

		// list of achievements to ban only in this mode
		triggerFingerBannedAchievements = ['Speed baking I', 'Speed baking II', 'Speed baking III', 'Clicktastic', 'Clickathlon', 'Clickolympics', 'Clickorama', 'Clickasmic', 'Clickageddon', 'Clicknarok', 'Clickastrophe', 'Clickataclysm', 'The ultimate clickdown' ,'All the other kids with the pumped up clicks', 'One...more...click...', 'Clickety split']; // list of banned achievements
		if (Game.version > 2.043) {triggerFingerBannedAchievements.push('Ain\'t that a click in the head')}; // stupid futureproofing

		// injects the achievement bans into game logic
		triggerFinger.logicStr = Game.Logic.toString();
		for (let i of triggerFingerBannedAchievements) {
			let str = "Game.Win('"+i
			triggerFinger.logicStr = triggerFinger.logicStr.replace(str,'if(!triggerFinger.mode)' + str)
		}

		eval('Game.Logic=' + triggerFinger.logicStr);

		// spoof the stats menu, and add a new stat
		function triggerFingerStats(str) {
			document.getElementById("menu").innerHTML = str;

			if (Game.resets > 0 && triggerFinger.mode == 1) {
				// ascension mode inject
				ascensionModeStr='<span style="cursor:pointer;" '+Game.getTooltip(
				'<div style="min-width:200px;text-align:center;font-size:11px;">'+Game.ascensionModes[triggerFinger.modeId].desc+'</div>'
				,'top')+'><div class="icon" style="display:inline-block;float:none;transform:scale(0.5);margin:-24px -16px -19px -8px;'+writeIcon(Game.ascensionModes[triggerFinger.modeId].icon)+'"></div>'+Game.ascensionModes[triggerFinger.modeId].dname+'</span>';
				document.getElementById("statsSpecial").children[0].innerHTML = '<b>'+loc("Challenge mode:")+'</b>'+ascensionModeStr;

				// scroll rate inject
				const element = document.createElement("div.listing");
				element.innerHTML = '<div class="listing"><b>'+loc("Scroll rate:")+'</b> '+Beautify(triggerFinger.scrollRate)+'%'+'</div>';
				document.getElementById("statsSpecial").appendChild(element);
			}
		}

		const statsHandler = {
			get(target, prop, receiver) {
				let statsReturn = Reflect.get(...arguments);
				if (statsReturn instanceof Function) {
					statsReturn = statsReturn.bind(target);
				}
				return statsReturn;
			},

			set(target, prop, value) {
				if (prop === "innerHTML") {
					triggerFingerStats(value)
				} else {
					return Reflect.set(...arguments);
				}
			}
		};

		let old = globalThis["l"];
		globalThis["l"] = function (what) {
			const element = document.getElementById(what);
			if (what === "menu" && Game.onMenu == 'stats') return new Proxy(element, statsHandler);
			else return old(what);
		};

		// replace the heralds menu in its entirety (this will inevitably go out of date)
		Game.attachTooltip(l('heralds'),function(){
			var str='';

			if (!App && !Game.externalDataLoaded) str+=loc("Heralds couldn't be loaded. There may be an issue with our servers, or you are playing the game locally.");
			else
			{
				if (!App && Game.heralds==0) str+=loc("There are no heralds at the moment. Please consider <b style=\"color:#bc3aff;\">donating to our Patreon</b>!");
				else
				{
					str+='<b style="color:#bc3aff;text-shadow:0px 1px 0px #6d0096;">'+loc("%1 herald",Game.heralds)+'</b> '+loc("selflessly inspiring a boost in production for everyone, resulting in %1.",'<br><b style="color:#cdaa89;text-shadow:0px 1px 0px #7c4532,0px 0px 6px #7c4532;"><div style="width:16px;height:16px;display:inline-block;vertical-align:middle;background:url(img/money.png);"></div>'+loc("+%1% cookies per second",Game.heralds)+'</b>');
					str+='<div class="line"></div>';
					// silly little inject
					if (triggerFinger.mode==1) str+=loc("You are in a <b>Trigger finger</b> run, and are not currently benefiting from heralds.");
					else if (Game.ascensionMode==1) str+=loc("You are in a <b>Born again</b> run, and are not currently benefiting from heralds.");
					else if (Game.Has('Heralds')) str+=loc("You own the <b>Heralds</b> upgrade, and therefore benefit from the production boost.");
					else str+=loc("To benefit from the herald bonus, you need a special upgrade you do not yet own. You will permanently unlock it later in the game.");
				}
			}
			str+='<div class="line"></div><span style="font-size:90%;opacity:0.6;">'+(!App?loc("<b>Heralds</b> are people who have donated to our highest Patreon tier, and are limited to 100.<br>Each herald gives everyone +1% CpS.<br>Heralds benefit everyone playing the game, regardless of whether you donated."):loc("Every %1 current players on Steam generates <b>1 herald</b>, up to %2 heralds.<br>Each herald gives everyone +1% CpS.",[100,100]))+'</span>';

			str+='<div style="width:31px;height:39px;background:url(img/heraldFlag.png);position:absolute;top:0px;left:8px;"></div><div style="width:31px;height:39px;background:url(img/heraldFlag.png);position:absolute;top:0px;right:8px;"></div>';

			return '<div style="padding:8px;width:300px;text-align:center;" class="prompt"><h3>'+loc("Heralds")+'</h3><div class="block">'+str+'</div></div>';
		},'this');

		// ======================================================================================
		// BIG COOKIE
		// ======================================================================================

		// redefine clicking the cookie in its entirety for this mode (bonus: also prevents uncanny clicker achievement from being earned in this mode)
		triggerFingerScrollClick = function(e,amount)
		{
			Game.BigCookieState = 1
			var now = Date.now();
			if (e) e.preventDefault();
			if (Game.OnAscend || Game.AscendTimer>0 || Game.T<3 || now-Game.lastClick < 1000 / (triggerFinger.scrollRate/4)) {} // custom clicking threshhold, based on the old pre-steam one
			else
			{
				Game.loseShimmeringVeil('click');
				var amount = amount ? amount : Game.computedMouseCps;
				Game.Earn(amount);
				Game.handmadeCookies += amount;
				if (Game.prefs.particles)
				{
					Game.particleAdd();
					Game.particleAdd(Game.mouseX,Game.mouseY,Math.random()*4-2,Math.random()*-2-2,Math.random()*0.5+0.75,1,2);
				}
				if (Game.prefs.numbers) Game.particleAdd(Game.mouseX+Math.random()*8-4,Game.mouseY-8+Math.random()*8-4,0,-2,1,4,2,'','+'+Beautify(amount,1));

				Game.runModHook('click');

				Game.playCookieClickSound();
				Game.cookieClicks++;

				if (Game.clicksThisSession == 0) PlayCue('preplay');
				Game.clicksThisSession++;
				Game.lastClick = now;
			}
			Game.Click = 0;
			if (document.getElementById("bigCookie").mouseIsOver == true) {
				setTimeout(() => {Game.BigCookieState=2;}, 100) // make cookie bounce back
			};
		}

		triggerFinger.lastNotice = Date.now();
		triggerFinger.noticeCount = 0;
		function triggerFingerNotice(event){
			var now = Date.now();
			if (now - triggerFinger.lastNotice < 1000 / 4) {}
			else {
				if (!Game.HasAchiev('Just this once')){
					triggerFinger.noticeCount = triggerFinger.noticeCount += 1
					if (now - triggerFinger.lastNotice < 1000) {}
					else { // if it's been over a second since the last click, reset streak
						triggerFinger.noticeCount = 1;
					}
				}
				if (triggerFinger.noticeCount >= 15 && !Game.HasAchiev('Just this once')) {
					Game.Win('Just this once');
					triggerFinger.noticeCount = 0;
					Game.BigCookieState = 1
					Game.ClickCookie();
					setTimeout(() => {Game.BigCookieState=2;}, 100)
				}
				else {
					Game.Popup('<div style="font-size:80%;">'+loc("You are in a Trigger finger run, and can only click by scrolling!")+'</div>',Game.mouseX,Game.mouseY);PlaySound('snd/press.mp3');
				}
				triggerFinger.lastNotice = now;
			}
		}
		// nuke all of bigCookie's events
		var eventListenerReplace = document.getElementById('bigCookie'), eventListenerClone = eventListenerReplace.cloneNode(true);
		eventListenerReplace.parentNode.replaceChild(eventListenerClone, eventListenerReplace);

		// redefine bigCookie events so they can be removed properly (this is horrible)
		function mousedownBigCookie(event){
			Game.BigCookieState=1; if (Game.prefs.cookiesound) { Game.playCookieClickSound(); } if (event) event.preventDefault();
		}

		function mouseupBigCookie(event){
			Game.BigCookieState=2; if (event) event.preventDefault();
		}

		function mouseoutBigCookie(event){
			Game.BigCookieState=0;
		}

		function mouseoverBigCookie(event){
			Game.BigCookieState=2;
		}

		function touchstartBigCookie(event){
			Game.BigCookieState=1; if (event) event.preventDefault();
		}

		function touchendBigCookie(event){
			Game.BigCookieState=0; if (event) event.preventDefault();
		}

		// append new bigCookie events to the list of other ones
		if (!Game.touchEvents)
		{
			AddEvent(bigCookie,'click',Game.ClickCookie);
			AddEvent(bigCookie,'mousedown',mousedownBigCookie);
			AddEvent(bigCookie,'mouseup',mouseupBigCookie);
			AddEvent(bigCookie,'mouseout',mouseoutBigCookie);
			AddEvent(bigCookie,'mouseover',mouseoverBigCookie);
		}
		else
		{
			//touch events
			AddEvent(bigCookie,'touchend',Game.ClickCookie);
			AddEvent(bigCookie,'touchstart',touchstartBigCookie);
			AddEvent(bigCookie,'touchend',touchendBigCookie);
		}

		// hacky way to get hover state on big cookie
		document.getElementById("bigCookie").mouseIsOver = false;
		document.getElementById("bigCookie").onmouseover = function() {
			this.mouseIsOver = true;
		};

		document.getElementById("bigCookie").onmouseout = function() {
			this.mouseIsOver = false;
		}		

		// ======================================================================================
		// FUNCTIONALITY
		// ======================================================================================

		// new heavenly upgrades
		new Game.Upgrade('Warped cookies',loc("Cookie production multiplier <b>+%1% permanently</b>.",10)+'<q>Your meddling with the natural order has caused these cookies to take on an otherworldly appearance that can only be classified as somewhere between "cosmic beauty" and "Lovecraftian horror". Take your pick!</q>',25,[28, 12]);
		Game.last.pool='prestige';Game.last.parents=[Game.Upgrades['Legacy']];Game.last.posX=-25;Game.last.posY=-145;Game.last.showIf=function(){return (Game.HasAchiev('Till the wheels fall off'));};
		Game.PrestigeUpgrades.push(Game.last);

		// new achievements	
		new Game.Achievement('Rolling around',loc("Bake <b>%1</b> in one Trigger finger ascension.",loc("%1 cookie",LBeautify(1e5)))+'<q>(at the speed of sound)</q>',[1, 0, triggerFinger.path+"/icons.png"]).order=9001;
		new Game.Achievement('Infinite scroll',loc("Bake <b>%1</b> in one Trigger finger ascension.",loc("%1 cookie",LBeautify(1e6))),[2, 0, triggerFinger.path+"/icons.png"]).order=9001;
		new Game.Achievement('High roller',loc("Bake <b>%1</b> in one Trigger finger ascension.",loc("%1 cookie",LBeautify(1e9))),[3, 0, triggerFinger.path+"/icons.png"]).order=9001;
		new Game.Achievement('Tenosynovitis',loc("Bake <b>%1</b> in one Trigger finger ascension.",loc("%1 cookie",LBeautify(1e12)))+'<q>You should get that checked out.</q>',[4,0, triggerFinger.path+"/icons.png"]).order=9001;
		new Game.Achievement('Till the wheels fall off',loc("Bake <b>%1</b> in one Trigger finger ascension.<div class=\"line\"></div>Owning this achievement unlocks a special heavenly upgrade.",loc("%1 cookie",LBeautify(1e15))),[5,0, triggerFinger.path+"/icons.png"]).order=9001;
		new Game.Achievement('Fastest hand in the west',loc("In a Trigger finger run, have a scroll rate of <b>%1%</b>.",500),[0, 2, triggerFinger.path+"/icons.png"]).order=11011;
		new Game.Achievement('Just this once',loc("In a Trigger finger run, brute force your way into clicking the cookie."),[0, 0, triggerFinger.path+"/icons.png"]).order=11006;
		new Game.Achievement('Restraint',loc("Bake <b>%1</b> in one Trigger finger ascension without owning more than <b>10 cursors</b>.",loc("%1 cookie",LBeautify(1e12)))+'<q>Muscle memory is no joke! Billions of people suffer from muscle memory each year. It is a tragedy.</q>',[0, 0, triggerFinger.path+"/icons.png"]).order=31001;
		Game.last.pool='shadow';
		new Game.Achievement('Rollin\'',loc("Bake <b>%1</b> in one Trigger finger ascension.",loc("%1 cookie",LBeautify(1e18)))+'<q>Keep on rollin\', baby.</q>',[6, 0, triggerFinger.path+"/icons.png"]).order=9001;
		new Game.Achievement('Reinventing the wheel',loc("Bake <b>%1</b> in one Trigger finger ascension.",loc("%1 cookie",LBeautify(1e21))),[12, 1, triggerFinger.path+"/icons.png"]).order=9001;

		// plug everything into arrays to be saved
		triggerFinger.upgrades = [Game.Upgrades['Warped cookies']];
		triggerFinger.achievements = [Game.Achievements['Rolling around'], Game.Achievements['Infinite scroll'], Game.Achievements['High roller'], Game.Achievements['Tenosynovitis'], Game.Achievements['Till the wheels fall off'], Game.Achievements['Fastest hand in the west'], Game.Achievements['Just this once'], Game.Achievements['Restraint'], Game.Achievements['Rollin\''], Game.Achievements['Reinventing the wheel']];
		
		// unlock new stuff
		function triggerFingerCheck() {
			if (Game.cookiesEarned >= 100000 && triggerFinger.mode == 1) Game.Win('Rolling around');
			if (Game.cookiesEarned >= 1000000 && triggerFinger.mode == 1) Game.Win('Infinite scroll');
			if (Game.cookiesEarned >= 1000000000 && triggerFinger.mode == 1) Game.Win('High roller');
			if (Game.cookiesEarned >= 1000000000000 && triggerFinger.mode == 1) Game.Win('Tenosynovitis');
			if (Game.cookiesEarned >= 1000000000000000 && triggerFinger.mode == 1) Game.Win('Till the wheels fall off');
			if (triggerFinger.scrollRate >= 500 && triggerFinger.mode == 1) Game.Win('Fastest hand in the west');
			if (Game.cookiesEarned >= 1000000000000 && Game.Objects['Cursor'].highest < 11 && triggerFinger.mode == 1) Game.Win('Restraint');
			if (Game.cookiesEarned >= 1000000000000000000 && triggerFinger.mode == 1) Game.Win('Rollin\'');
			if (Game.cookiesEarned >= 1000000000000000000000 && triggerFinger.mode == 1) Game.Win('Reinventing the wheel');
		}

		Game.registerHook('cps',function(cps){return cps*(Game.Has('Warped cookies')?1.10:1);});

		// this multiplies your clicking gains by +0.05% per cursor. horrible idea? absolutely.
		Game.registerHook('cookiesPerClick',function(cookiesPerClick){return cookiesPerClick*((Game.Has('Reinforced index finger') && triggerFinger.mode == 1)?((Game.Objects['Cursor'].amount)*0.05+1):1);});

		// ======================================================================================
		// LOGIC
		// ======================================================================================

		// list of scroll rate upgrades
		// cap is 500
		triggerFingerScrollUpgrades = [
			{name:'Plastic mouse', power:150},
			{name:'Iron mouse', power:100},
			{name:'Titanium mouse', power:75},
			{name:'Adamantium mouse', power:50},
			{name:'Unobtainium mouse', power:25}
		];

		triggerFingerClickUpgrades = [
			{name:'Reinforced index finger', power:0.05}
		];
		triggerFingerInit = 0 // start uninitialized

		function triggerFingerLogic() {
			// if in trigger finger run
			if (triggerFinger.mode == 1) {
				// scroll rate addition
				// this probably doesn't do anything past a certain point
				triggerFinger.scrollRate=100;
				for (var i in triggerFingerScrollUpgrades) {
					if (Game.Has(triggerFingerScrollUpgrades[i].name)) triggerFinger.scrollRate=triggerFinger.scrollRate+(triggerFingerScrollUpgrades[i].power);
				}

				// if not initialized, start adding everything for trigger finger
				if (triggerFingerInit == 0) {
					// add to existing upgrade descs
					// baseDesc, true to its name, will be used for storing the original desc (without quotes for loc versions)
					// ddesc and baseDesc initially contain the same string, but ddesc is what displays for the user
					// desc contains pre-loc stuff like quotes, which is useful for replacement on loc versions
					for (var i in triggerFingerScrollUpgrades) {
						var replaceUpgradeDesc = Game.Upgrades[triggerFingerScrollUpgrades[i].name];
						replaceUpgradeDesc.ddesc = replaceUpgradeDesc.desc.replace('<q>','<div class="line"></div><div><div class="icon" style="vertical-align:middle;display:inline-block;'+writeIcon([12,0])+'transform:scale(0.5);margin:-16px;margin-left:-12px;margin-right:-12px;"></div>'+loc("Since you\'re in a <b>Trigger finger</b> run, this upgrade also increases scrolling rate by <b>+%1%</b>.",(triggerFingerScrollUpgrades[i].power))+'</div><q>');
						if (!EN) replaceUpgradeDesc.ddesc = replaceUpgradeDesc.ddesc.replace(/<q>.*/,''); // if not english, remove quote and everything after it
						replaceUpgradeDesc.ddesc = /*BeautifyInText*/(replaceUpgradeDesc.ddesc);
					}
					
					for (var i in triggerFingerClickUpgrades) {
						var replaceUpgradeDesc = Game.Upgrades[triggerFingerClickUpgrades[i].name];
						replaceUpgradeDesc.ddesc = replaceUpgradeDesc.desc.replace('<q>','<div class="line"></div><div><div class="icon" style="vertical-align:middle;display:inline-block;'+writeIcon([12,0])+'transform:scale(0.5);margin:-16px;margin-left:-12px;margin-right:-12px;"></div>'+loc("Since you\'re in a <b>Trigger finger</b> run, this upgrade also increases clicking gains by <b>+%1</b> cookies for each cursor owned.",(triggerFingerClickUpgrades[i].power))+'</div><q>');
						if (!EN) replaceUpgradeDesc.ddesc = replaceUpgradeDesc.ddesc.replace(/<q>.*/,''); // if not english, remove quote and everything after it
						replaceUpgradeDesc.ddesc = (replaceUpgradeDesc.ddesc);
					}

					// change bigCookie events to use trigger finger functionality
					bigCookie.removeEventListener('click',Game.ClickCookie); // remove mouse clicking
					bigCookie.removeEventListener('touchend',Game.ClickCookie); // remove touch clicking
					bigCookie.removeEventListener('mousedown',mousedownBigCookie); // remove mouse down
					bigCookie.removeEventListener('mouseup',mouseupBigCookie); // remove mouse up
					AddEvent(bigCookie,'wheel',triggerFingerScrollClick,mousedownBigCookie); // add scroll clicking
					AddEvent(bigCookie,'click',triggerFingerNotice); // add click notice

					// set initialized
					triggerFingerInit = 1
				}

				if (document.getElementById("bigCookie").mouseIsOver == false) {
					Game.BigCookieState = 0; // hacky code to make sure setTimeout behaves
				}
			}
			// if not in trigger finger run
			else {
				// if initialized, start revering everything back to normal
				if (triggerFingerInit == 1) {
					// remove from existing upgrade descs
					for (var i in triggerFingerScrollUpgrades) {
						var replaceUpgradeDesc = Game.Upgrades[triggerFingerScrollUpgrades[i].name];
						replaceUpgradeDesc.ddesc = BeautifyInText(replaceUpgradeDesc.baseDesc);
					}

					for (var i in triggerFingerClickUpgrades) {
						var replaceUpgradeDesc = Game.Upgrades[triggerFingerClickUpgrades[i].name];
						replaceUpgradeDesc.ddesc = BeautifyInText(replaceUpgradeDesc.baseDesc);
					}

					// restore bigCookie events
					AddEvent(bigCookie,'click',Game.ClickCookie); // add mouse clicking
					AddEvent(bigCookie,'mousedown',mousedownBigCookie); // add touch clicking
					AddEvent(bigCookie,'mouseup',mouseupBigCookie); // add mouse down
					AddEvent(bigCookie,'touchend',Game.ClickCookie); // add mouse up
					bigCookie.removeEventListener('wheel',triggerFingerScrollClick,mousedownBigCookie); // remove scroll clicking
					bigCookie.removeEventListener('click',triggerFingerNotice); // remove click notice

					// set uninitialized
					triggerFingerInit = 0
				}
			}
		}

		LocalizeUpgradesAndAchievs(); // make loc strings for upgrades actually work

		Game.Notify("Trigger Finger loaded!", "Version "+triggerFinger.version, [12,0], 2, 1);
	},

	save:function() {
		const save = {
			version: triggerFinger.version,
			mode: triggerFinger.mode,
			upgrades: {},
			achievements: {}
		}
		for (const upgrade of triggerFinger.upgrades) {
			save.upgrades[upgrade.name] = upgrade.bought
		}
		for (const achievement of triggerFinger.achievements) {
			save.achievements[achievement.name] = achievement.won
		}
		return JSON.stringify(save)
	},

	load:function(str) {
		const save = JSON.parse(str)
		if (save.version !== undefined) {
			triggerFinger.mode = save.mode
			if (save.upgrades !== undefined) {
				for (const upgrade of triggerFinger.upgrades) {
					upgrade.bought = save.upgrades[upgrade.name] || false
				}
			}
			if (save.achievements !== undefined) {
				for (const achievement of triggerFinger.achievements) {
					achievement.won = save.achievements[achievement.name] || false
				}
			}
		}
	}
});