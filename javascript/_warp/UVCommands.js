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
 * UV Commands - Similar to GeometryCommands but for UV coordinates
 * UV space is 0-1, not -1 to +1 like mesh vertices
 */

/**
 * Command: Select UVs
 */
WARP.SelectUVsCommand = function(pickRayIndex, additive) {
    WARP.Command.call(this);
    this.name = "SelectUVs";
    this.pickRayIndex = pickRayIndex;
    this.additive = additive;
    this.previousSelection = null;
    this.previousCount = 0;
};

WARP.SelectUVsCommand.prototype = Object.create(WARP.Command.prototype);
WARP.SelectUVsCommand.prototype.constructor = WARP.SelectUVsCommand;

WARP.SelectUVsCommand.prototype.execute = function(geometry) {
    this.previousSelection = geometry.selectedUVs.slice();
    this.previousCount = geometry.hasSelectedUVs;
    
    if(this.pickRayIndex === -1) return;
    
    if(this.additive){
        if(geometry.selectedUVs[this.pickRayIndex] == 0){
            geometry.selectedUVs[this.pickRayIndex] = 1;
            geometry.hasSelectedUVs++;
        } else {
            geometry.selectedUVs[this.pickRayIndex] = 0;
            geometry.hasSelectedUVs--;
        }
    } else {
        for(var j = 0; j < geometry.uvs.length; j++){
            geometry.selectedUVs[j] = 0;
        }
        geometry.selectedUVs[this.pickRayIndex] = 1;
        geometry.hasSelectedUVs = 1;
    }
};

WARP.SelectUVsCommand.prototype.undo = function(geometry) {
    geometry.selectedUVs = this.previousSelection;
    geometry.hasSelectedUVs = this.previousCount;
};

/**
 * Command: Select All UVs
 */
WARP.SelectAllUVsCommand = function() {
    WARP.Command.call(this);
    this.name = "SelectAllUVs";
    this.previousSelection = null;
    this.previousCount = 0;
};

WARP.SelectAllUVsCommand.prototype = Object.create(WARP.Command.prototype);
WARP.SelectAllUVsCommand.prototype.constructor = WARP.SelectAllUVsCommand;

WARP.SelectAllUVsCommand.prototype.execute = function(geometry) {
    this.previousSelection = geometry.selectedUVs.slice();
    this.previousCount = geometry.hasSelectedUVs;
    
    var value = (geometry.hasSelectedUVs == geometry.uvs.length) ? 0 : 1;
    
    for(var j = 0; j < geometry.uvs.length; j++){
        geometry.selectedUVs[j] = value;
    }
    geometry.hasSelectedUVs = geometry.uvs.length * value;
};

WARP.SelectAllUVsCommand.prototype.undo = function(geometry) {
    geometry.selectedUVs = this.previousSelection;
    geometry.hasSelectedUVs = this.previousCount;
};

/**
 * Command: Move UVs
 * Delta is in viewport coordinates (-1 to +1), needs conversion to UV space (0 to 1)
 */
WARP.MoveUVsCommand = function(delta) {
    WARP.Command.call(this);
    this.name = "MoveUVs";
    // Convert viewport delta to UV delta
    this.delta = new THREE.Vector2(delta.x * 0.5, delta.y * 0.5);
    this.affectedIndices = [];
};

WARP.MoveUVsCommand.prototype = Object.create(WARP.Command.prototype);
WARP.MoveUVsCommand.prototype.constructor = WARP.MoveUVsCommand;

WARP.MoveUVsCommand.prototype.execute = function(geometry) {
    this.affectedIndices = [];
    
    for(var j = 0; j < geometry.uvs.length; j++){
        if(geometry.selectedUVs[j] == 1){
            this.affectedIndices.push(j);
            geometry.uvs_mod[j].x = Math.max(0, Math.min(1, geometry.uvs_mod[j].x + this.delta.x));
            geometry.uvs_mod[j].y = Math.max(0, Math.min(1, geometry.uvs_mod[j].y + this.delta.y));
        }
    }
};

WARP.MoveUVsCommand.prototype.undo = function(geometry) {
    for(var i = 0; i < this.affectedIndices.length; i++){
        var idx = this.affectedIndices[i];
        geometry.uvs_mod[idx].x = Math.max(0, Math.min(1, geometry.uvs_mod[idx].x - this.delta.x));
        geometry.uvs_mod[idx].y = Math.max(0, Math.min(1, geometry.uvs_mod[idx].y - this.delta.y));
    }
};

WARP.MoveUVsCommand.prototype.merge = function(newCommand) {
    if(newCommand.constructor !== WARP.MoveUVsCommand) return false;
    this.delta.x += newCommand.delta.x;
    this.delta.y += newCommand.delta.y;
    return true;
};

/**
 * Command: Set UV Cursor
 */
WARP.SetUVCursorCommand = function() {
    WARP.Command.call(this);
    this.name = "SetUVCursor";
    this.previousCursor = null;
    this.newCursor = null;
};

WARP.SetUVCursorCommand.prototype = Object.create(WARP.Command.prototype);
WARP.SetUVCursorCommand.prototype.constructor = WARP.SetUVCursorCommand;

WARP.SetUVCursorCommand.prototype.execute = function(geometry) {
    this.previousCursor = geometry.myUVCursor_mod.clone();
    
    var count = 0;
    this.newCursor = new THREE.Vector2(0, 0);
    
    for(var j = 0; j < geometry.uvs.length; j++){
        if(geometry.selectedUVs[j] == 1){
            this.newCursor.add(geometry.uvs_mod[j]);
            count++;
        }
    }
    
    if(count > 0){
        this.newCursor.divideScalar(count);
        geometry.myUVCursor_mod = this.newCursor.clone();
    }
};

WARP.SetUVCursorCommand.prototype.undo = function(geometry) {
    geometry.myUVCursor_mod = this.previousCursor;
};

/**
 * Command: Reset UVs
 */
WARP.ResetUVsCommand = function() {
    WARP.Command.call(this);
    this.name = "ResetUVs";
    this.previousUVs = [];
};

WARP.ResetUVsCommand.prototype = Object.create(WARP.Command.prototype);
WARP.ResetUVsCommand.prototype.constructor = WARP.ResetUVsCommand;

WARP.ResetUVsCommand.prototype.execute = function(geometry) {
    this.previousUVs = [];
    
    for(var j = 0; j < geometry.uvs.length; j++){
        if(geometry.selectedUVs[j] == 1){
            this.previousUVs.push({
                index: j,
                uv: geometry.uvs_mod[j].clone()
            });
            geometry.uvs_mod[j] = geometry.uvs[j].clone();
        }
    }
};

WARP.ResetUVsCommand.prototype.undo = function(geometry) {
    for(var i = 0; i < this.previousUVs.length; i++){
        var stored = this.previousUVs[i];
        geometry.uvs_mod[stored.index] = stored.uv;
    }
};

/**
 * Command: Store UV Selection
 */
WARP.StoreUVSelectionCommand = function(storeIndex) {
    WARP.Command.call(this);
    this.name = "StoreUVSelection";
    this.storeIndex = storeIndex;
    this.previousStore = null;
};

WARP.StoreUVSelectionCommand.prototype = Object.create(WARP.Command.prototype);
WARP.StoreUVSelectionCommand.prototype.constructor = WARP.StoreUVSelectionCommand;

WARP.StoreUVSelectionCommand.prototype.execute = function(geometry) {
    this.previousStore = (geometry.selectedUVStore[this.storeIndex] != null) ? 
                         geometry.selectedUVStore[this.storeIndex].slice(0) : null;
    
    geometry.selectedUVStore[this.storeIndex] = geometry.selectedUVs.slice(0);
};

WARP.StoreUVSelectionCommand.prototype.undo = function(geometry) {
    if(this.previousStore != null){
        geometry.selectedUVStore[this.storeIndex] = this.previousStore;
    } else {
        geometry.selectedUVStore[this.storeIndex] = null;
    }
};

/**
 * Command: Recall UV Selection
 */
WARP.RecallUVSelectionCommand = function(storeIndex) {
    WARP.Command.call(this);
    this.name = "RecallUVSelection";
    this.storeIndex = storeIndex;
    this.previousSelection = null;
    this.previousCount = 0;
};

WARP.RecallUVSelectionCommand.prototype = Object.create(WARP.Command.prototype);
WARP.RecallUVSelectionCommand.prototype.constructor = WARP.RecallUVSelectionCommand;

WARP.RecallUVSelectionCommand.prototype.execute = function(geometry) {
    this.previousSelection = geometry.selectedUVs.slice();
    this.previousCount = geometry.hasSelectedUVs;
    
    if(geometry.selectedUVStore[this.storeIndex] != null){
        geometry.selectedUVs = geometry.selectedUVStore[this.storeIndex].slice(0);
        
        var count = 0;
        for(var i = 0; i < geometry.selectedUVs.length; i++){
            if(geometry.selectedUVs[i] == 1) count++;
        }
        geometry.hasSelectedUVs = count;
    }
};

WARP.RecallUVSelectionCommand.prototype.undo = function(geometry) {
    geometry.selectedUVs = this.previousSelection;
    geometry.hasSelectedUVs = this.previousCount;
};

/**
 * Command: Apply Lattice to UVs
 */
WARP.ApplyUVLatticeCommand = function() {
    WARP.Command.call(this);
    this.name = "ApplyUVLattice";
    this.previousUVs = [];
};

WARP.ApplyUVLatticeCommand.prototype = Object.create(WARP.Command.prototype);
WARP.ApplyUVLatticeCommand.prototype.constructor = WARP.ApplyUVLatticeCommand;

WARP.ApplyUVLatticeCommand.prototype.execute = function(geometry) {
    this.previousUVs = new Array(geometry.uvs_mod.length);
    
    for(var i = 0; i < geometry.uvs_mod.length; i++){
        this.previousUVs[i] = geometry.uvs_mod[i].clone();
        geometry.uvs_mod[i] = geometry.uvs_mod_lat[i].clone();
    }
};

WARP.ApplyUVLatticeCommand.prototype.undo = function(geometry) {
    for(var i = 0; i < this.previousUVs.length; i++){
        geometry.uvs_mod[i] = this.previousUVs[i];
    }
};
