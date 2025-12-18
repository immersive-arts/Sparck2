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
            geometry.uvs_mod[j].x = geometry.uvs_mod[j].x + this.delta.x;
            geometry.uvs_mod[j].y = geometry.uvs_mod[j].y + this.delta.y;
        }
    }
};

WARP.MoveUVsCommand.prototype.undo = function(geometry) {
    for(var i = 0; i < this.affectedIndices.length; i++){
        var idx = this.affectedIndices[i];
        geometry.uvs_mod[idx].x = geometry.uvs_mod[idx].x - this.delta.x;
        geometry.uvs_mod[idx].y = geometry.uvs_mod[idx].y - this.delta.y;
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

/**
 * Command: Scale UVs
 * UV space is 0-1, cursor is in viewport coordinates (converted to UV)
 */
WARP.ScaleUVsCommand = function(currentPoint, originPoint, cursor, axisConstraint) {
    WARP.Command.call(this);
    this.name = "ScaleUVs";
    this.currentPoint = currentPoint.clone();
    this.originPoint = originPoint.clone();
    // Cursor is already in UV space (0-1)
    this.cursor = cursor.clone();
    this.axisConstraint = axisConstraint || null; // null, 'x', or 'y'
    this.previousUVs = [];
    this.affectedIndices = [];
};

WARP.ScaleUVsCommand.prototype = Object.create(WARP.Command.prototype);
WARP.ScaleUVsCommand.prototype.constructor = WARP.ScaleUVsCommand;

WARP.ScaleUVsCommand.prototype.execute = function(geometry) {
    this.previousUVs = [];
    this.affectedIndices = [];
    
    // Convert viewport points to UV space
    var cursor_current = new THREE.Vector2((this.currentPoint.x + 1.0) * 0.5, (this.currentPoint.y + 1.0) * 0.5);
    var cursor_origin = new THREE.Vector2((this.originPoint.x + 1.0) * 0.5, (this.originPoint.y + 1.0) * 0.5);
    
    var cursor_current_delta = cursor_current.clone().sub(this.cursor);
    var cursor_origin_delta = cursor_origin.clone().sub(this.cursor);
    
    var scale;
    
    if(this.axisConstraint == 'x') {
        // Scale only in X (U) axis
        if(Math.abs(cursor_origin_delta.x) < 0.001) return;
        scale = cursor_current_delta.x / cursor_origin_delta.x;
    } else if(this.axisConstraint == 'y') {
        // Scale only in Y (V) axis
        if(Math.abs(cursor_origin_delta.y) < 0.001) return;
        scale = cursor_current_delta.y / cursor_origin_delta.y;
    } else {
        // Uniform scale (original behavior)
        var dist_current = cursor_current.distanceTo(this.cursor);
        var dist_origin = cursor_origin.distanceTo(this.cursor);
        if(dist_origin < 0.001) return;
        scale = dist_current / dist_origin;
    }
    
    for(var j = 0; j < geometry.uvs.length; j++){
        if(geometry.selectedUVs[j] == 1){
            this.affectedIndices.push(j);
            this.previousUVs.push(geometry.uvs_mod[j].clone());
            
            // Scale from the snapshot, not current state
            var delta = geometry.uvs_mod_tmp[j].clone().sub(this.cursor);
            
            if(this.axisConstraint == 'x') {
                delta.x *= scale;
            } else if(this.axisConstraint == 'y') {
                delta.y *= scale;
            } else {
                delta.multiplyScalar(scale);
            }
            
            // Apply scale
            geometry.uvs_mod[j].x = this.cursor.x + delta.x;
            geometry.uvs_mod[j].y = this.cursor.y + delta.y;
        }
    }
};

WARP.ScaleUVsCommand.prototype.undo = function(geometry) {
    for(var i = 0; i < this.affectedIndices.length; i++){
        var idx = this.affectedIndices[i];
        geometry.uvs_mod[idx] = this.previousUVs[i];
    }
};

WARP.ScaleUVsCommand.prototype.merge = function(newCommand) {
    if(newCommand.constructor !== WARP.ScaleUVsCommand) return false;
    // Only merge if they share the same origin and cursor
    if(!this.originPoint.equals(newCommand.originPoint)) return false;
    if(!this.cursor.equals(newCommand.cursor)) return false;
    
    this.currentPoint = newCommand.currentPoint.clone();
    return true;
};

/**
 * Command: Rotate UVs
 * UV space is 0-1, cursor is in viewport coordinates (converted to UV)
 */
WARP.RotateUVsCommand = function(currentPoint, originPoint, cursor) {
    WARP.Command.call(this);
    this.name = "RotateUVs";
    this.currentPoint = currentPoint.clone();
    this.originPoint = originPoint.clone();
    // Cursor is already in UV space (0-1)
    this.cursor = cursor.clone();
    this.previousUVs = [];
    this.affectedIndices = [];
};

WARP.RotateUVsCommand.prototype = Object.create(WARP.Command.prototype);
WARP.RotateUVsCommand.prototype.constructor = WARP.RotateUVsCommand;

WARP.RotateUVsCommand.prototype.execute = function(geometry) {
    this.previousUVs = [];
    this.affectedIndices = [];
    
    // Convert viewport points to UV space
    var cursor_current = new THREE.Vector2((this.currentPoint.x + 1.0) * 0.5, (this.currentPoint.y + 1.0) * 0.5);
    var cursor_origin = new THREE.Vector2((this.originPoint.x + 1.0) * 0.5, (this.originPoint.y + 1.0) * 0.5);
    
    // Calculate vectors from cursor to origin and current points
    var vec_origin = cursor_origin.clone().sub(this.cursor);
    var vec_current = cursor_current.clone().sub(this.cursor);
    
    // Calculate the angle between the two vectors using atan2
    var angle_origin = Math.atan2(vec_origin.y, vec_origin.x);
    var angle_current = Math.atan2(vec_current.y, vec_current.x);
    var angle = angle_current - angle_origin;
    
    // Precompute sin/cos for rotation
    var cos_angle = Math.cos(angle);
    var sin_angle = Math.sin(angle);
    
    for(var j = 0; j < geometry.uvs.length; j++){
        if(geometry.selectedUVs[j] == 1){
            this.affectedIndices.push(j);
            this.previousUVs.push(geometry.uvs_mod[j].clone());
            
            // Rotate from the snapshot, not current state
            var delta = geometry.uvs_mod_tmp[j].clone().sub(this.cursor);
            
            // Apply 2D rotation
            var rotated_x = delta.x * cos_angle - delta.y * sin_angle;
            var rotated_y = delta.x * sin_angle + delta.y * cos_angle;
            
            // Apply rotation
            geometry.uvs_mod[j].x = this.cursor.x + rotated_x;
            geometry.uvs_mod[j].y = this.cursor.y + rotated_y;
        }
    }
};

WARP.RotateUVsCommand.prototype.undo = function(geometry) {
    for(var i = 0; i < this.affectedIndices.length; i++){
        var idx = this.affectedIndices[i];
        geometry.uvs_mod[idx] = this.previousUVs[i];
    }
};

WARP.RotateUVsCommand.prototype.merge = function(newCommand) {
    if(newCommand.constructor !== WARP.RotateUVsCommand) return false;
    // Only merge if they share the same origin and cursor
    if(!this.originPoint.equals(newCommand.originPoint)) return false;
    if(!this.cursor.equals(newCommand.cursor)) return false;
    
    this.currentPoint = newCommand.currentPoint.clone();
    return true;
};
