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
 * Command: Create Geometry
 */
WARP.CreateGeometryCommand = function(dim) {
    WARP.Command.call(this);
    this.name = "CreateGeometry";
    this.dim = dim;
    this.previousState = null;
};

WARP.CreateGeometryCommand.prototype = Object.create(WARP.Command.prototype);
WARP.CreateGeometryCommand.prototype.constructor = WARP.CreateGeometryCommand;

WARP.CreateGeometryCommand.prototype.execute = function(geometry) {
    this.previousState = geometry.clone();
    
    var stepSize = 2.0 / (this.dim - 1);
    var UVstepSize = 1.0 / (this.dim - 1);
    
    geometry.vertices = new Array(this.dim * this.dim);
    geometry.vertices_mod = new Array(this.dim * this.dim);
    geometry.vertices_mod_lat = new Array(this.dim * this.dim);
    geometry.selectedVertices = new Array(this.dim * this.dim);
    geometry.uvs = new Array(this.dim * this.dim);
    geometry.uvs_mod = new Array(this.dim * this.dim);
    geometry.uvs_mod_lat = new Array(this.dim * this.dim);
    geometry.selectedUVs = new Array(this.dim * this.dim);
    
    for(var x = 0; x < this.dim; x++){
        for(var y = 0; y < this.dim; y++){
            var idx = x + y * this.dim;
            geometry.vertices[idx] = new THREE.Vector3(-1 + x * stepSize, -1 + y * stepSize, 0);
            geometry.vertices_mod[idx] = new THREE.Vector3(-1 + x * stepSize, -1 + y * stepSize, 0);
            geometry.vertices_mod_lat[idx] = new THREE.Vector3(-1 + x * stepSize, -1 + y * stepSize, 0);
            geometry.selectedVertices[idx] = 0;
            geometry.uvs[idx] = new THREE.Vector2(x * UVstepSize, y * UVstepSize);
            geometry.uvs_mod[idx] = new THREE.Vector2(x * UVstepSize, y * UVstepSize);
            geometry.uvs_mod_lat[idx] = new THREE.Vector2(x * UVstepSize, y * UVstepSize);
            geometry.selectedUVs[idx] = 0;
        }
    }
    
    geometry.normals = new Array(1);
    geometry.normals[0] = new THREE.Vector3(0, 0, 1);
    
    var faceDim = (this.dim - 1) * (this.dim - 1);
    geometry.faces = new Array(faceDim); // Now storing quads, not 2 triangles per quad
    
    for(var x = 0; x < (this.dim - 1); x++){
        for(var y = 0; y < (this.dim - 1); y++){
            // Store as a quad with all 4 vertices
            geometry.faces[x + y * (this.dim - 1)] = new WARP.Face3(
                x+y*this.dim, x+1+y*this.dim, x+1+(y+1)*this.dim,           // A, B, C
                x+y*this.dim, x+1+y*this.dim, x+1+(y+1)*this.dim,           // uvA, uvB, uvC
                0, 0, 0,                                                      // normA, normB, normC
                x+(y+1)*this.dim,                                            // D (4th vertex)
                x+(y+1)*this.dim,                                            // uvD
                0);                                                           // normD
        }
    }
    
    geometry.selectedStore = new Array(10);
    geometry.selectedUVStore = new Array(10);
    geometry.myCursor = new THREE.Vector3(0, 0, 0);
    geometry.myCursor_mod = new THREE.Vector3(0, 0, 0);
    geometry.myUVCursor = new THREE.Vector2(0.5, 0.5);
    geometry.myUVCursor_mod = new THREE.Vector2(0.5, 0.5);
    geometry.hasSelectedVertices = -1;
    geometry.hasSelectedUVs = -1;
};

WARP.CreateGeometryCommand.prototype.undo = function(geometry) {
    if (this.previousState) {
        var keys = Object.keys(this.previousState);
        for(var i = 0; i < keys.length; i++){
            geometry[keys[i]] = this.previousState[keys[i]];
        }
    }
};

/**
 * Command: Load Geometry
 */
WARP.LoadGeometryCommand = function(newGeometry, interpolate) {
    WARP.Command.call(this);
    this.name = "LoadGeometry";
    this.newGeometry = newGeometry;
    this.interpolate = interpolate;
    this.previousState = null;
};

WARP.LoadGeometryCommand.prototype = Object.create(WARP.Command.prototype);
WARP.LoadGeometryCommand.prototype.constructor = WARP.LoadGeometryCommand;

WARP.LoadGeometryCommand.prototype.execute = function(geometry) {
    this.previousState = geometry.clone();
    
    var thisClone = geometry.clone();
    
    geometry.vertices = new Array(this.newGeometry.vertices.length);
    geometry.vertices_mod = new Array(this.newGeometry.vertices.length);
    geometry.vertices_mod_lat = new Array(this.newGeometry.vertices.length);
    geometry.selectedVertices = new Array(this.newGeometry.vertices.length);
    
    for(var i = 0; i < geometry.vertices.length; i++){
        geometry.vertices[i] = this.newGeometry.vertices[i].clone();
        if(this.newGeometry.vertices_mod[i] != null){
            geometry.vertices_mod[i] = this.newGeometry.vertices_mod[i].clone();
            geometry.vertices_mod_lat[i] = this.newGeometry.vertices_mod[i].clone();
        } else {
            geometry.vertices_mod[i] = null;
            geometry.vertices_mod_lat[i] = null;
            geometry.selectedVertices[i] = 0;
            for(var ci = 0; ci < thisClone.vertices.length; ci++){
                if(this.newGeometry.vertices[i].clone().sub(thisClone.vertices[ci]).length() < 0.00001){
                    geometry.vertices_mod[i] = thisClone.vertices_mod[ci];
                    geometry.vertices_mod_lat[i] = thisClone.vertices_mod[ci];
                    geometry.selectedVertices[i] = thisClone.selectedVertices[ci];
                }
            }
        }
    }
    
    // Handle unmatched vertices
    for(var i = 0; i < geometry.vertices.length; i++){
        if(geometry.vertices_mod[i] == null){
            geometry.vertices_mod[i] = geometry.vertices[i].clone();
            geometry.vertices_mod_lat[i] = geometry.vertices[i].clone();
            
            if(this.interpolate){
                for(var j = 0; j < thisClone.faces.length; j++){
                    if(WARP.GeometryQueries.pointInTriangle(geometry.vertices[i],
                                        thisClone.vertices[thisClone.faces[j].vertA],
                                        thisClone.vertices[thisClone.faces[j].vertB],
                                        thisClone.vertices[thisClone.faces[j].vertC])){
                        var bc = WARP.GeometryQueries.getBarycentricCoordinates(geometry.vertices[i],
                                        thisClone.vertices[thisClone.faces[j].vertA],
                                        thisClone.vertices[thisClone.faces[j].vertB],
                                        thisClone.vertices[thisClone.faces[j].vertC]);
                        
                        var newPoint = thisClone.vertices_mod[thisClone.faces[j].vertA].clone().multiplyScalar(bc[0]);
                        newPoint.add(thisClone.vertices_mod[thisClone.faces[j].vertB].clone().multiplyScalar(bc[1]));
                        newPoint.add(thisClone.vertices_mod[thisClone.faces[j].vertC].clone().multiplyScalar(bc[2]));
                        
                        geometry.vertices_mod[i] = newPoint.clone();
                        geometry.vertices_mod_lat[i] = newPoint.clone();
                    }
                }
            }
        }
    }
    
    // Handle UVs
    geometry.uvs = new Array(this.newGeometry.uvs.length);
    geometry.uvs_mod = new Array(this.newGeometry.uvs.length);
    geometry.uvs_mod_lat = new Array(this.newGeometry.uvs.length);
    geometry.selectedUVs = new Array(this.newGeometry.uvs.length);
    for(var i = 0; i < geometry.uvs.length; i++){
        geometry.uvs[i] = this.newGeometry.uvs[i].clone();
        if(this.newGeometry.uvs_mod[i] != null){
            geometry.uvs_mod[i] = this.newGeometry.uvs_mod[i].clone();
            geometry.uvs_mod_lat[i] = this.newGeometry.uvs_mod[i].clone();
        } else {
            geometry.uvs_mod[i] = geometry.uvs[i].clone();
            geometry.uvs_mod_lat[i] = geometry.uvs[i].clone();
        }
        geometry.selectedUVs[i] = 0;
    }
    
    geometry.normals = new Array(this.newGeometry.normals.length);
    for(var i = 0; i < this.newGeometry.normals.length; i++){
        geometry.normals[i] = this.newGeometry.normals[i];
    }
    
    geometry.faces = new Array(this.newGeometry.faces.length);
    for(var i = 0; i < this.newGeometry.faces.length; i++){
        geometry.faces[i] = this.newGeometry.faces[i].clone();
    }
    
    geometry.selectedStore = new Array(10);
    for(var i = 0; i < this.newGeometry.selectedStore.length; i++){
        geometry.selectedStore[i] = this.newGeometry.selectedStore[i].slice(0);
    }
    
    geometry.selectedUVStore = new Array(10);
    if(this.newGeometry.selectedUVStore){
        for(var i = 0; i < this.newGeometry.selectedUVStore.length; i++){
            if(this.newGeometry.selectedUVStore[i]){
                geometry.selectedUVStore[i] = this.newGeometry.selectedUVStore[i].slice(0);
            }
        }
    }
    
    geometry.myCursor = new THREE.Vector3(0, 0, 0);
    geometry.myCursor_mod = new THREE.Vector3(0, 0, 0);
    geometry.myUVCursor = new THREE.Vector2(0.5, 0.5);
    geometry.myUVCursor_mod = new THREE.Vector2(0.5, 0.5);
};

WARP.LoadGeometryCommand.prototype.undo = function(geometry) {
    if (this.previousState) {
        var keys = Object.keys(this.previousState);
        for(var i = 0; i < keys.length; i++){
            geometry[keys[i]] = this.previousState[keys[i]];
        }
    }
};

/**
 * Command: Select Vertices
 */
WARP.SelectVerticesCommand = function(pickRayIndex, additive) {
    WARP.Command.call(this);
    this.name = "SelectVertices";
    this.pickRayIndex = pickRayIndex;
    this.additive = additive;
    this.previousSelection = null;
    this.previousCount = 0;
};

WARP.SelectVerticesCommand.prototype = Object.create(WARP.Command.prototype);
WARP.SelectVerticesCommand.prototype.constructor = WARP.SelectVerticesCommand;

WARP.SelectVerticesCommand.prototype.execute = function(geometry) {
    this.previousSelection = geometry.selectedVertices.slice();
    this.previousCount = geometry.hasSelectedVertices;
    
    if(this.pickRayIndex === -1) return;
    
    if(this.additive){
        if(geometry.selectedVertices[this.pickRayIndex] == 0){
            geometry.selectedVertices[this.pickRayIndex] = 1;
            geometry.hasSelectedVertices++;
        } else {
            geometry.selectedVertices[this.pickRayIndex] = 0;
            geometry.hasSelectedVertices--;
        }
    } else {
        for(var j = 0; j < geometry.vertices.length; j++){
            geometry.selectedVertices[j] = 0;
        }
        geometry.selectedVertices[this.pickRayIndex] = 1;
        geometry.hasSelectedVertices = 1;
    }
};

WARP.SelectVerticesCommand.prototype.undo = function(geometry) {
    geometry.selectedVertices = this.previousSelection;
    geometry.hasSelectedVertices = this.previousCount;
};

/**
 * Command: Select All Vertices
 */
WARP.SelectAllVerticesCommand = function() {
    WARP.Command.call(this);
    this.name = "SelectAllVertices";
    this.previousSelection = null;
    this.previousCount = 0;
};

WARP.SelectAllVerticesCommand.prototype = Object.create(WARP.Command.prototype);
WARP.SelectAllVerticesCommand.prototype.constructor = WARP.SelectAllVerticesCommand;

WARP.SelectAllVerticesCommand.prototype.execute = function(geometry) {
    this.previousSelection = geometry.selectedVertices.slice();
    this.previousCount = geometry.hasSelectedVertices;
    
    var value = (geometry.hasSelectedVertices == geometry.vertices.length) ? 0 : 1;
    
    for(var j = 0; j < geometry.vertices.length; j++){
        geometry.selectedVertices[j] = value;
    }
    geometry.hasSelectedVertices = geometry.vertices.length * value;
};

WARP.SelectAllVerticesCommand.prototype.undo = function(geometry) {
    geometry.selectedVertices = this.previousSelection;
    geometry.hasSelectedVertices = this.previousCount;
};

/**
 * Command: Move Vertices
 */
WARP.MoveVerticesCommand = function(delta) {
    WARP.Command.call(this);
    this.name = "MoveVertices";
    this.delta = delta;
    this.affectedIndices = [];
};

WARP.MoveVerticesCommand.prototype = Object.create(WARP.Command.prototype);
WARP.MoveVerticesCommand.prototype.constructor = WARP.MoveVerticesCommand;

WARP.MoveVerticesCommand.prototype.execute = function(geometry) {
    this.affectedIndices = [];
    
    for(var j = 0; j < geometry.vertices.length; j++){
        if(geometry.selectedVertices[j] == 1){
            this.affectedIndices.push(j);
            geometry.vertices_mod[j].add(this.delta);
        }
    }
};

WARP.MoveVerticesCommand.prototype.undo = function(geometry) {
    for(var i = 0; i < this.affectedIndices.length; i++){
        var idx = this.affectedIndices[i];
        geometry.vertices_mod[idx].sub(this.delta);
    }
};

WARP.MoveVerticesCommand.prototype.merge = function(newCommand) {
    // Accumulate the delta - this preserves the original starting position
    this.delta.add(newCommand.delta);
};

/**
 * Command: Scale Vertices
 */
WARP.ScaleVerticesCommand = function(currentPoint, originPoint, cursor, axisConstraint) {
    WARP.Command.call(this);
    this.name = "ScaleVertices";
    this.currentPoint = currentPoint.clone();
    this.originPoint = originPoint.clone();
    this.cursor = cursor.clone();
    this.axisConstraint = axisConstraint || null; // null, 'x', or 'y'
    this.previousVertices = null;
    this.affectedIndices = [];
};

WARP.ScaleVerticesCommand.prototype = Object.create(WARP.Command.prototype);
WARP.ScaleVerticesCommand.prototype.constructor = WARP.ScaleVerticesCommand;

WARP.ScaleVerticesCommand.prototype.execute = function(geometry) {
    this.previousVertices = [];
    this.affectedIndices = [];
    
    var cursor_current = this.currentPoint.clone().sub(this.cursor);
    var cursor_origin = this.originPoint.clone().sub(this.cursor);
    
    var scaleFactor;
    
    if(this.axisConstraint == 'x') {
        // Scale only in X axis
        if(Math.abs(cursor_origin.x) < 0.001) return;
        scaleFactor = cursor_current.x / cursor_origin.x;
    } else if(this.axisConstraint == 'y') {
        // Scale only in Y axis
        if(Math.abs(cursor_origin.y) < 0.001) return;
        scaleFactor = cursor_current.y / cursor_origin.y;
    } else {
        // Uniform scale (original behavior)
        var dist_current = cursor_current.length();
        var dist_origin = cursor_origin.length();
        if(dist_origin < 0.001) return;
        scaleFactor = dist_current / dist_origin;
    }
    
    for(var j = 0; j < geometry.vertices.length; j++){
        if(geometry.selectedVertices[j] == 1){
            this.affectedIndices.push(j);
            this.previousVertices.push(geometry.vertices_mod[j].clone());
            
            // Scale from the snapshot (vertices_mod_tmp), not from the current state
            var dirToCursor = geometry.vertices_mod_tmp[j].clone().sub(this.cursor);
            
            if(this.axisConstraint == 'x') {
                dirToCursor.x *= scaleFactor;
            } else if(this.axisConstraint == 'y') {
                dirToCursor.y *= scaleFactor;
            } else {
                dirToCursor.multiplyScalar(scaleFactor);
            }
            
            geometry.vertices_mod[j] = this.cursor.clone().add(dirToCursor);
        }
    }
};

WARP.ScaleVerticesCommand.prototype.undo = function(geometry) {
    for(var i = 0; i < this.affectedIndices.length; i++){
        var idx = this.affectedIndices[i];
        geometry.vertices_mod[idx] = this.previousVertices[i];
    }
};

/**
 * Command: Rotate Vertices
 */
WARP.RotateVerticesCommand = function(currentPoint, originPoint, cursor) {
    WARP.Command.call(this);
    this.name = "RotateVertices";
    this.currentPoint = currentPoint.clone();
    this.originPoint = originPoint.clone();
    this.cursor = cursor.clone();
    this.previousVertices = null;
    this.affectedIndices = [];
};

WARP.RotateVerticesCommand.prototype = Object.create(WARP.Command.prototype);
WARP.RotateVerticesCommand.prototype.constructor = WARP.RotateVerticesCommand;

WARP.RotateVerticesCommand.prototype.execute = function(geometry) {
    this.previousVertices = [];
    this.affectedIndices = [];
    
    // Calculate vectors from cursor to origin and current points
    var cursor_origin = this.originPoint.clone().sub(this.cursor);
    var cursor_current = this.currentPoint.clone().sub(this.cursor);
    
    // Calculate the angle between the two vectors using atan2
    var angle_origin = Math.atan2(cursor_origin.y, cursor_origin.x);
    var angle_current = Math.atan2(cursor_current.y, cursor_current.x);
    var angle = angle_current - angle_origin;
    
    // Create transformation matrix: translate to cursor, rotate, translate back
    var transform = new THREE.Matrix4();
    transform.makeTranslation(-this.cursor.x, -this.cursor.y, -this.cursor.z);
    
    var rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationZ(angle);
    
    var inverseTransform = new THREE.Matrix4();
    inverseTransform.makeTranslation(this.cursor.x, this.cursor.y, this.cursor.z);
    
    // Combine transformations
    var finalTransform = new THREE.Matrix4();
    finalTransform.multiplyMatrices(inverseTransform, rotationMatrix);
    finalTransform.multiply(transform);
    
    for(var j = 0; j < geometry.vertices.length; j++){
        if(geometry.selectedVertices[j] == 1){
            this.affectedIndices.push(j);
            this.previousVertices.push(geometry.vertices_mod[j].clone());
            
            // Rotate from the snapshot, not from the current state
            geometry.vertices_mod[j] = geometry.vertices_mod_tmp[j].clone().applyMatrix4(finalTransform);
        }
    }
};

WARP.RotateVerticesCommand.prototype.undo = function(geometry) {
    for(var i = 0; i < this.affectedIndices.length; i++){
        var idx = this.affectedIndices[i];
        geometry.vertices_mod[idx] = this.previousVertices[i];
    }
};

/**
 * Command: Reset Vertices
 */
WARP.ResetVerticesCommand = function() {
    WARP.Command.call(this);
    this.name = "ResetVertices";
    this.previousVertices = null;
    this.affectedIndices = [];
};

WARP.ResetVerticesCommand.prototype = Object.create(WARP.Command.prototype);
WARP.ResetVerticesCommand.prototype.constructor = WARP.ResetVerticesCommand;

WARP.ResetVerticesCommand.prototype.execute = function(geometry) {
    this.previousVertices = [];
    this.affectedIndices = [];
    
    for(var j = 0; j < geometry.vertices.length; j++){
        if(geometry.selectedVertices[j] == 1){
            this.affectedIndices.push(j);
            this.previousVertices.push(geometry.vertices_mod[j].clone());
            geometry.vertices_mod[j] = geometry.vertices[j].clone();
        }
    }
};

WARP.ResetVerticesCommand.prototype.undo = function(geometry) {
    for(var i = 0; i < this.affectedIndices.length; i++){
        var idx = this.affectedIndices[i];
        geometry.vertices_mod[idx] = this.previousVertices[i];
    }
};

/**
 * Command: Apply Lattice
 */
WARP.ApplyLatticeCommand = function() {
    WARP.Command.call(this);
    this.name = "ApplyLattice";
    this.previousVertices = null;
};

WARP.ApplyLatticeCommand.prototype = Object.create(WARP.Command.prototype);
WARP.ApplyLatticeCommand.prototype.constructor = WARP.ApplyLatticeCommand;

WARP.ApplyLatticeCommand.prototype.execute = function(geometry) {
    this.previousVertices = [];
    
    for(var j = 0; j < geometry.vertices_mod.length; j++){
        this.previousVertices.push(geometry.vertices_mod[j].clone());
        geometry.vertices_mod[j] = geometry.vertices_mod_lat[j].clone();
    }
};

WARP.ApplyLatticeCommand.prototype.undo = function(geometry) {
    for(var j = 0; j < this.previousVertices.length; j++){
        geometry.vertices_mod[j] = this.previousVertices[j];
    }
};

/**
 * Command: Store Selection
 */
WARP.StoreSelectionCommand = function(storeIndex) {
    WARP.Command.call(this);
    this.name = "StoreSelection";
    this.storeIndex = storeIndex;
    this.previousStore = null;
};

WARP.StoreSelectionCommand.prototype = Object.create(WARP.Command.prototype);
WARP.StoreSelectionCommand.prototype.constructor = WARP.StoreSelectionCommand;

WARP.StoreSelectionCommand.prototype.execute = function(geometry) {
    if(this.storeIndex < geometry.selectedStore.length){
        this.previousStore = geometry.selectedStore[this.storeIndex] ? geometry.selectedStore[this.storeIndex].slice() : null;
        
        geometry.selectedStore[this.storeIndex] = new Array();
        for(var j = 0; j < geometry.vertices.length; j++){
            if(geometry.selectedVertices[j] == 1){
                geometry.selectedStore[this.storeIndex].push(j);
            }
        }
    }
};

WARP.StoreSelectionCommand.prototype.undo = function(geometry) {
    if(this.storeIndex < geometry.selectedStore.length){
        geometry.selectedStore[this.storeIndex] = this.previousStore ? this.previousStore.slice() : null;
    }
};

/**
 * Command: Recall Store Selection
 */
WARP.RecallStoreSelectionCommand = function(storeIndex) {
    WARP.Command.call(this);
    this.name = "RecallStoreSelection";
    this.storeIndex = storeIndex;
    this.previousSelection = null;
    this.previousCount = 0;
};

WARP.RecallStoreSelectionCommand.prototype = Object.create(WARP.Command.prototype);
WARP.RecallStoreSelectionCommand.prototype.constructor = WARP.RecallStoreSelectionCommand;

WARP.RecallStoreSelectionCommand.prototype.execute = function(geometry) {
    this.previousSelection = geometry.selectedVertices.slice();
    this.previousCount = geometry.hasSelectedVertices;
    
    var value = 0;
    if(this.storeIndex < geometry.selectedStore.length && geometry.selectedStore[this.storeIndex] != null){
        for(var j = 0; j < geometry.selectedStore[this.storeIndex].length; j++){
            if(value == 0 && geometry.selectedVertices[geometry.selectedStore[this.storeIndex][j]] == 0){
                value = 1;
            }
        }
        for(var j = 0; j < geometry.selectedStore[this.storeIndex].length; j++){
            geometry.selectedVertices[geometry.selectedStore[this.storeIndex][j]] = value;
        }
        
        // Recalculate hasSelectedVertices
        var count = 0;
        for(var j = 0; j < geometry.selectedVertices.length; j++){
            if(geometry.selectedVertices[j] == 1) count++;
        }
        geometry.hasSelectedVertices = count;
    }
};

WARP.RecallStoreSelectionCommand.prototype.undo = function(geometry) {
    geometry.selectedVertices = this.previousSelection;
    geometry.hasSelectedVertices = this.previousCount;
};

/**
 * Command: Set Cursor
 */
WARP.SetCursorCommand = function() {
    WARP.Command.call(this);
    this.name = "SetCursor";
    this.previousCursor = null;
    this.previousCursorMod = null;
};

WARP.SetCursorCommand.prototype = Object.create(WARP.Command.prototype);
WARP.SetCursorCommand.prototype.constructor = WARP.SetCursorCommand;

WARP.SetCursorCommand.prototype.execute = function(geometry) {
    this.previousCursor = geometry.myCursor.clone();
    this.previousCursorMod = geometry.myCursor_mod.clone();
    
    geometry.myCursor.set(0, 0, 0);
    geometry.myCursor_mod.set(0, 0, 0);
    var counter = 0;
    for(var j = 0; j < geometry.vertices.length; j++){
        if(geometry.selectedVertices[j] == 1){
            geometry.myCursor.add(geometry.vertices[j]);
            geometry.myCursor_mod.add(geometry.vertices_mod[j]);
            counter++;
        }
    }
    if(counter > 0){
        geometry.myCursor.multiplyScalar(1.0 / counter);
        geometry.myCursor_mod.multiplyScalar(1.0 / counter);
    }
};

WARP.SetCursorCommand.prototype.undo = function(geometry) {
    geometry.myCursor = this.previousCursor;
    geometry.myCursor_mod = this.previousCursorMod;
};
