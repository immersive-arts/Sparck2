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
 * UV Mesh Manager
 * Manages UV coordinate editing operations
 * Works with the same geometry object as MeshMngr but focuses on UVs
 */
WARP.UVMeshMngr = function ( geometry ) {
    this.geometry = geometry;  // Reference to shared geometry
    this.commandHistory = new WARP.CommandHistory(100);
    this.hasItChanged = true;
    this.hasUVChanged = true;
    this.lastPickRayIndex = -1;
};

WARP.UVMeshMngr.prototype = {

	constructor: WARP.UVMeshMngr,

    // Execute a command and update flags
    executeCommand: function ( command ) {
        this.commandHistory.execute(command, this.geometry);
        this.hasItChanged = true;
        this.hasUVChanged = true;
 	},

    hasChanged: function ( ) {
        return this.hasItChanged;
	},

    hasUVsChanged: function ( ) {
        return this.hasUVChanged;
	},

    // Modify UVs with lattice
	modifyWith: function ( _uvLatticeManager ) {
        _uvLatticeManager.modify(this.geometry, this.hasUVChanged);
    },

    // Apply the lattice modification as the UV modification
	applyLattice: function ( ) {
        this.executeCommand(new WARP.ApplyUVLatticeCommand());
   },

    // Compatibility - command pattern handles this
    makeClone: function ( ) {
    },

    undoUV: function ( ) {
        if(this.commandHistory.undo(this.geometry)){
            this.hasItChanged = true;
            this.hasUVChanged = true;
        }
   },

    redoUV: function ( ) {
        if(this.commandHistory.redo(this.geometry)){
            this.hasItChanged = true;
            this.hasUVChanged = true;
        }
   },

    // Draw UVs, modified by the lattice
	drawLatMod: function ( _lattice_sketch, _drawMode, _cameraScale ) {
        WARP.GeometryQueries.drawUV(this.geometry, _lattice_sketch, _drawMode, 2, _cameraScale);
        this.hasItChanged = false;
        this.hasUVChanged = false;
	},

    hasSelection: function ( ) {
        return WARP.GeometryQueries.hasUVSelection(this.geometry);
    },

	select: function ( ) {
        this.executeCommand(new WARP.SelectUVsCommand(this.geometry.pickRayUVIndx, false));
	},

	selectAdd: function ( ) {
        this.executeCommand(new WARP.SelectUVsCommand(this.geometry.pickRayUVIndx, true));
	},

    // Recall UV selection from store
    recallStoreSelection: function ( _storeIndex ) {
        this.executeCommand(new WARP.RecallUVSelectionCommand(_storeIndex));
	},

    // Store UV selection
    storeSelection: function ( _storeIndex ) {
        this.executeCommand(new WARP.StoreUVSelectionCommand(_storeIndex));
 	},

    selectAll: function ( ) {
        this.executeCommand(new WARP.SelectAllUVsCommand());
    },

    setCursor: function ( ) {
        this.executeCommand(new WARP.SetUVCursorCommand());
    },

    setUV: function ( _point) {
        this.executeCommand(new WARP.MoveUVsCommand(_point));
    },

    uvSnapshot: function ( ) {
        // Store snapshot in uvs_mod_tmp for scale/rotate operations
        this.geometry.uvs_mod_tmp = new Array(this.geometry.uvs_mod.length);
        for(var j = 0; j < this.geometry.uvs_mod.length; j++){
            this.geometry.uvs_mod_tmp[j] = this.geometry.uvs_mod[j].clone();
        }
    },

    scaleUV: function ( _currentPoint, _originPoint, _axisConstraint) {
        this.executeCommand(new WARP.ScaleUVsCommand(_currentPoint, _originPoint, this.geometry.myUVCursor_mod, _axisConstraint));
    },

    rotateUV: function ( _currentPoint, _originPoint) {
        this.executeCommand(new WARP.RotateUVsCommand(_currentPoint, _originPoint, this.geometry.myUVCursor_mod));
    },

	resetUV: function ( ) {
        this.executeCommand(new WARP.ResetUVsCommand());
    },    // Pick ray against lattice-modified UVs
    pickRayLatMod: function ( _pickRay ) {
        var prindex = WARP.GeometryQueries.pickRayUVLattice(this.geometry, _pickRay);
        if(prindex != this.lastPickRayIndex){
            this.hasItChanged = true;
        }
        this.lastPickRayIndex = prindex;
	},

    // Pick ray against UVs
	pickRay: function ( _pickRay ) {
        var prindex = WARP.GeometryQueries.pickRayUV(this.geometry, _pickRay);
        if(prindex != this.lastPickRayIndex){
           this.hasItChanged = true;
        }
        this.lastPickRayIndex = prindex;
 	}
};
