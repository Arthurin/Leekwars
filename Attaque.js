include("GLOBALS");
include("getArea");
include("getCellToUse");

function getTarget(tool, cell) {
	return  (isChip(tool)) ? getChipTargets(tool, cell) : getWeaponTargets(tool, cell);
}


/**
 *	@auteur : Caneton
 * AttaqueTypeAOE => remplit un tableau permettant la "meilleur" action pour une arme de type AOE
 *	Paramètres :
 *			- toutEnnemis : tableau comportant les leeks sur lesquels on autorise à tirer
 *			- tool : arme ou puce d'attaque ( de préférance de type AOE)
 *			- cellsAccessible : tableau associatif des cases accessibles avec leur distance
 * Retour : tableau regroupant les informations permettant de faire une attaque : [CaseOùilFautSeDéplacer, CaseOùIlFautTirer, ValeurAssociée]
 *							(la valeur prends en compte les dégats que l'on inflige à l'ennemis, le retour de dégat et le vol de vie)
 *
 **/
function attaqueTypeAOE(toutEnnemis, tool, @cellsAccessible) {
	var oper = getOperations();
	var bestAction = [];
	var distanceBestAction = 0;
	var cell_deplace;
	var valeurMax = 0;
	var maxRange = (isChip(tool)) ? getChipMaxRange(tool) : getWeaponMaxRange(tool);
	var deja_fait = [];
	for (var ennemis in toutEnnemis) {
		var distance = getDistance(getCell(), getCell(ennemis));
		if (distance <= maxRange + getMP()) { // Ne permet pas de tirer au delà de maxRange alors que l'AOE pourrait toucher un ennemi sans être à range 
			var zone = getEffectiveArea(tool, getCell(ennemis));
			if (zone != null) {
				for (var cell in zone) {
					if (!deja_fait[cell]) {
						deja_fait[cell] = true;
						cell_deplace = getCellToUseToolsOnCell(tool, cell, cellsAccessible);
						var sommeDegat = 0;
						var sommeRenvoi = 0;
						var sommeVolVie = 0;
						var degat, degat_renvoyer, volDeVie;
						if (cell_deplace != -2) {
							var cibles = getTarget(tool, cell);
							if (cibles != []) {
								for (var leek in cibles) {
									if (leek != getLeek()) {
										pvLost(INFO_LEEKS[ME], INFO_LEEKS[leek], tool, cell, degat, degat_renvoyer, volDeVie);
										var team = (isAlly(leek)) ? -1 : 1;
										sommeDegat += team * SCORE[leek] * degat[MOYEN];
										sommeVolVie += volDeVie;
										sommeRenvoi += degat_renvoyer;
									}
								}
							}
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
				}
			}
		}
	}
	if (isChip(tool)) debug(getChipName(tool) + " : " + bestAction + " => " + ((getOperations() - oper) / OPERATIONS_LIMIT * 100) + "%");
	else debug(getWeaponName(tool) + " : " + bestAction + " => " + ((getOperations() - oper) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}

/**
 * @auteur : Caneton
 * Proccédure pvLost => Calcule le nombre de PV infligé pour une attaque (avec le renvoit de dégat et le vol de vie)
 *	TODO: - généraliser pour le poison
 *				- faire les tests (j'en ai fait aucun pour l'instant) pour arme classique, AOE, frappe du démon, burning,...
 *
 *	paramètre :
 *							- tireur et cible => tableau de la forme : [Leek, AbsoluteShield, RelativeShield, force, RenvoiDegat]
 *							- arme_chip => l'arme ou la chip utilisée
 *	 						- cellVisee => la cellule cible (peut-être mis à null si ce n'est pas pour calculer les AOE)
 *			/!\ paramètres passés par adresse(@) => la valeur est initialisée avant l'appel de la fonction puis modifié dans la fonction !
 *							- degat : tableau contenant les degats minimum et moyen : [degatMin, degatMoyen]
 *							- degat_renvoyer : valeur des renvois de dégat
 *							- volDeVie : valeur du vol de vie
 *
 **/
function pvLost(tireur, cible, arme_chip, cellVisee, @degat, @degat_renvoyer, @volDeVie) {
	/*	Tireur et cible sont des tableaux de la forme :*/
	var Leek = 0;
	var AbsoluteShield = 1;
	var RelativeShield = 2;
	var Strenght = 3;
	var RenvoiDegat = 4;
	var Magie = 5;//new
	/*								*/

	degat = [0, 0];
	degat_renvoyer = 0;
	volDeVie = 0;


	var aoe;
	var effect = (isChip(arme_chip)) ? getChipEffects(arme_chip) : getWeaponEffects(arme_chip);
	var area = (isChip(arme_chip)) ? getChipArea(arme_chip) : getWeaponArea(arme_chip);
	var degatMoyen = 0;
	var degatMin = 0;

	if (area == AREA_POINT || area == AREA_LASER_LINE || cellVisee === null) {
		aoe = 1;
	} else {
		var coeff;
		if (area == AREA_CIRCLE_1) {
			coeff = 1;
		}
		if (area == AREA_CIRCLE_2) {
			coeff = 2;
		}
		if (area == AREA_CIRCLE_3) {
			coeff = 3;
		}
		var distance = getCellDistance(cellVisee, getCell(cible[Leek]));
		aoe = 1 - (distance / (2 * coeff));
	}

	if (aoe < 0.5) {
		aoe = 0;
		debugE("pvLost : la case visée se trouve hors de l'aoe !");
	}

	for (var i in effect) {
		if (i[0] == EFFECT_DAMAGE) {
			degatMoyen = (i[1] + i[2]) / 2;
			degatMin = i[1];
			var degatBrutMoyen = aoe * degatMoyen * (1 + tireur[Strenght] / 100);
			var degatBrutMin = aoe * degatMin * (1 + tireur[Strenght] / 100);
			var degatTmp = [0, 0];
			degatTmp[MOYEN] = max(degatBrutMoyen * (1 - cible[RelativeShield] / 100) - cible[AbsoluteShield], 0);
			degatTmp[MIN] = max(degatBrutMin * (1 - cible[RelativeShield] / 100) - cible[AbsoluteShield], 0);

			degat[MOYEN] = degat[MOYEN] + degatTmp[MOYEN];
			degat[MIN] = degat[MIN] + degatTmp[MIN];
			degat_renvoyer = degat_renvoyer + cible[RenvoiDegat] * degatTmp[MOYEN] / 100;
			volDeVie = volDeVie + getWisdom(tireur[Leek]) * degatTmp[MOYEN] / 1000;
		}
		if(i[0] == EFFECT_POISON) {
			degatMoyen = (i[1] + i[2]) / 2;
			degatMin = i[1];
			var degatBrutMoyen = aoe * degatMoyen * (1 + tireur[Magie] / 100);
			var degatBrutMin = aoe * degatMin * (1 + tireur[Magie] / 100);
			var nb_tour = i[3];
			degat[MOYEN] = degat[MOYEN] + sqrt(nb_tour) * degatBrutMoyen; //petit bonus pour le effets qui dure plus long temps(a adapter si besoin)
			degat[MIN] = degat[MIN] + degatBrutMin[MIN];
		}
    
    if(i[0] == EFFECT_SHACKLE_TP) {
			degatMoyen = (i[1] + i[2]) / 2;
			degatMin = i[1];
			var degatBrutMoyen = aoe * degatMoyen * (1 + tireur[Magie] / 100);
			var degatBrutMin = aoe * degatMin * (1 + tireur[Magie] / 100);
			var nb_tour = i[3];
			degat[MOYEN] = degat[MOYEN] + sqrt(nb_tour) * degatBrutMoyen * 40; //petit bonus pour le effets qui dure plus long temps(a adapter si besoin)
			degat[MIN] = degat[MIN] + degatBrutMin[MIN];
		}
    
    if(i[0] == EFFECT_SHACKLE_MP) {
			degatMoyen = (i[1] + i[2]) / 2;
			degatMin = i[1];
			var degatBrutMoyen = aoe * degatMoyen * (1 + tireur[Magie] / 100);
			var degatBrutMin = aoe * degatMin * (1 + tireur[Magie] / 100);
			var nb_tour = i[3];
			degat[MOYEN] = degat[MOYEN] + sqrt(nb_tour) * degatBrutMoyen * 35; //petit bonus pour le effets qui dure plus long temps(a adapter si besoin)
			degat[MIN] = degat[MIN] + degatBrutMin[MIN];
		}
    
    if(i[0] == EFFECT_SHACKLE_STRENGTH) {
			degatMoyen = (i[1] + i[2]) / 2;
			degatMin = i[1];
			var degatBrutMoyen = aoe * degatMoyen * (1 + tireur[Magie] / 100);
			var degatBrutMin = aoe * degatMin * (1 + tireur[Magie] / 100);
			var nb_tour = i[3];
			degat[MOYEN] = degat[MOYEN] + sqrt(nb_tour) * degatBrutMoyen; //petit bonus pour le effets qui dure plus long temps(a adapter si besoin)
			degat[MIN] = degat[MIN] + degatBrutMin[MIN];
		}
    
    if(i[0] == EFFECT_SHACKLE_MAGIC) {
			degatMoyen = (i[1] + i[2]) / 2;
			degatMin = i[1];
			var degatBrutMoyen = aoe * degatMoyen * (1 + tireur[Magie] / 100);
			var degatBrutMin = aoe * degatMin * (1 + tireur[Magie] / 100);
			var nb_tour = i[3];
			degat[MOYEN] = degat[MOYEN] + sqrt(nb_tour) * degatBrutMoyen; //petit bonus pour le effets qui dure plus long temps(a adapter si besoin)
			degat[MIN] = degat[MIN] + degatBrutMin[MIN];
		}
    
    if(i[0] == EFFECT_KILL) {
			var bulbe = cible[Leek];
			if(isAlly(bulbe)) {
				degat[MOYEN] = getLife(bulbe);
				degat[MIN] = getLife(bulbe);
				volDeVie = 0;// pas de vol de vie si on tue le bulbe
				degat_renvoyer = cible[RenvoiDegat] * degat[MOYEN] / 100; // ???
				break;
			}
		}    
	}
}