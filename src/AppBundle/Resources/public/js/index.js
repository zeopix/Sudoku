loadjs = function() {
    Sudoku = {
        SIZE: 9,
        MODE: 'fill'
    };

    (function($) {
        var getKeys = function(array) {
            var keys = [];
            for (var key in array) {
                keys.push(key);
            }
            return keys;
        };

        var processDependent = function(matrix, row, col, func) {
            for (var r = 0; r < $.SIZE; ++r) {
                if (r != row) {
                    func(r, col);
                }
            }
            for (var c = 0; c < $.SIZE; ++c) {
                if (c != col) {
                    func(row, c);
                }
            }
            var startRow = row - (row % 3);
            var startCol = col - (col % 3);
            for (var r = startRow; r < startRow + 3; ++r) {
                for (var c = startCol; c < startCol + 3; ++c) {
                    if (r != row && c != col) {
                        func(r, c);
                    }
                }
            }
        };

        var collectConstraints = function(matrix, row, col) {
            var constraints = [];
            processDependent(matrix, row, col, function(r, c) {
                if (typeof(matrix[r][c]) != 'undefined') {
                    constraints[matrix[r][c]] = true;
                }
            });
            return constraints;
        };

        var getAllowed = function(matrix, row, col) {
            var constraints = collectConstraints(matrix, row, col);
            var allowed = [];
            for (var num = 1; num <= $.SIZE; ++num) {
                if (typeof(constraints[num]) == 'undefined') {
                    allowed[num] = true;
                }
            }
            return allowed;
        };

        var generateGuesses = function(matrix) {
            var guesses = [];
            for (var row = 0; row < $.SIZE; ++row) {
                for (var col = 0; col < $.SIZE; ++col) {
                    if (typeof(matrix[row][col]) == 'undefined') {
                        if (typeof(guesses[row]) == 'undefined') {
                            guesses[row] = [];
                        }
                        guesses[row][col] = getAllowed(matrix, row, col);
                    }
                }
            }
            return guesses;
        };

        var processGuesses = function(matrix, guesses) {
            var processed;
            do {
                processed = false;
                for (var rowKey in guesses) {
                    for (var colKey in guesses[rowKey]) {
                        var cellGuesses = guesses[rowKey][colKey];
                        var keys = getKeys(cellGuesses);
                        if (keys.length == 1) {
                            var num = keys.pop();
                            processDependent(matrix, rowKey, colKey, function(r, c) {
                                if (typeof(guesses[r][c]) != 'undefined') {
                                    delete guesses[r][c][num];
                                }
                            });
                            processed = true;
                            matrix[rowKey][colKey] = num;
                            delete guesses[rowKey][colKey];
                        }
                    }
                }
            } while (processed);
        };

        $.core = {
            solve: function(matrix) {
                var guesses = generateGuesses(matrix);
                processGuesses(matrix, guesses);
                return matrix;
            }
        };
    })(Sudoku);

    (function($) {
        var ID = "sudoku-desk";

        var addStyles = function(id) {
            var style = document.createElement('style');
            style.type = 'text/css';
            style.innerHTML = '#' + id + ' { border-collapse: collapse; }\n' + '#' + id + ' td { border: 1px solid #666; padding: 0; }\n' + '#' + id + ' td > div { border-width: 2px; border-style: solid; padding: 12px; width: 12px; height: 12px; text-align: center; font-weight: bold; font-family: Tahoma, sans-serif; font-size: 12px; }\n' + '#' + id + ' td.r div { border-color: #fff; }\n' + '#' + id + ' td.s div { border-color: blue; }\n' + '#' + id + ' td:nth-child(-3n+6) { border-right: 2px solid #222; }\n' + '#' + id + ' tr:nth-child(-3n+6) td { border-bottom: 2px solid #222; }\n';
            document.getElementsByTagName('head')[0].appendChild(style);
        };

        var getNumber = function(val) {
            var num = 0;
            if (typeof(val) == 'string') {
                num = parseInt(val);
            } else if (typeof(val) == 'number') {
                num = val;
            }
            if (!isNaN(num) && num > 0 && num < 10) {
                return num;
            }
            return;
        };

        function Desk(id) {
            this.id = id || ID;
            this.map = [];
            this.annotations = [];
            for (i=0; i < $.SIZE; ++i) {
                this.annotations[i] = [];
                for (j=0; j < $.SIZE; ++j) {
                    this.annotations[i][j] = [];
                }
            }
        }

        Desk.prototype._getCell = function(row, col) {
            return this.table.rows[row].cells[col];
        };

        Desk.prototype.highlightNum = function(num) {
            for (var row = 0; row < $.SIZE; ++row) {
                for (var col = 0; col < $.SIZE; ++col) {
                    this._unhighlightCell(row, col);
                    if (typeof(num) != 'undefined' && parseInt(num) == parseInt(this._getCell(row, col).firstChild.textContent)) {
                        this._highlightCell(row, col);
                    } else if (typeof(num) != 'undefined' && typeof(this.annotations[row][col][num]) != 'undefined' && this.annotations[row][col][num] == true) {
                        this._highlightCell(row, col, 'soft');
                    }
                }
            }
        }

        Desk.prototype._highlightCell = function(row, col, optionalClass) {
            this._getCell(row, col).firstChild.style.border = '1px solid green';
            this._getCell(row, col).firstChild.style.backgroundColor = 'green';
            if (typeof(optionalClass) != 'undefined') {
                this._getCell(row, col).firstChild.style.backgroundColor = 'yellow';
            }
        };

        Desk.prototype._unhighlightCell = function(row, col) {
            this._getCell(row, col).firstChild.style.border = '1px solid #AAA';
            this._getCell(row, col).firstChild.style.backgroundColor = 'white';
        };

        Desk.prototype.select = function(row, col) {
            if (this.selected) {
                this.selected.className = "r";
            }
            this.selected = this._getCell(row, col);
            this.selected.className = "s";
            this.highlightNum(this.selected.textContent);
        };

        Desk.prototype._annotateCell = function(row, col, num) {
            if (((typeof(this.annotations[row][col][num]) == 'undefined') || this.annotations[row][col][num] == false)) {
                this.annotations[row][col][num] = true;
            } else {
                this.annotations[row][col][num] = false;
            }

            //draw cell

            console.log('Setting '+num+' into row '+row+' col'+col);
            console.log(this.annotations);
            this._getCell(row, col).children[1].textContent =  ' ';
            for (i=0; i <= $.SIZE; ++i) {
                if (this.annotations[row][col][i] == true) {
                    var current = this._getCell(row, col).children[1].textContent;
                    this._getCell(row, col).children[1].textContent = current + ' ' + i;

                }
            }
        }

        Desk.prototype.set = function(row, col, num, color) {
            if (Sudoku.MODE == 'fill') {
                cell = this._getCell(row, col).firstChild;
                cell.style.color = color;
                cell.textContent = new String(num);
                if (typeof(color) != 'undefined') {
                    cell.style.color = color;
                }
            } else {
                this._annotateCell(row, col, num);
            }
        }

        Desk.prototype.clear = function(row, col) {
            this._getCell(row, col).firstChild.textContent = '';
        };

        Desk.prototype.get = function(row, col) {
            return getNumber(this._getCell(row, col).firstChild.textContent);
        };

        Desk.prototype.draw = function(parent) {
            addStyles(this.id);

            this.table = document.createElement("table");
            this.table.id = this.id;
            var self = this;
            for (var row = 0; row < $.SIZE; ++row) {
                var tableRow = this.table.insertRow(row);
                for (var col = 0; col < $.SIZE; ++col) {
                    var tableCell = tableRow.insertCell(col);
                    tableCell.className = "r";
                    tableCell.appendChild(document.createElement("div"));
                    tableCell.children[0].className = 'fill';
                    tableCell.appendChild(document.createElement("div"));
                    tableCell.children[1].className = 'annotation';
                    tableCell.onclick = (function(row, col) {
                        return function() {
                            self.select(row, col);
                        };
                    })(row, col);
                }
            }
            parent.appendChild(this.table);

            document.onkeydown = function(event) {
                var keyCode = window.event ? window.event.keyCode : event.keyCode;
                var col = self.selected.cellIndex;
                var row = self.selected.parentNode.rowIndex;
                console.log('keycode: '+keyCode);
                switch (keyCode) {
                    case 37:
                        // left
                        if (col > 0) {
                            self.select(row, col - 1);
                        }
                        break;
                    case 38:
                        // top
                        if (row > 0) {
                            self.select(row - 1, col);
                        }
                        break;
                    case 39:
                        // right
                        if (col < $.SIZE - 1) {
                            self.select(row, col + 1);
                        }
                        break;
                    case 40:
                        // bottom
                        if (row < $.SIZE - 1) {
                            self.select(row + 1, col);
                        }
                        break;
                    case 8:
                    case 46:
                        // delete
                        self.clear(row, col);
                        event.preventDefault();
                        break;
                    default:
                        var keyChar = String.fromCharCode(keyCode);
                        var num = parseInt(keyChar);
                        if (!isNaN(num) && num > 0 && num < 10) {
                            if(! (typeof(self.map[row][col]) != 'undefined' && self.map[row][col] > 0)) {
                                self.set(row, col, keyChar, 'red');
                            }
                        }
                }
            };
            this.select(0, 0);
        };

        Desk.prototype.toArray = function() {
            var matrix = [];
            for (var row = 0; row < $.SIZE; ++row) {
                for (var col = 0; col < $.SIZE; ++col) {
                    if (typeof(matrix[row]) == 'undefined') {
                        matrix[row] = [];
                    }
                    matrix[row][col] = this.get(row, col);
                }
            }
            return matrix;
        };

        Desk.prototype.fill = function(matrix) {
            this.map = matrix;
            for (var row = 0; row < $.SIZE; ++row) {
                for (var col = 0; col < $.SIZE; ++col) {
                    if (typeof(matrix[row][col]) != 'undefined' && matrix[row][col] > 0) {
                        this.set(row, col, matrix[row][col]);
                    }
                }
            }
        };

        $.ui = {
            Desk: Desk
        };
    })(Sudoku);

    var desk = new Sudoku.ui.Desk();
    desk.draw(document.getElementById("sudoku-container"));
    desk.fill(map1);
}