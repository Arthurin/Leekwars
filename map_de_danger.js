// dernière mise à jour le : 8/03/2018 par : LeekWizard

include("Deplacement");
//===============================
// getDangerMap : renvoie un tableau associatif de la forme [cell_accessible : danger]
// A ameliorer pour le comportement d'equipe ( rajouter un parametre distance par rapport au centre de gravité... )
//===============================
function getDangerMap(cells_accessibles) {
	var leek = getLeek();
	var myRC = cells_accessibles;
	var enemyRC;
	var tab_scores = [];
	var tab_danger = [];
	var toutennemis = [];
	var coeff_dangerosite = [];
	for (var enemy1 in getAliveEnemies()) {  // on enleve les bulbes guerrisseurs et metalliques des ennemis dangereux ( gain d'operations inutiles )
		if (isSummon(enemy1) and getStrength(enemy1) > 200) {
			push(toutennemis, enemy1);
		}
		if (isSummon(enemy1) == false) {
			push(toutennemis, enemy1);
		}
	}
	for (var enemy1 in toutennemis) {	// On définit un coefficient de dangerosité à chaque ennemi. A affiner eventuellement ( avec Ciblage ? )
		if (getName(enemy1) == 'lightning_bulb') {coeff_dangerosite[enemy1] = 0.5;}
		if (getName(enemy1) == 'fire_bulb') {coeff_dangerosite[enemy1] = 0.5;}
		if (getName(enemy1) == 'iced_bulb') {coeff_dangerosite[enemy1] = 0.4;}
		if (getName(enemy1) == 'rocky_bulb') {coeff_dangerosite[enemy1] = 0.3;}
		if(isSummon(enemy1) == false){
			coeff_dangerosite[enemy1] = (getStrength(enemy1)/400)+(getMagic(enemy1)/400)+(getScience(enemy1)/450);
		}
	}

	for (var enemy1 in toutennemis) {	//Pour chaque ennemi...
		enemyRC = getReachableCells(getCell(enemy1), getMP(enemy1));
		for (var cell1 in myRC) {	//Pour chaqune de mes cellules accessibles...
			for (var cell2 in enemyRC) {	//Pour chaqune des cellules accessibles de l'ennemi "enemy"...
				if (tab_scores[cell1] == null) {
					tab_scores[cell1] = 0;
				}
				if (lineOfSight(cell1, cell2) == true) {	// Si il y a une ligne de vue, 
					tab_scores[cell1] = tab_scores[cell1] + coeff_dangerosite[enemy1];
				}
			}
		}
	}
	for (var cell: var danger in tab_scores) {
		if (inArray(myRC, cell)) {
			tab_danger[cell] = danger;
		}
	}
	return tab_danger;
}

// 

//===============================
// getReachableCells : renvoie les cellules accessible de la cell cell_centre avec PM pm. Renvoi un tableau non associatif.
//===============================
function getReachableCells(cellule, mp){
	var cellules_accessibles = accessible(cellule, mp);
	var cellules_accessibles_2 = [];
	for (var cell:var dist in cellules_accessibles){
		push(cellules_accessibles_2, cell);
	}
  return cellules_accessibles_2;
}

/*
function getSaferCell(){	// Renvoie la cell une des cells les plus sures
  var map_danger = getDangerMap(getReachableCells(getCell(), getMP()));
	var array_values = [];
	for(var key : var value in map_danger){
		push(array_values, value);
	}
  var danger_min = arrayMin(array_values);
  for(var cell : var danger in map_danger){
    if (map_danger[cell] == danger_min){ return cell; }
  }
		return getCenterOfGravity(getAliveAllies());   // Si ca ne marche pas ( mais il n'y a pas de raisons...)
}
*/


function getSaferCell() {	
	var map_danger = getDangerMap(getReachableCells(getCell(), getMP()));
	var min = null;
	var cell;
	for(var key : var value in map_danger) {
		if(min === null || min > value) {
			min = value;
			cell = key;
		}
	}
	return cell;
}


//===============================
// debugArrayMap : fonction de debug permettant de verifier la validité de la map de danger. Reconseillé pour les debugs de la fonction getDangerMap.
// Utiliser ainsi : debugArrayMap(getDangerMap(getReachableCells(getCell(), getMP())));
//===============================
function debugArrayMap(array_associatif) {
	var color;
	var rouge = 0;
	var vert = 0;
	var bleu = 200;
	var tab_cells = [];
	var tab_scores = [];
	for (var cell:var coeff in array_associatif){
		push(tab_cells, cell);
		push(tab_scores, coeff);
	}
	var score_max = arrayMax(tab_scores);
	var score_min = arrayMin(tab_scores);
	for (var i = 0; i <= count(tab_scores); i++) {
		if(score_max===0){
			vert = 255; // la voie est libre
			rouge = 0;
			bleu = 0;
		} else {
			vert = (tab_scores[i] == score_min)?100:0; 
			rouge = (tab_scores[i] * 255) / score_max;
			bleu = (score_max - (tab_scores[i] * 255)) / score_max;
		}
		mark(tab_cells[i], getColor(rouge, vert, bleu));
	}
}






