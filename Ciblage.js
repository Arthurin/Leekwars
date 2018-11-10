include("GLOBALS");

function getOpponent(enemies) 
{
	var dangerousEnemies = [];
	var coeffAllies = [];
	var strength = -1;
	var heal = -1;
	var res = -1;
	var poison = -1;
	var science = -1;
	var agile = -1;
	var coeffDangereux = 0;
	var coeffAllie = 0;
	for (var enemy1 in enemies) 
	{
		strength = getStrength(enemy1);
		heal = getWisdom(enemy1);
		res = getResistance(enemy1);
		poison = getMagic(enemy1);
		science = getScience(enemy1);
		agile = getAgility(enemy1);
		coeffDangereux = science * 5 * getLevel(enemy1) / 100 + strength * 4 * getLevel(enemy1) / 100 + heal * 3 * getLevel(enemy1) / 100 + res * 2 * getLevel(enemy1) / 100 + poison * 4 * getLevel(enemy1) / 100 + agile * 2 * getLevel(enemy1) / 100;
		if (getCellDistance(getCell(), getCell(enemy1)) < 8) 
		{
			coeffDangereux *= 3;
		}
		if (isSummon(enemy1)) 
		{
			coeffDangereux *= 0.5;
		}
		dangerousEnemies[enemy1] = coeffDangereux;
		coeffDangereux = 0;
	}


	for (var allie in getAliveAllies()) 
	{
		strength = getStrength(allie);
		heal = getWisdom(allie);
		res = getResistance(allie);
		poison = getMagic(allie);
		science = getScience(allie);
		agile = getAgility(allie);
    if (isSummon(allie)) 
		{
      coeffAllie = strength * 5 * getLevel(allie) / 100 + heal * 4 * getLevel(allie) / 100 + res * 3 * getLevel(allie) / 100 + agile * 2 * getLevel(allie) / 100 + science * 2 * getLevel(allie);
			//coeffAllie *= 0.5;
		}
    else
    {
			coeffAllie = science * 5 * getLevel(allie) / 100 + strength * 4 * getLevel(allie) / 100 + heal * 3 * getLevel(allie) / 100 + res * 2 * getLevel(allie) / 100 + poison * 4 * getLevel(allie) / 100 + agile * 2 * getLevel(allie) / 100;
    }
    /*if (isSummon(allie)) 
		{
			coeffAllie *= 0.5;
		}*/
		coeffAllies[allie] = coeffAllie;
		coeffAllie = 0;
	}
	//TODO: center les résultats sur 1
	SCORE = [];
	getEchantillonCentre(SCORE, dangerousEnemies);
	getEchantillonCentre(SCORE, coeffAllies);
}


/**
 * @auteur : Caneton
 * recentre les coefficients "sur 1"
 *
 * J'ai pas encore tester... 
 * il faut au moins 2 elements dans le tableau 
 */
function getEchantillonCentre(@resultat, tab) {
debug("tab = "+tab);
	var moy = 0;
	var nb = count(tab);
	var ecartType;
	
    for (var x in tab) moy += x;
    moy /= nb;

    var somme2 = 0;
    for (var x in tab) somme2 += (x - moy) ** 2;
	
	if(nb>1) {
		var s2prim = somme2 / (nb - 1);
		ecartType = sqrt(s2prim);
	} else {
		ecartType = 0;
	}
    debug("ecart-type = " + ecartType);
	for(var cle : var valeur in tab) {
	if(ecartType==0) resultat[cle] = 1;
    else resultat[cle] = ((valeur - moy) / ecartType) + 1;
      if (resultat[cle] <= 0) 
      {
        debugW("coeff = " + resultat[cle]);
        resultat[cle] = 0.1;
      }
    }
}