//--------------------------------
//------- Deux armes -------------
// Niveau 69+ Devrait marcher à plus faible niveau
// TODO : Bug tour 7 : https://leekwars.com/fight/26931517
// TODO : spawn des bulbes, arrêter de "s'offrir sur un plateau" lorsqu'on est pas à range 
// TODO Améliorer calcul de tir avec lance grenade
// TODO: si l'ennemi n'est accessible par aucune case (closest cell devrait renvoyer null), changer de cible ! (bulbe, autre ennemi) 
//--------------------------------

include("_Fonctions");
//arrayIter(enemy['weapons'], identifyDangers);

/*TODO : La priorité c'est de se replier lorsque notre armure est en CD (surtout si je ne peux pas faire de dmg ce tour ci!). S'inspirer de : https://leekwars.com/fight/26909095

BUG https://leekwars.com/fight/26909210
*/



/********* ARME 1 : la plus forte **********/
/********* Si on peut tirer sans bouger **********/

/********* Time to do maths **********/
if(getTurn()==1){	
	useChip(CHIP_ARMORING, moi);
}
calculeOffensive();
debug(my['weapons']);
debug("Arme 1 : "+my['weapons'][1]['canUseThisTurn']+" ["+my['weapons'][1]['minDmg']+"-"+my['weapons'][1]['maxDmg']+"] ~ "+estimationdmg(1,0.66));
debug("Arme 2 : "+my['weapons'][2]['canUseThisTurn']+" ["+my['weapons'][2]['minDmg']+"-"+my['weapons'][2]['maxDmg']+"] ~ "+estimationdmg(2,0.66));


if(jePeuxAchever()){
	if (combos[1]>combos[2]){
		debug("COMBO N°1 Avec Stalactite");
		customMove(my['chips'][CHIP_STALACTITE]['closestCell']);
		useChip(CHIP_STALACTITE, enemy['id']);		
	}
	if(canUseWeapon(enemy['id'])){
		infligerDmg(currentWeaponNumber);	
	} else {
		calculeArme(currentWeaponNumber);
		customMove(my['weapons'][currentWeaponNumber]['closestCell']);
		infligerDmg(currentWeaponNumber);
	}
};

antiPoison();

if(tropdeProtection()){
	debug("Trop de protection !");
	if(my['chips'][CHIP_LIBERATION]['canUseChip']){
		debug("LIBERATIONNNNN absolu:"+getAbsoluteShield(enemy['id'])+" relatif:"+getRelativeShield(enemy['id']));		
		customMove(my['chips'][CHIP_LIBERATION]['closestCell']);
		useChip(CHIP_LIBERATION, enemy['id']);
		calculeOffensive();
		debug("Arme 1 après reduction : "+my['weapons'][1]['canUseThisTurn']+" ["+my['weapons'][1]['minDmg']+"-"+my['weapons'][1]['maxDmg']+"] ~ "+estimationdmg(1,0.66));
	}	
	useChip(CHIP_STALACTITE, enemy['id']);	
}
if (getLife()<250){
	debug("Je vais bientôt crever, c'est la merdasse.");
	etrePrudent(true);
	// TODO : SI on arrive pas à se heal regarder si on peut semer l'adversaire sans même faire la partie offensive
	if(enemy['sorcier']){
		useChip(CHIP_REGENERATION,moi);
		if(getLife() < getTotalLife() - montantDuSoin(CHIP_CURE)*0.7){
			useChip(CHIP_CURE,moi);
		}		
	} else if(jePeuxChiper(CHIP_REGENERATION)){
		useChip(CHIP_REGENERATION,moi);
		if(shouldUseProtection()){
			useChip(CHIP_SHIELD,moi);
			useChip(CHIP_HELMET,moi);
		} else if(montantDuSoin(CHIP_CURE)<=getTotalLife()-getLife()){
			useChip(CHIP_CURE,moi);
		}
	} else {
		// Pas opti
		useChip(CHIP_CURE,moi);
		useChip(CHIP_VACCINE,moi);
		useChip(CHIP_SHIELD,moi);
		useChip(CHIP_HELMET,moi);
	}
}

if(shouldUseProtection()){	
	if (getLife()<250){
		debug("Je vais bientôt crever et je dois me protéger, c'est la merdasse.");
		etrePrudent(true);	
		useChip(CHIP_CURE,moi);
		useChip(CHIP_ARMOR,moi);
		useChip(CHIP_VACCINE,moi);
		useChip(CHIP_SHIELD,moi);
		useChip(CHIP_HELMET,moi);
	}
	if(jeVaisPouvoirTirer()){
	// Si on peut tirer on essaye de garder 6tps donc on utilise une seule puce
		// Si ça vaut le coup de tirer on s'équipe qu'au minimum
		
		if(!tropdeProtection()){				
			 if (modePrudent()){
				if(jePeuxChiper(CHIP_ARMOR)){
					useChip(CHIP_ARMOR,moi);
				} else if(jePeuxChiper(CHIP_SHIELD)){
					useChip(CHIP_SHIELD,moi);				
				} else if(getAbsoluteShield()<50 && jePeuxChiper(CHIP_HELMET)){
					useChip(CHIP_HELMET,moi);
				}else if (getLife()<getTotalLife()-2*montantDuSoin(CHIP_VACCINE) && getLife()>250){//todo éviter le vaccin si on se fait dégommer au prochain tour
					debug("Aucune puce protection disponible et pas full life, je me vaccine !");
					useChip(CHIP_VACCINE,moi);
				}
			}			
		}else {
			debug("Je me blinde! (trop de protection)");
			useChip(CHIP_ARMOR,moi);
			if(getLife()<400){
				debug("Low hp on se heal !");
				useChip(CHIP_CURE,moi);
			}
			useChip(CHIP_SHIELD,moi);
			useChip(CHIP_VACCINE,moi);
			useChip(CHIP_ARMORING, moi);
			useChip(CHIP_HELMET,moi);
		}
	} else {
	// Sinon on se blinde !
		debug("Je me blinde! (no range)");		
		useChip(CHIP_ARMORING, moi);		
		useChip(CHIP_ARMOR, moi);
		if(getLife()<400){
			debug("Low hp on se heal !");
			useChip(CHIP_CURE,moi);
		}
		useChip(CHIP_SHIELD,moi);
		useChip(CHIP_HELMET,moi);
		useChip(CHIP_VACCINE,moi);
	}
}


/** CHAAAAAARGEZZZZ **/
offensive();

if(getLife()< getTotalLife()){
	debug("Fin du tour on se heal !");
	useChip(CHIP_CURE,moi);
}
if(getLife() < getTotalLife()-montantDuSoin(CHIP_REGENERATION)*0.8){
	useChip(CHIP_VACCINE,moi);
}
if (!enemy['sorcier']){
	useChip(CHIP_ARMOR, moi);
	useChip(CHIP_SHIELD,moi);
	useChip(CHIP_HELMET,moi);
}
useChip(CHIP_ARMORING, moi);

if(getTurn()>1){
	useChip(CHIP_VACCINE,moi);
}


yoloOuPasYolo();

/***************************************/

//Si l'ennemi est blindé armure attendre qu'il soit en CD


// TODO se replier à la fin du combat
// Prérequis? MP>MPAdversaire ? identifier qui chasse qui (en fonction des armes et des chips)?
debug("******* Fin du tour "+getTurn()+"*******");
debug("Protection absolue au prochain tour : "+protectionAbsolueProchainTour());
debug("Nombre d'opérations effectuées: " +getOperations());
