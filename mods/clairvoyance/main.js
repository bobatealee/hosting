if (clairvoyance === undefined) var clairvoyance = {};
Game.registerMod("clairvoyance", {
	init:function(){
		clairvoyance.version = "2.3";
		clairvoyance.fateLength = 10; // default to 10

		// snippet from ccse, thanks klattmose: https://klattmose.github.io/CookieClicker/CCSE-POCs/
		window.GetModPath = (modName) => {
			let mod = App.mods[modName];
			let pos = mod.dir.lastIndexOf('\\');
			if(pos == -1) return '../mods/' + (mod.local ? 'local' : 'workshop') + '/' + mod.path;
			else return '../mods/' + mod.dir.substring(pos + 1);
		};
		
		clairvoyance.path = (App ? window.GetModPath('clairvoyance') : 'https://bobatealee.com/hosting/mods/clairvoyance');
		
		// ported over so it works here
		function writeIcon(icon) {
			return (icon[2]?'background-image:url(\''+icon[2].replace(/'/g,"\\'")+'\');':'')+'background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;';
		}

		// once the game initializes everything, initialize the inject
		function clairvoyanceLogic() {
			if (Game.Objects["Wizard tower"].minigameLoaded == true && "clairvoyance.statsLoaded" in window == false) {
				clairvoyanceInit();
				Game.removeHook("logic", clairvoyanceLogic);
			}
		}
		
		Game.registerHook("logic", clairvoyanceLogic);

		// localization
		ModLanguage('*',{
			"Clairvoyance": "Clairvoyance",
			"Fate length": "Fate length",
			"Your fate:": "Your fate:",
			"Default": "Default",
			"%1 or %2 only": "%1 or %2 only",
			// strings already exist, but have stuff tacked on. redefine them
			"Lucky": "Lucky",
			"Ruin": "Ruin",
			"Sweet": "Sweet",
			// strings do not exist
			"Cookie storm drop": "Cookie storm drop",
			"Building special": "Building special",
			"Blab": "Blab",
		});

		// some snippets based on this mod by klattmose: https://www.reddit.com/r/CookieClicker/comments/au2rsx/ingame_fthof_predictor_mod/
		function clairvoyanceInit() {
			if (!("clairvoyance.statsloaded" in window)) {
				clairvoyanceMinigame = Game.Objects["Wizard tower"].minigame;
				let originalSpellTooltip = clairvoyanceMinigame.spellTooltip;
				clairvoyanceMinigame.spellTooltip = function (id) {
					let originalCallback = originalSpellTooltip(id);
					return function () {
						let originalString = originalCallback();
						let ourTooltip = originalString.substring(0, originalString.length - "</div></div>".length);
						let me = clairvoyanceMinigame.spellsById[id];
						ourTooltip += "<div></div>" + clairvoyance.spellForecast(me);
						return ourTooltip;
					};
				};
			}

			clairvoyance.statsloaded = 1;

			clairvoyance.seededResults = function (spellCount, column, failChance, active) {
				var res = "";
				var clairvoyanceChoice = "";
				Math.seedrandom(Game.seed + "/" + spellCount);
				var roll = Math.random();

				if (roll < 1 - failChance) {
					// good effects
					if (column > 0) Math.random();
					if (column > 1) Math.random();
					Math.random();
					Math.random();

					var choices = [];
					choices.push(loc("Frenzy"),loc("Lucky"));
					if (!Game.hasBuff("Dragonflight")) choices.push(loc("Click frenzy"));
					if (Math.random()<0.1) choices.push(loc("Cookie storm"),loc("Cookie storm"),"<span style=\"color:#999999;\">"+loc("Blab")+"</span>");
					if (Game.BuildingsOwned>=10 && Math.random()<0.25) choices.push(loc("Building special"));
					if (Math.random()<0.15) choices=[loc("Cookie storm drop")];
					if (Math.random()<0.0001) choices.push("<span style=\"color:#F9E38B;\">"+loc("Sweet")+"</span>");

					clairvoyanceChoice = choose(choices);
					res = '<span class="green" style="font-size:11px; text-transform:capitalize;"><b>' + clairvoyanceChoice + "</b></span><br/>";
				}
				else {
					// bad effects
					if (column > 0) Math.random();
					if (column > 1) Math.random();
					Math.random();
					Math.random();

					var choices = [];
					choices.push(loc("Clot"),loc("Ruin"));
					if (Math.random()<0.1) choices.push("<span style=\"color:#FF89E7;\">"+loc("Cursed finger")+"</span>","<span style=\"color:#FF89E7;\">"+loc("Elder frenzy")+"</span>");
					if (Math.random()<0.003) choices.push("<span style=\"color:#F9E38B;\">"+loc("Sweet")+"</span>");
					if (Math.random()<0.1) choices=["<span style=\"color:#999999;\">"+loc("Blab")+"</span>"];

					clairvoyanceChoice = choose(choices);
					res = '<span class="red" style="font-size:11px; text-transform:capitalize;"><b>' + clairvoyanceChoice + "</b></span><br/>";
				}
				return (
					"<td" + (active ? ' style="width:50%; text-shadow:0px 0px 6px currentColor;"' : ' style="width:50%; opacity:0.5;"') + ">" + res + "</td>"
				);
			};

			clairvoyance.spellForecast = function (spell) {
				var clairvoyanceTooltip = '<div width="100%"><div class="line" style="margin-top:8px; margin-bottom:0;"></div><span class="icon" style="vertical-align:middle;display:inline-block;' + writeIcon([0, 0, clairvoyance.path + '/icons.png']) + 'transform:scale(0.5);margin:-12px;margin-right:-8px;"></span><b style="vertical-align:middle;">'+loc("Your fate:")+'</b>';
				var spellsCast = clairvoyanceMinigame.spellsCastTotal; // player's total spells cast; determines seeded results
				var failChance = clairvoyanceMinigame.getFailChance(spell); // default fail chance per spell
				var column = Game.season == "valentines" || Game.season == "easter" ? 1 : 0; // column logic - if season is valentines or easter, use right column; otherwise, use left column
				var resultRange = spellsCast + clairvoyance.fateLength; // result range (default to 10)

				switch (spell.name) {
					case loc("Force the Hand of Fate"):
						clairvoyanceTooltip =
						clairvoyanceTooltip + '<table width="100%" style="margin-top:1px;"><tr><td><b style="color:#CCCCCC;font-size:12px;">'+loc("Default")+'</b></td><td><b style="color:#CCCCCC;font-size:12px;">'+loc("%1 or %2 only",['<div class="icon" style="vertical-align:middle;display:inline-block;'+writeIcon([0, 12])+'transform:scale(0.5);margin:-16px;"></div>','<div class="icon" style="vertical-align:middle;display:inline-block;'+writeIcon([20, 3])+'transform:scale(0.5);margin:-16px;"></div>'])+'</b></td>';
						for (var i = 0; i < 2; i++) clairvoyanceTooltip += "</tr>";

						while (spellsCast < resultRange) { // generate/refresh visual spell list
							clairvoyanceTooltip += "<tr>";
							for (var i = 0; i < 2; i++)
							clairvoyanceTooltip += clairvoyance.seededResults(spellsCast, i, failChance, column == i);
							clairvoyanceTooltip += "</tr>";

							spellsCast += 1;
							Math.seedrandom();
						}

						clairvoyanceTooltip += "</table></div>";
					break;

					default:
						clairvoyanceTooltip = ""; // prevents additional info from appearing on anything that isn't fthof
				}
				return clairvoyanceTooltip;
			};
		}

		// custom options menu handling
		// if ccse not defined
		if (typeof CCSE === 'undefined') {
			var clairvoyanceUpdateMenu = Game.UpdateMenu.bind({});

			Game.UpdateMenu = () => {
				clairvoyanceUpdateMenu();
				if (Game.onMenu=='prefs') {
					var str='';
					str+=
						'<div class="block" style="padding:0px;margin:8px 4px;">'+
							'<div class="subsection" style="padding:0px;">'+
							
								'<div class="title">'+loc("Clairvoyance")+'</div>'+
								'<div class="listing">'+
									Game.WriteSlider('clairvoyanceSlider',loc("Fate length"),'[$]',function(){return clairvoyance.fateLength;},'clairvoyance.fateLength = (Math.round(l(\'clairvoyanceSlider\').value));l(\'clairvoyanceSliderRightText\').innerHTML=clairvoyance.fateLength;')+'<br>'
								'</div>'+
							'</div>'+
						'</div>';
					document.getElementById('menu').children[document.getElementById('menu').children.length-1].insertAdjacentHTML("beforebegin", str);
					document.getElementById('clairvoyanceSlider').setAttribute('min',1);
					document.getElementById('clairvoyanceSlider').setAttribute('max',40);
				}
			}
		}
		// else, hook into ccse
		else {
			Game.customOptionsMenu.push(function(){
				CCSE.AppendCollapsibleOptionsMenu("Clairvoyance", clairvoyance.getMenuString());
				if (CCSE.collapseMenu["Clairvoyance"] == 0) {
					document.getElementById('clairvoyanceSlider').setAttribute('min',1);
					document.getElementById('clairvoyanceSlider').setAttribute('max',40);
				}
			});

			clairvoyance.getMenuString = function(){
				var str = '<div class="listing">'+Game.WriteSlider('clairvoyanceSlider',loc("Fate length"),'[$]',function(){return clairvoyance.fateLength;},'clairvoyance.fateLength = (Math.round(l(\'clairvoyanceSlider\').value));l(\'clairvoyanceSliderRightText\').innerHTML=clairvoyance.fateLength;')+'<br>';+'</div>';
				return str;
			}
		}

		Game.Notify("Clairvoyance loaded!", "Version "+clairvoyance.version, [0, 0, clairvoyance.path+"/icons.png"], 2, 1);
	},

	save:function() {
		const save = {
			version: clairvoyance.version,
			fateLength: clairvoyance.fateLength
		}
		return JSON.stringify(save)
	},

	load:function(str) {
		const save = JSON.parse(str)
		if (save.version !== undefined) {
			clairvoyance.fateLength = save.fateLength
		}
	}
});