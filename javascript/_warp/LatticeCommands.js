/* MIT License
 *
 * Copyright (c) 2012-2020 tecartlab.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @author maybites
 *
 */

/**
 * Command: Create Lattice
 */
WARP.CreateLatticeCommand = function(dim) {
    WARP.Command.call(this);
    this.name = "CreateLattice";
    this.dim = dim; // [x, y, rimL, rimR, rimT, rimB]
    this.previousState = null;
};

WARP.CreateLatticeCommand.prototype = Object.create(WARP.Command.prototype);
WARP.CreateLatticeCommand.prototype.constructor = WARP.CreateLatticeCommand;

WARP.CreateLatticeCommand.prototype.execute = function(lattice) {
    this.previousState = lattice.clone();
    
    lattice.dim = [this.dim[0], this.dim[1]];
    lattice.rimL = this.dim[2];
    lattice.rimR = this.dim[3];
    lattice.rimT = this.dim[4];
    lattice.rimB = this.dim[5];
    
    lattice.vertices = new Array(lattice.dim[0]);
    lattice.selectedVertices = new Array(lattice.dim[0]);
    
    for (var i = 0; i < lattice.dim[0]; i++) {
        lattice.vertices[i] = new Array(lattice.dim[1]);
        lattice.selectedVertices[i] = new Array(lattice.dim[1]);
    }
    
    for(var i = 0; i < lattice.dim[0]; i++){
        for(var j = 0; j < lattice.dim[1]; j++){
            var x = (((2. + (lattice.rimL + lattice.rimR)) / (lattice.dim[0] - 1) * i) - (1. + lattice.rimL));
            var y = (((2. + (lattice.rimT + lattice.rimB)) / (lattice.dim[1] - 1) * j) - (1. + lattice.rimB));
            lattice.vertices[i][j] = new THREE.Vector3(x, y, 0);
            lattice.selectedVertices[i][j] = 0;
        }
    }
    
    lattice.hasSelectedVertices = 0;
    lattice.pickrayindx = [-1, -1];
};

WARP.CreateLatticeCommand.prototype.undo = function(lattice) {
    if (this.previousState) {
        var keys = Object.keys(this.previousState);
        for(var i = 0; i < keys.length; i++){
            lattice[keys[i]] = this.previousState[keys[i]];
        }
    }
};

/**
 * Command: Load Lattice
 */
WARP.LoadLatticeCommand = function(dim, rim, vertices) {
    WARP.Command.call(this);
    this.name = "LoadLattice";
    this.dim = dim;
    this.rim = rim;
    this.loadVertices = vertices;
    this.previousState = null;
};

WARP.LoadLatticeCommand.prototype = Object.create(WARP.Command.prototype);
WARP.LoadLatticeCommand.prototype.constructor = WARP.LoadLatticeCommand;

WARP.LoadLatticeCommand.prototype.execute = function(lattice) {
    this.previousState = lattice.clone();
    
    if(this.loadVertices.length !== this.dim[0] * this.dim[1]) {
        error("LoadLatticeCommand: vertex count mismatch\n");
        return;
    }
    
    lattice.dim = this.dim;
    lattice.rimL = this.rim[0];
    lattice.rimR = this.rim[1];
    lattice.rimT = this.rim[2];
    lattice.rimB = this.rim[3];
    
    lattice.vertices = new Array(lattice.dim[0]);
    lattice.selectedVertices = new Array(lattice.dim[0]);
    
    for (var i = 0; i < lattice.dim[0]; i++) {
        lattice.vertices[i] = new Array(lattice.dim[1]);
        lattice.selectedVertices[i] = new Array(lattice.dim[1]);
        for(var j = 0; j < lattice.dim[1]; j++){
            lattice.vertices[i][j] = this.loadVertices[i * lattice.dim[1] + j];
            lattice.selectedVertices[i][j] = 0;
        }
    }
    
    lattice.hasSelectedVertices = 0;
    lattice.pickrayindx = [-1, -1];
};

WARP.LoadLatticeCommand.prototype.undo = function(lattice) {
    if (this.previousState) {
        var keys = Object.keys(this.previousState);
        for(var i = 0; i < keys.length; i++){
            lattice[keys[i]] = this.previousState[keys[i]];
        }
    }
};

/**
 * Command: Select Lattice Vertices
 */
WARP.SelectLatticeCommand = function(pickIndex, additive) {
    WARP.Command.call(this);
    this.name = "SelectLattice";
    this.pickIndex = pickIndex; // [i, j]
    this.additive = additive;
    this.previousSelection = null;
    this.previousCount = 0;
};

WARP.SelectLatticeCommand.prototype = Object.create(WARP.Command.prototype);
WARP.SelectLatticeCommand.prototype.constructor = WARP.SelectLatticeCommand;

WARP.SelectLatticeCommand.prototype.execute = function(lattice) {
    // Store previous state
    this.previousSelection = new Array(lattice.dim[0]);
    for(var i = 0; i < lattice.dim[0]; i++){
        this.previousSelection[i] = lattice.selectedVertices[i].slice();
    }
    this.previousCount = lattice.hasSelectedVertices;
    
    if(this.pickIndex[0] === -1) return;
    
    var i = this.pickIndex[0];
    var j = this.pickIndex[1];
    
    if(this.additive){
        if(lattice.selectedVertices[i][j] == 0){
            lattice.selectedVertices[i][j] = 1;
            lattice.hasSelectedVertices++;
        } else {
            lattice.selectedVertices[i][j] = 0;
            lattice.hasSelectedVertices--;
        }
    } else {
        // Clear all selections
        for(var x = 0; x < lattice.dim[0]; x++){
            for(var y = 0; y < lattice.dim[1]; y++){
                lattice.selectedVertices[x][y] = 0;
            }
        }
        lattice.selectedVertices[i][j] = 1;
        lattice.hasSelectedVertices = 1;
    }
};

WARP.SelectLatticeCommand.prototype.undo = function(lattice) {
    for(var i = 0; i < lattice.dim[0]; i++){
        lattice.selectedVertices[i] = this.previousSelection[i].slice();
    }
    lattice.hasSelectedVertices = this.previousCount;
};

/**
 * Command: Select All Lattice Vertices
 */
WARP.SelectAllLatticeCommand = function() {
    WARP.Command.call(this);
    this.name = "SelectAllLattice";
    this.previousSelection = null;
    this.previousCount = 0;
};

WARP.SelectAllLatticeCommand.prototype = Object.create(WARP.Command.prototype);
WARP.SelectAllLatticeCommand.prototype.constructor = WARP.SelectAllLatticeCommand;

WARP.SelectAllLatticeCommand.prototype.execute = function(lattice) {
    // Store previous state
    this.previousSelection = new Array(lattice.dim[0]);
    for(var i = 0; i < lattice.dim[0]; i++){
        this.previousSelection[i] = lattice.selectedVertices[i].slice();
    }
    this.previousCount = lattice.hasSelectedVertices;
    
    var totalVertices = lattice.dim[0] * lattice.dim[1];
    var value = (lattice.hasSelectedVertices == totalVertices) ? 0 : 1;
    
    for(var i = 0; i < lattice.dim[0]; i++){
        for(var j = 0; j < lattice.dim[1]; j++){
            lattice.selectedVertices[i][j] = value;
        }
    }
    
    lattice.hasSelectedVertices = totalVertices * value;
};

WARP.SelectAllLatticeCommand.prototype.undo = function(lattice) {
    for(var i = 0; i < lattice.dim[0]; i++){
        lattice.selectedVertices[i] = this.previousSelection[i].slice();
    }
    lattice.hasSelectedVertices = this.previousCount;
};

/**
 * Command: Move Lattice Vertices
 */
WARP.MoveLatticeVerticesCommand = function(delta) {
    WARP.Command.call(this);
    this.name = "MoveLatticeVertices";
    this.delta = delta;
    this.affectedIndices = [];
};

WARP.MoveLatticeVerticesCommand.prototype = Object.create(WARP.Command.prototype);
WARP.MoveLatticeVerticesCommand.prototype.constructor = WARP.MoveLatticeVerticesCommand;

WARP.MoveLatticeVerticesCommand.prototype.execute = function(lattice) {
    this.affectedIndices = [];
    
    for(var i = 0; i < lattice.dim[0]; i++){
        for(var j = 0; j < lattice.dim[1]; j++){
            if(lattice.selectedVertices[i][j] == 1){
                this.affectedIndices.push([i, j]);
                lattice.vertices[i][j].add(this.delta);
            }
        }
    }
};

WARP.MoveLatticeVerticesCommand.prototype.undo = function(lattice) {
    for(var k = 0; k < this.affectedIndices.length; k++){
        var i = this.affectedIndices[k][0];
        var j = this.affectedIndices[k][1];
        lattice.vertices[i][j].sub(this.delta);
    }
};

WARP.MoveLatticeVerticesCommand.prototype.merge = function(newCommand) {
    // Accumulate the delta - this preserves the original starting position
    this.delta.add(newCommand.delta);
};

/**
 * Command: Reset Lattice Vertices
 */
WARP.ResetLatticeVerticesCommand = function() {
    WARP.Command.call(this);
    this.name = "ResetLatticeVertices";
    this.previousVertices = null;
    this.affectedIndices = [];
};

WARP.ResetLatticeVerticesCommand.prototype = Object.create(WARP.Command.prototype);
WARP.ResetLatticeVerticesCommand.prototype.constructor = WARP.ResetLatticeVerticesCommand;

WARP.ResetLatticeVerticesCommand.prototype.execute = function(lattice) {
    // Store previous vertices
    this.previousVertices = [];
    this.affectedIndices = [];
    
    for(var i = 0; i < lattice.dim[0]; i++){
        for(var j = 0; j < lattice.dim[1]; j++){
            if(lattice.selectedVertices[i][j] == 1){
                this.affectedIndices.push([i, j]);
                this.previousVertices.push(lattice.vertices[i][j].clone());
                
                // Reset to original position
                var x = (((2. + (lattice.rimL + lattice.rimR)) / (lattice.dim[0] - 1) * i) - (1. + lattice.rimL));
                var y = (((2. + (lattice.rimT + lattice.rimB)) / (lattice.dim[1] - 1) * j) - (1. + lattice.rimB));
                lattice.vertices[i][j] = new THREE.Vector3(x, y, 0);
            }
        }
    }
};

WARP.ResetLatticeVerticesCommand.prototype.undo = function(lattice) {
    for(var k = 0; k < this.affectedIndices.length; k++){
        var i = this.affectedIndices[k][0];
        var j = this.affectedIndices[k][1];
        lattice.vertices[i][j] = this.previousVertices[k];
    }
};
