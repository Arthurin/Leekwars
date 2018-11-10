// dernière mise à jour le : 31/03/2018 par : Marmotte


/********************** Globals *********************************/
global CACHER;
global ME = getLeek();
global PHRASE_A_DIRE = [];
global INFO_LEEKS = [];
global COMBO = [];

INFO_LEEKS = (function() {//TODO : mettre d'autres caractéristiques avec des constantes associées
	var tab = [];
		var leeks = getAliveAllies()+ getAliveEnemies();
		for (var leek in leeks) {
			tab[leek] = [leek, getAbsoluteShield(leek), getRelativeShield(leek),  max(0,getStrength(leek)), getDamageReturn(leek), getMagic(leek)];
    }
		return tab;
})();

  
global SCORE; //TODO: faire une fonction plus précise  <= ok fait par ray dans le ciblage 
SCORE = (function () {
		var tab = [];
		var leeks = getAliveAllies() + getAliveEnemies();
		for (var leek in leeks) {
			tab[leek] = (isSummon(leek)) ? 0.5 : 1;
		}
		return tab;
})();


global SCORE_HEAL; //TODO: faire une fonction plus précise
SCORE_HEAL = (function () {
		var tab = [];
		var leeks = getAliveAllies() + getAliveEnemies();
		for (var leek in leeks) {
			tab[leek] = (isSummon(leek)) ? 0.5 : 1;
		}
		return tab;
})();


global SCORE_TACTIC;
SCORE_TACTIC = (function() {
  var tab = [];
  var leeks = getAliveAllies() + getAliveEnemies();
  for(var leek in leeks)
  {
    tab[leek] = (isSummon(leek)) ? 0.5 : 1;
  }
  return tab;
})();


function compteurPuceEffect(tools, effect) {
  var compteur = 0;
  for(var tool in tools) {
    var eff = isChip(tool) ? getChipEffects(tool)[0][TYPE] : getWeaponEffects(tool)[0][TYPE];
    if(tool==WEAPON_B_LASER) eff=EFFECT_HEAL;
    if(eff==effect) {
      compteur++;
    }
  }
  return compteur;
}

function setBoostCoeff() { // Méthode du nombre de puce
  var boost = [];
  for (var allie in getAliveAllies()) {
    var tools = getChips(allie)+getWeapons(allie);
    var nbDamageTool = compteurPuceEffect(tools, EFFECT_DAMAGE);
		var nbHealTool = compteurPuceEffect(tools, EFFECT_HEAL);
    var nbResiTool = compteurPuceEffect(tools, EFFECT_ABSOLUTE_SHIELD)+compteurPuceEffect(tools, EFFECT_RELATIVE_SHIELD); 
    var nbReturnDamageTool = compteurPuceEffect(tools, EFFECT_DAMAGE_RETURN); 
    var nbScienceTool = compteurPuceEffect(tools, EFFECT_BUFF_STRENGTH)
    									+ compteurPuceEffect(tools, EFFECT_BUFF_WISDOM)
    									+ compteurPuceEffect(tools, EFFECT_BUFF_RESISTANCE)
    									+ compteurPuceEffect(tools, EFFECT_BUFF_AGILITY)
    									+	compteurPuceEffect(tools, EFFECT_BUFF_TP)
    									+	compteurPuceEffect(tools, EFFECT_BUFF_MP); 
    
    boost[allie] = [];
    boost[allie][EFFECT_BUFF_STRENGTH] = sqrt(nbDamageTool);
    boost[allie][EFFECT_BUFF_WISDOM] = sqrt(nbHealTool);
    boost[allie][EFFECT_BUFF_RESISTANCE] = sqrt(nbResiTool);
    boost[allie][EFFECT_BUFF_AGILITY] = 1 + sqrt(nbReturnDamageTool) + sqrt(nbScienceTool); 
    boost[allie][EFFECT_BUFF_TP] = 1.7;
    boost[allie][EFFECT_BUFF_MP] = 1.7; 

    
  	if(isSummon(allie)) {
      for (var cle : var val in boost[allie]) { 
        boost[allie][cle] *= 0.7;
      }
    }
    
  }
  SCORE_BOOST = boost;
}


global SCORE_BOOST;
SCORE_BOOST = (function () 
{
	var tab = [];
	var leeks = getAliveAllies();
	for(var leek in leeks) 
	{
		tab[leek] =(isSummon(leek)) ? 0.5 : 1;
	}
	return tab;
})();


global SCORE_RESISTANCE;
SCORE_RESISTANCE = (function () 
{
	var tab = [];
	var leeks = getAliveAllies();
	for(var leek in leeks) 
	{
		tab[leek] =(isSummon(leek)) ? 0.5 : 1;
	}
	return tab;
})();


//informations concernant une action
global CELL_DEPLACE=0, CELL_VISE=1, VALEUR=2, CHIP_WEAPON=3, NB_TIR=4, PT_USE=5, EFFECT=6, CALLBACK = 7, PARAM = 8;

global NE_laser = 0;
global SO_laser = 1;
global NO_laser = 2;
global SE_laser = 3;

//getEffects: [type, value, caster_id, turns, critical, item_id, target_id]
global TYPE = 0, VALUE = 1, CASTER_ID = 2, TURNS = 3, CRITICAL = 4, ITEM_ID = 5, TARGET_ID = 6;
//getWeaponEffects:[type, min, max, turns, targets]
global  MIN = 1, MAX = 2, TARGETS = 4;

global MOYEN = 3;

global MIN_RANGE = (function () {
	var min_range = [];
	for (var i=1; i<111; i++) {
		min_range[i] = (isChip(i)) ? getChipMinRange(i) : getWeaponMinRange(i);
	}
	min_range[CHIP_TOXIN] = 2;
	min_range[WEAPON_GAZOR] = 4;//ou 3, à vérifier
  min_range[CHIP_PLAGUE] = 4;
	return @min_range;
})();

global MINIMUM_TO_USE = (function(){
	var tab = [];
	tab[CHIP_REGENERATION] = 1 * (1 + getWisdom()/100) * getChipEffects(CHIP_REGENERATION)[0][MIN];
	
	//TODO: rajouter
	
	return tab;
})();
	
global NOT_USE_ON;
NOT_USE_ON = (function() {
	var tab = [];
	tab[CHIP_REGENERATION] = [];
	for(var leek in getAliveAllies()+getAliveEnemies()) {
		if(isSummon(leek)) {
			tab[CHIP_REGENERATION][leek] = true;
		}
	}
	return tab;
})();

global TOUR = 0; TOUR ++; // getTurn()
/******************************************************************/