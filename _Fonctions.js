/********** V2 (lvl95->?) *******
Tir en priorité au cac.
*/

include("_InitGlobal");
include("map_de_danger_V2");
include("Attaque");

function protectionAbsolueProchainTour(){	
	effects = getEffects();
	shieldNextTurn = 0;
	//debug("Mes effets : "+getEffects());

	arrayIter(effects, function(effect){
		if(effect[0]==EFFECT_ABSOLUTE_SHIELD && effect[3]>1){
			shieldNextTurn = shieldNextTurn + effect[1];
		}
	});
	return shieldNextTurn;
}

function tropdeProtection(){
	var bool=false;
	if(getAbsoluteShield(enemy['id'])>=160){
		bool = true;
	}
	if(getRelativeShield(enemy['id'])>=20 && getAbsoluteShield(enemy['id'])>=100){
		bool = true;
	}
	if(getRelativeShield(enemy['id'])>=50){
		bool = true;
	}
	if(my['weapons'][1]['maxDmg'] <50) {
		debug("Dommages max hache<50");
		bool=true;
	}
	return bool;
}

function modePrudent(){
	var res = false;
	var poidForce = getStrength(enemy['id']) - getStrength(); 
	var poidVie = getLife(enemy['id']) - getLife();
	if(poidVie>0 && getAbsoluteShield()<= 105){
		res=true;
	}
	if(getAbsoluteShield()<= 75){
		res=true;
	}
	return res;
}

function jeDevraisBattreEnRetraite(){	
	var relativeLifeEnemy = getLife(enemy['id'])/getTotalLife(enemy['id']);
	var relativeLife = getLife()/getTotalLife();
	return relativeLife<0.7 && relativeLife<relativeLifeEnemy;
}

function calculeOffensive(){
	calculeChip(CHIP_STALACTITE);
	calculeChip(CHIP_LIBERATION);	
	my['chips'][CHIP_ICEBERG]['canUseThisTurn']=calculeAOE(my['chips'][CHIP_ICEBERG]);
	calculeArme(1);
	calculeArme(2); //TODO remettre quand on aura 13 TPs
}

function offensive(){
	debug("CHARGEEZZ");
	/********* SI ON PEUT UTILISER STALACTITE EN SE DEPLACANT *********/
	if(my['chips'][CHIP_ICEBERG]['canUseThisTurn'] && jePeuxChiper(CHIP_ICEBERG)){
		debug("Je peux utiliser iceberg");
		if(getTP()==12 && my['weapons'][1]['canUseThisTurn']){
			debug("Mais j'ai mieux à faire avec 12pts");
		} else {
			customMove(my['chips'][CHIP_ICEBERG]['aoe'][0]);
			useChipOnCell(CHIP_ICEBERG,my['chips'][CHIP_ICEBERG]['aoe'][1]);
		}
	}

	if(my['chips'][CHIP_STALACTITE]['canUseChip']&& getTP()>=6){
		debug("Deplacement pour utiliser stalactite");
		customMove(my['chips'][CHIP_STALACTITE]['closestCell']);
		useChip(CHIP_STALACTITE, enemy['id']);
	}	

	/********* ARME ACTUELLE SI POSSIBLE ******/
	if (my['weapons'][1]['canUseThisTurn'] && getTP()>=6
	&& my['weapons'][1]['maxDmg'] > 3){
		customMove(my['weapons'][1]['closestCell']);		
		infligerDmg(1);
	}	

	/********* SI ON PEUT TIRER EN CHANGEANT D'ARME **********/
	//Si on peut se faire kiter
	/*
	if (getTotalMP()<=getTotalMP(enemy['id'])
	&& my['weapons'][2]['canUseThisTurn'] && getTP()>=7
	&& my['weapons'][2]['maxDmg'] > 6){
		if(my['weapons'][2]['mpsRequired']>0){
				moveTowardCell(my['weapons'][2]['closestCell']);
		}
		infligerDmg(2);
	}	*/
	// sinon tir en aoe
	
	// On peut pas tirer? Dans ce cas on check les bulbes
	voirSiOnPeutTuerDesBulbes();
}

function identifyDangers(cle,val){
	debug("Arme "+getWeaponName(val));
	//debug(getCellsToUseWeapon(val, enemy['id'])); pas bon car l'ennemi peut se déplacer
	//pushAll(enemy['threats'], getCellsToUseWeapon(val, enemy['id'])); 
}

function jePeuxChiper(chip){
	var res = false;
	if(getCooldown(chip)==0 && 
	getChipCost(chip)<=getTP()
	){
		res = true;
	}
	return res;
}


function queFaireApresEnnemiMort(){
	selectionAdversaire();
	calculeOffensive();
	offensive();
}

/**
* Param my['weapons'][2] 
*/
function calculeAOE(@tool){
/*
	var distance = getDistance(getCell(), getCell(ennemis));
	var zone = getEffectiveArea(tool, getCell(ennemis));
	if (zone != null) {
		for (var cell in zone) {
			var valeur = sommeDegat + min(getTotalLife() - getLife(), sommeVolVie) - sommeRenvoi;
			if (valeur > valeurMax || valeur == valeurMax && cellsAccessible[cell_deplace] < distanceBestAction) {
				bestAction[CELL_DEPLACE] = cell_deplace;
				bestAction[CELL_VISE] = cell;
				bestAction[VALEUR] = valeur;
				valeurMax = valeur;
				distanceBestAction = cellsAccessible[cell_deplace];
			}
		}			
	}
	*/
	var canUse = false;
	var accessibleCells = getAccessibleCells(getCell(),getMP());
	tool['aoe'] = attaqueTypeAOE(getEnemies(), tool['name'], accessibleCells);
	if (tool['aoe'] != [] && tool['aoe'] != null ){ 
		debug("AOE feature ! "+tool['aoe'] );
		canUse = true;
	}
	return canUse;
}

function jeVaisPouvoirTirer(){
	return my['weapons'][1]['canUseThisTurn'] || my['weapons'][2]['canUseThisTurn']||
	my['chips'][CHIP_STALACTITE]['canUseChip'] || my['chips'][CHIP_ICEBERG]['canUseThisTurn'];
}

/**
* Calcule les zones de tirs et retourne si je peux utiliser l'arme ce tour-ci
*/
function calculeArme(num){
	var canUseThisTurn = false; 
	var tableauDeCellsArme=getCellsToUseWeapon(my['weapons'][num]['name'],enemy['id']);
	//debug(tableauDeCellsArme);
	my['weapons'][num]['mpsRequired'] = 150; // Reset distance 
	var calculDistanceMin = function (cell){
		if(getOperations()<OPERATIONS_LIMIT*0.8){
			var temp = getPathLength(my['cell'], cell);
			if(temp!=null && temp<my['weapons'][num]['mpsRequired']){
				my['weapons'][num]['mpsRequired'] = temp;
				my['weapons'][num]['closestCell'] = cell;
			}
		} else {
			debug("CA VA PETER FAUT SORTIR TROP D OPERATIONS ! ");
		}
	};
	arrayIter(tableauDeCellsArme, calculDistanceMin);	
	//debug("["+my['weapons'][num]['name']+"] Cellule la plus proche : "+my['weapons'][num]['closestCell']+" distance(mps): "+my['weapons'][num]['mpsRequired']);
	
	if(my['weapons'][num]['mpsRequired']===150){
		debug("no path for this weapon");
		my['weapons'][num]['mpsRequired'] = null;
		my['weapons'][num]['closestCell'] = null;
	} else {
		if (canUseWeapon(my['weapons'][num]['name'], enemy['id'])){
			canUseThisTurn = true;
		} else if(my['weapons'][num]['mpsRequired']<=my['mps']){
			canUseThisTurn = true;
		}
	}
	
	my['weapons'][num]['canUseThisTurn']=canUseThisTurn;	
	calculeDmgArme(num);
	return canUseThisTurn;
}

function calculeChip(chip){
	var canUse = false;
	if(jePeuxChiper(chip)){
		var tableauDeCells = getCellsToUseChip(chip, enemy['id']);
		my['chips'][chip]['mpsRequired'] = 100; // Reset distance 
		var calculDistanceMin = function (cell){
			if(getOperations()<OPERATIONS_LIMIT*0.8){
				var temp = getPathLength(my['cell'], cell);
				if(temp!=null && temp<my['chips'][chip]['mpsRequired']){
					my['chips'][chip]['mpsRequired'] = temp;
					my['chips'][chip]['closestCell'] = cell;
				}
			} else {
				debug("CA VA PETER FAUT SORTIR TROP D OPERATIONS ! ");
			}
		};
		arrayIter(tableauDeCells, calculDistanceMin);
		canUse = my['chips'][chip]['mpsRequired']<=my['mps'];
	} 
	my['chips'][chip]['canUseChip'] = canUse;
	//debug(my['chips']);
	return canUse;
}

function voirSiOnPeutTuerDesBulbes(){
	arrayIter(bulbs, function(id){
		/* Si on a des pts pour tirer */	
		if (getTP()>getWeaponCost(getWeapon())){
			/* Si un bulbe est à porté de tir */
			if(canUseWeapon(getWeapon(), id)){
				debug("Saleté de Bulbe, ça dégage !");
				degommerBulbe(id);
			} else {
				var tableauCells=getCellsToUseWeapon(getWeapon(),id);
				for (var val in tableauCells){
					var distance = getPathLength(my['cell'], val);
						//debug(" Distance bulbe : "+distance);
						if(distance!=null && distance<=my['mps']){
							customMove(val);
							degommerBulbe(id);
							break;
						}
				}				
			}
		}			
	});
}

function jeMeCasse(){
	debug("Je me casse ! On s'éloigne du poireau");
	//moveAwayFromCells(enemy['threats']);
	moveAwayFrom(enemy['id']);
}

function jaiBesoinDeMeShield(){
	return (getCooldown(CHIP_SHIELD)==1) || (getCooldown(CHIP_HELMET)==1);
}

function degommerBulbe(id){
	useWeapon(id);
	if(getLife(id)>0){
		debug("Merde il est encore vivant");
		useWeapon(id);
	}
	if(getLife(id)==0){
		queFaireApresEnnemiMort();
	}
}

function estimationdmg(weaponNumber,coef){
	return my['weapons'][weaponNumber]['minDmg']+(my['weapons'][weaponNumber]['maxDmg'] - my['weapons'][weaponNumber]['minDmg'])*coef;
}

function estimationMinMaxCoef(min,max,coef){
	return min+(max-min)*coef;
}

// coef chance entre 0 et 1 
// Combo stalactite + arme
function estimationFullBurstCombo1(coef){
	var estimation=0;
	var tps = getTP();
	var mps = getMP();
	if (my['chips'][CHIP_STALACTITE]['canUseChip']){
		estimation += estimationMinMaxCoef(64,67,coef);
		tps -= 6;
		//debug("+++stalactite");
	}
	if (my['weapons'][currentWeaponNumber]['canUseThisTurn']){
		var nbTirs = floor(tps/my['weapons'][currentWeaponNumber]['rawCost']);
		var dmg = estimationdmg(currentWeaponNumber,coef);
		//debug("++"+dmg+" x "+nbTirs);
		estimation += dmg*nbTirs;
		tps -= nbTirs*my['weapons'][currentWeaponNumber]['rawCost'];
	}
	debug("Estimation full-burst combo (avec "+coef+" de réussite) : "+estimation);
	combos[1]=estimation;
	return estimation;
}

// 2 coups d'arme actuelle
function estimationFullBurstCombo2(coef){
	var estimation=0;
	var tps = getTP();
	var mps = getMP();
	if (my['weapons'][currentWeaponNumber]['canUseThisTurn']){
		var nbTirs = floor(tps/my['weapons'][currentWeaponNumber]['rawCost']);
		var dmg = estimationdmg(currentWeaponNumber,coef);
		debug("++"+dmg+" x "+nbTirs);
		estimation += dmg*nbTirs;
		tps -= nbTirs*my['weapons'][currentWeaponNumber]['rawCost'];
	}
	//debug("Estimation full-burst combo  (avec "+coef+" de réussite) : "+estimation);
	combos[2]=estimation;
	return estimation;
}

// Bug tour10 je tappe pas https://leekwars.com/fight/27042327
function infligerDmg(armeId){
	/******** PREDICTION ********/
	var armeName = my['weapons'][armeId]['name'];
	var tps = getTP(); 
	var tpsAfterWeapon = (getWeapon()!=armeName)? tps-1 : tps;
	var nbShots = floor(tpsAfterWeapon / my['weapons'][armeId]['rawCost']);
	var tpsLeft = tpsAfterWeapon % my['weapons'][armeId]['rawCost'];
	
	debug("On va taper ["+nbShots+"] fois avec arme "+armeId+" = "+my['weapons'][armeId]);
	debug("PTs avant->après : "+getTP()+"/"+tpsLeft);
	
		
	
	/*********** Phase de tir **************/	
	if (getWeapon()!=armeName && my['weapons'][armeId]['rawCost']<=getTP()) {
		debug("Changement d'arme "+getWeapon()+" -> "+armeName);
		setWeapon(armeName); // Attention : coûte 1 PT	
	}
	useWeapon(enemy['id']);
	useWeapon(enemy['id']);
	
	if(getLife(enemy['id'])==0){
		debug("!! Ennemi mort !!");
		queFaireApresEnnemiMort();
	}
	
	jaitire = true;
}

function preparationProchainTour(){
	var coefDrawIncoming = getTurn()/50; // plus les tours passent plus je me bouge
	var coefLife = getLife()/getTotalLife(); // plus j'ai de vie plus je me bouge
	//debug("Plus petit coef : "+min(coefLife, coefDrawIncoming));
	var danger = dangerCombo(getDanger(getAliveEnemies(),ME));
	var minDmg = round(arrayMin(danger));
	var maxDmg = round(arrayMax(danger));
	//var tolerableDmg = minDmg + (maxDmg-minDmg)*min(coefLife, coefDrawIncoming);
	var tolerableDmg = getLife() === getTotalLife() ? 20:11;
	debug("min "+minDmg+" max:"+maxDmg);
	var distanceEnnemy = 100;
	assocSort(danger);
	//debug(danger);
	debugArrayMap(danger);
	var bestCell = null;
	for(var cell:var dmg in danger){
		// Find the closest cell to the ennemy between the cells of the smalest danger value
		if(dmg<= minDmg + tolerableDmg){
			var tempDist = getPathLength(cell,getCell(enemy['id']));
			if(tempDist!=null && tempDist<distanceEnnemy){						
				//debug("distance "+cell+"-> "+tempDist);
				distanceEnnemy = tempDist;
				bestCell = cell;
			}
		}
	}
	if(bestCell!=null){
		customMove(bestCell);
		debug("let's go to "+bestCell+" to take maximum "+danger[bestCell]);
	} else{		
		debug("*** ERROR CELLULE prepProchainTour on bouge pas");
		customMove(getNearestEnemy());
	}
}

function yoloOuPasYolo(){
	if(enemy['sorcier']){
		//Il risque de fuir en permanence on essaye de le coller au max && getMP()<getMP(enemy['id']
		// Fuir si je me prends une raclée
		customMove(my['weapons'][1]['closestCell']);
	} else if(jeDevraisBattreEnRetraite()){
		preparationProchainTour();
	} else if(prudent && dontWaitTooMuch < NB_TURN_BEFORE_YOLLO){
		preparationProchainTour();
		dontWaitTooMuch += 1;
	} else {
		// YOOOLOOOO faut prendre des risques, surtout si l'ennemi fuit
		debug("YOLOOO");
		prudent = false;
		dontWaitTooMuch -= 1; // on arrête le yolo après quelques tours
		customMove(my['weapons'][1]['closestCell']);
		if(dontWaitTooMuch === 0){
			prudent = true;	
		}
	}
}

function customMove(cell){
	if(cell===null){
		debug("L'ennemi est innaccessible !");
		moveTowardLeeks(getEnemies());
	}else{			
		moveTowardCell(cell);
	}
}

function etrePrudent(bool){
	dontWaitTooMuch = bool?0:NB_TURN_BEFORE_YOLLO;
	prudent = bool;	
}

function etincelleOuHeal(){
	//debug("Dommages infligeables avec étincelle : ~" + dmgEtincelle);
	if(dmgEtincelle<12 && canUseChip(CHIP_BANDAGE, moi)){
		useChip(CHIP_BANDAGE,moi);
	} else if(canUseChip(CHIP_SPARK, enemy['id'])) {
		useChip(CHIP_SPARK, enemy['id']);		
	}
}
function shouldUseProtection(){
	var res=false;
	var distance = getCellDistance(enemy['cell'], my['cell']);
	//"Est-ce que je me protège ? Hmm..."
	//debug("Distance entre nous : "+distance);
	//debug("MP enemi : "+enemyMp+" ; Mp bibi : "+myMp);
	var perimeter = 13 + enemy['mps'] + my['mps'];
	//debug("perimeter : "+perimeter);
	//debug("dmg infligeables : "+estimationDommagesInfligeables(12)+ " enemy life : "+getLife(enemy['id']));
	if(distance<=perimeter){
		res=true;
	}
	// ANTI SORCIER 
	if(getMagic(enemy['id'])>getStrength(enemy['id'])){
		debug("SORCIER AU BUCHER");
		enemy['sorcier']=true;
		if(getStrength(enemy['id'])<100){
			res=false;
		}
		if(getLife()<getTotalLife()-2*montantDuSoin(CHIP_VACCINE)){
			useChip(CHIP_VACCINE,moi);
		}
	} else {
		enemy['sorcier']=false;
	}
	return res;
}

function jePeuxAchever(){
	var coef = 0.5; // 1/2 chances de faire ces dommages
	var res = false;	
	
	if(getLife(enemy['id'])<= estimationFullBurstCombo1(coef) ||
	getLife(enemy['id'])<= estimationFullBurstCombo2(coef)){
		debug("FINISHER je peux achever !");
		res=true;
	}
	return res;
}

function montantDuSoin(chip){
	var effect = getChipEffects(chip);
	var soinsMin = effect[0][1]*(1+getWisdom()/100);
	debug("La puce me soigne de minimum "+soinsMin);
	return soinsMin;
}

function isItWorthMachineGun(){
	return canUseWeapon(WEAPON_MACHINE_GUN,enemy['id']);
}

function jeDevraisMeBoost(){
	var res = (getLife()>getTotalLife()*0.8)?true:false; //Si j'ai 80%+ heal négligeable
	// Si l'apport en dmg du boost est significatif (suppérieur au gain du heal)
	// (Est-ce que le heal peut me permettre de survivre un tour de plus?)
	// (Est-ce que 10pv à moi valent plus que 10pv adverses, en fonction des dmg armure etc)
	// Alors oui
	return res;
}









function antiPoison() {
//Pour liberation
	var effectsTemp = getEffects(); 
	var poisonEffects = 0;
	var poisonValeur = 0;
	var dmgNextTurn = 0;
	arrayIter(effectsTemp, function(effect){
		if(effect[0]==EFFECT_POISON && effect[3]>1){
			poisonEffects += 1;
			poisonValeur += (effect[3]-1) * effect[1];
			dmgNextTurn += effect[1];
		}
	});
	if(poisonEffects>0){
		debug("DAMN Je suis empoisonné ! Encore "+poisonEffects+" effets, je vais subir en tout : "+poisonValeur);
	}
	// TODO ne pas le retirer si mon heal au prochain tour > dmgNextTurn
	if(poisonEffects>1 && poisonValeur>220){		
		if(jePeuxChiper(CHIP_ANTIDOTE)){
			useChip(CHIP_ANTIDOTE,moi);
		} else if(jePeuxChiper(CHIP_LIBERATION)){
			debug("Pas d'antidote sous la main, on se libère que si c'est rentable");
			if(poisonValeur>=380 || (!tropdeProtection()&&poisonValeur>=280)){			
				useChip(CHIP_LIBERATION,moi);
			}
		} else if (getLife() < dmgNextTurn || getLife() < getTotalLife()-montantDuSoin(CHIP_REGENERATION)*0.8)	{
			debug("On essaye de pas crever !");
			useChip(CHIP_REGENERATION, moi);
		}
	} 
}