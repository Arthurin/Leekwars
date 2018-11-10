global moi = getLeek();
global my = [];
my['turnOrder'] = getEntityTurnOrder();
global enemy = ['weapons':[],'sorcier':false];
global NB_TURN_BEFORE_YOLLO = 12;
debug("*** Turn "+getTurn()+" ***");
my['cell'] = getCell();
my['x'] = getCellX(my['cell']);
my['y'] = getCellY(my['cell']);
my['mps'] = getMP(moi);
global currentWeaponNumber;
global otherWeaponNumber;
global dontWaitTooMuch = 0;
global prudent = true;
global jaitire;
jaitire = false;
global dmgEtincelle; 
global enemies = [];

selectionAdversaire();

if(getTurn()==1){
	//INIT
	// MY WEAPONS
	my['weapons'] = arrayMap([1:WEAPON_AXE,2:WEAPON_GRENADE_LAUNCHER], function(cle,val){
		var weapon = getWeaponEffects(val);
		var temp = ['name':val,'rawMin':weapon[0][1],'rawMax':weapon[0][2], 'rawCost':getWeaponCost(val)];
		debug(temp);
		return temp;
	});	
	// ENEMIES
	arrayIter(getEnemies(),function (entity){
		if (getType(entity)==ENTITY_LEEK){
			enemies[entity] = null;
		}
	});
	enemy['turnOrder'] = getEntityTurnOrder(enemy['id']);
	debug("Je joue en "+my['turnOrder']+" et l'ennemi en position "+enemy['turnOrder']);
	var arrayWeapons = getWeapons(enemy['id']);
	debug("Armes de l'adversaire : "+getWeapons(enemy['id']));
	arrayIter(arrayWeapons,identifyWeapons);
	setWeapon(my['weapons'][1]['name']);  // Attention : coûte 1 PT	
}
/* Reset weapons calculations*/
my['weapons'][1]['closestCell']=0;
my['weapons'][1]['mpsRequired']=35;
calculeDmgArme(1);
calculeDmgArme(2);
my['weapons'][2]['closestCell']=0;
my['weapons'][2]['mpsRequired']=35;
my['weapons'][2]['aoe']=[];
my['chips']=[CHIP_STALACTITE:[],CHIP_LIBERATION:[],CHIP_ICEBERG:['name':CHIP_ICEBERG,'aoe':[]]];
global combos;
/* Update bulbes en vie */
global bulbs;
bulbs = [];
arrayIter(getEnemies(),function (entity){
	if (getType(entity)==ENTITY_BULB){
		push(bulbs, entity);  
	}
});
/* Scan corporel : mes effets */
global effects, shieldNextTurn;


//debug("Bulbes ennemis : "+bulbs);
enemy['mps'] = getMP(enemy['id']);
enemy['cell'] = getCell(enemy['id']);
enemy['threats'] = [];
dmgEtincelle = estimationDommagesInfligeables(12);


var weapons = arrayMap(my['weapons'], function(key,val){
	if(val['name'] == getWeapon()){
		currentWeaponNumber = key;
	} else {
		otherWeaponNumber = key;
	}
	return val['name'] == getWeapon();
});
//debug("Current weapon is my number :"+currentWeaponNumber);
function identifyWeapons(cle,val){
	enemy['weapons'][val] = getWeaponName(val);	
}

function estimationDommagesInfligeables(dmg){
	var temp = dmg*(1+getStrength()/100)*(1-getRelativeShield(enemy['id'])/100) - getAbsoluteShield(enemy['id']);
	return (temp>0)?round(temp):0;
}

function calculeDmgArme(num){
		my['weapons'][num]['minDmg']=estimationDommagesInfligeables(my['weapons'][num]['rawMin']);
		my['weapons'][num]['maxDmg']=estimationDommagesInfligeables(my['weapons'][num]['rawMax']);	
}

/* Selection adversaire */
function selectionAdversaire(){
	var targetEnemy = [99]; //init
	var findBestMatch = function(key) {
		var dist = getPathLength(getCell(), getCell(key));
		var infos = ['id':key,'type':"bulb",'dist':dist,'life':getLife(key)];
		if (getType(key)==ENTITY_LEEK){	
			infos['type'] = "leek";
			if(infos['life']>0){
				// Si l'ennemi est plus pres
				if(dist!=null && dist<targetEnemy[0]){
					targetEnemy[0] = dist;
					targetEnemy[1] = key;
				}
			}
		}	
		return infos;
	};
	enemies = arrayMap(getEnemies(), findBestMatch);
	debug(enemies);
	enemy['id'] = targetEnemy[1];
	debug("Ennemi visé : "+getName(enemy['id']));
}
