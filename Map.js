function cellAccessibles(leek){
    var pos = getCell(leek);
    var mp = getMP(leek);
    var cell_accessibles = [];

    for(var i=0;i<613; i++){
        if(getCellContent(i) == CELL_EMPTY and getCellDistance(pos, i) <= mp){
            var d = getPathLength(pos, i);
            if(d > 0 && d <= mp){
                push(cell_accessibles, i);
            }
        }
    }

    return cell_accessibles;
}
function getCacheCacheCells(myCell, enemy) { // récupère toutes les cells où je peux me déplacer sans ligne de vue avec celles où peux se déplacer l'adversaire
    var my_move_cells = cellAccessibles(myCell);
    var enemy_move_cells = cellAccessibles(enemy);
    var is_safe_cell;
    var safe_cells = [];
    var index, indexx;

    index = count(my_move_cells);
    indexx = count(enemy_move_cells);
    for (var i = 0; i < index; i++) {
        is_safe_cell = true;
        for (var j = 0; j < indexx; j++) {
            if (lineOfSight(enemy_move_cells[j], my_move_cells[i])) {
                is_safe_cell = false;
            }
        }

        if (is_safe_cell) push(safe_cells, my_move_cells[i]);
    }

    return safe_cells;
}