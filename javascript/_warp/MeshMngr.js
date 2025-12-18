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
 
WARP.MeshMngr = function ( manager ) {

    this.geometry = new WARP.Geometry();
    this.commandHistory = new WARP.CommandHistory(100);

    this.hasItChanged = true;
	this.hasMeshChanged = true;

    this.lastPickRayIndex = -1;
    this.interpolateLoadedMesh = false;

    // Initialize with a default geometry
    var cmd = new WARP.CreateGeometryCommand(10);
    cmd.execute(this.geometry);

 };

WARP.MeshMngr.prototype = {

	constructor: WARP.MeshMngr,

    // returns the current mesh
    getCurrentMesh: function ( ) {
 		return this.geometry;
 	},

    // Execute a command and update flags
    executeCommand: function ( command ) {
        this.commandHistory.execute(command, this.geometry);
        this.hasItChanged = true;
        this.hasMeshChanged = true;
 	},

    // save the current geometry
    // if _diff is true, save it with difference mesh
    save: function ( fout, _diff ) {
        if (fout.isopen) {
            //vertices
            for(var i = 0; i < this.getCurrentMesh().vertices.length; i++){
                fout.writeline("v " + this.getCurrentMesh().vertices[i].x + " " + this.getCurrentMesh().vertices[i].y + " " + this.getCurrentMesh().vertices[i].z);
            }
            //texturecoord
            for(var i = 0; i < this.getCurrentMesh().uvs.length; i++){
                fout.writeline("vt " + this.getCurrentMesh().uvs[i].x + " " + this.getCurrentMesh().uvs[i].y);
            }
            //normals
            for(var i = 0; i < this.getCurrentMesh().normals.length; i++){
                fout.writeline("vn " + this.getCurrentMesh().normals[i].x + " " + this.getCurrentMesh().normals[i].y + " " + this.getCurrentMesh().normals[i].z);
            }
            //faces
            for(var i = 0; i < this.getCurrentMesh().faces.length; i++){
                var face = this.getCurrentMesh().faces[i];
                if(face.isQuad) {
                    // Save as quad (4 vertices)
                    fout.writeline("f " +
                    (face.vertA + 1) + "/" + (face.uvA + 1) + "/" + (face.normA + 1) + " " +
                    (face.vertB + 1) + "/" + (face.uvB + 1) + "/" + (face.normB + 1) + " " +
                    (face.vertC + 1) + "/" + (face.uvC + 1) + "/" + (face.normC + 1) + " " +
                    (face.vertD + 1) + "/" + (face.uvD + 1) + "/" + (face.normD + 1));
                } else {
                    // Save as triangle (3 vertices)
                    fout.writeline("f " +
                    (face.vertA + 1) + "/" + (face.uvA + 1) + "/" + (face.normA + 1) + " " +
                    (face.vertB + 1) + "/" + (face.uvB + 1) + "/" + (face.normB + 1) + " " +
                    (face.vertC + 1) + "/" + (face.uvC + 1) + "/" + (face.normC + 1));
                }
            }
            // selection storage
            for(var i = 0; i < this.getCurrentMesh().selectedStore.length; i++){
                var ss = WARP.GeometryQueries.getSelectStoreList(this.getCurrentMesh(), i);
                if(ss.length > 0){
                    fout.writeline("ss" + ss);
                }
            }
            // differences to the original vertice
            if(_diff){
                // the modified vertices
                for(var i = 0; i < this.getCurrentMesh().vertices.length; i++){
                    fout.writeline("vm " + this.getCurrentMesh().vertices_mod[i].x + " " + this.getCurrentMesh().vertices_mod[i].y + " " + this.getCurrentMesh().vertices_mod[i].z);
                }
                for(var i = 0; i < this.getCurrentMesh().uvs.length; i++){
                    fout.writeline("vtm " + this.getCurrentMesh().uvs_mod[i].x + " " + this.getCurrentMesh().uvs_mod[i].y);
                }
            }
            return true;
        }
        return false;
    },

    // save only the modified mesh (lattice-modified vertices)
    saveModifiedOnly: function ( fout ) {
        if (fout.isopen) {
            //vertices - use lattice-modified vertices
            for(var i = 0; i < this.getCurrentMesh().vertices_mod_lat.length; i++){
                fout.writeline("v " + this.getCurrentMesh().vertices_mod_lat[i].x + " " + this.getCurrentMesh().vertices_mod_lat[i].y + " " + this.getCurrentMesh().vertices_mod_lat[i].z);
            }
            //texturecoord - use original or modified UVs
            for(var i = 0; i < this.getCurrentMesh().uvs.length; i++){
                fout.writeline("vt " + this.getCurrentMesh().uvs[i].x + " " + this.getCurrentMesh().uvs[i].y);
            }
            //normals
            for(var i = 0; i < this.getCurrentMesh().normals.length; i++){
                fout.writeline("vn " + this.getCurrentMesh().normals[i].x + " " + this.getCurrentMesh().normals[i].y + " " + this.getCurrentMesh().normals[i].z);
            }
            //faces - preserve quad topology
            for(var i = 0; i < this.getCurrentMesh().faces.length; i++){
                var face = this.getCurrentMesh().faces[i];
                if(face.isQuad) {
                    // Save as quad (4 vertices)
                    fout.writeline("f " +
                    (face.vertA + 1) + "/" + (face.uvA + 1) + "/" + (face.normA + 1) + " " +
                    (face.vertB + 1) + "/" + (face.uvB + 1) + "/" + (face.normB + 1) + " " +
                    (face.vertC + 1) + "/" + (face.uvC + 1) + "/" + (face.normC + 1) + " " +
                    (face.vertD + 1) + "/" + (face.uvD + 1) + "/" + (face.normD + 1));
                } else {
                    // Save as triangle (3 vertices)
                    fout.writeline("f " +
                    (face.vertA + 1) + "/" + (face.uvA + 1) + "/" + (face.normA + 1) + " " +
                    (face.vertB + 1) + "/" + (face.uvB + 1) + "/" + (face.normB + 1) + " " +
                    (face.vertC + 1) + "/" + (face.uvC + 1) + "/" + (face.normC + 1));
                }
            }
            return true;
        }
        return false;
    },

    hasChanged: function ( ) {
        return this.hasItChanged;
	},

    hasGeometryChanged: function ( ) {
        return this.hasMeshChanged;
	},

    // returns the mesh matrix from the current mesh which is modified by the lattice
    generateMatrix: function ( meshMatrix,  _subDiv, _color ) {
        return WARP.GeometryQueries.generateMatrix(this.getCurrentMesh(), meshMatrix, _subDiv, _color);
    },

    load: function ( _newGeometry ) {
        this.executeCommand(new WARP.LoadGeometryCommand(_newGeometry, this.interpolateLoadedMesh));
	},

    // set the flag if the newly loaded mesh should be interpolated
    interpolateNewMesh: function( _interpolate ){
        this.interpolateLoadedMesh = _interpolate;
    },

    // modify the current mesh with the provided lattice
	modifyWith: function ( _latticeManager ) {
        _latticeManager.modify(this.getCurrentMesh(), this.hasMeshChanged);
    },

    // apply the lattice modification as the mesh modification
	applyLattice: function ( ) {
        this.executeCommand(new WARP.ApplyLatticeCommand());
   },

    // create a new mesh
	create: function ( _dim ) {
        this.executeCommand(new WARP.CreateGeometryCommand(_dim));
	},

    // called when jumping into a modify mode - no longer needed with command pattern
    makeClone: function ( ) {
        // This method is kept for compatibility but doesn't need to do anything
        // The command pattern handles cloning internally
    },

    undoMesh: function ( ) {
        if(this.commandHistory.undo(this.geometry)){
            this.hasItChanged = true;
            this.hasMeshChanged = true;
        }
   },

    redoMesh: function ( ) {
        if(this.commandHistory.redo(this.geometry)){
            this.hasItChanged = true;
            this.hasMeshChanged = true;
        }
   },

    // draw the current mesh, modified by the lattice
	drawLatMod: function ( _lattice_sketch, _drawMode, _cameraScale ) {
        WARP.GeometryQueries.draw(this.getCurrentMesh(), _lattice_sketch, _drawMode, 2, _cameraScale);
        this.hasItChanged = false;
        this.hasMeshChanged = false;
	},

    hasSelection: function ( ) {
        return WARP.GeometryQueries.hasSelection(this.getCurrentMesh());
    },

	select: function ( ) {
        this.executeCommand(new WARP.SelectVerticesCommand(this.getCurrentMesh().pickRayIndx, false));
	},

	selectAdd: function ( ) {
        this.executeCommand(new WARP.SelectVerticesCommand(this.getCurrentMesh().pickRayIndx, true));
	},

    // recall the store for selection
    recallStoreSelection: function ( _storeIndex ) {
        this.executeCommand(new WARP.RecallStoreSelectionCommand(_storeIndex));
	},

    // stores the selected vertice under this index
    storeSelection: function ( _storeIndex ) {
        this.executeCommand(new WARP.StoreSelectionCommand(_storeIndex));
 	},

    selectAll: function ( ) {
        this.executeCommand(new WARP.SelectAllVerticesCommand());
    },

    setCursor: function ( ) {
        this.executeCommand(new WARP.SetCursorCommand());
    },

	setVertice: function ( _point) {
        this.executeCommand(new WARP.MoveVerticesCommand(_point));
    },

    verticeSnapshot: function ( _currentPoint, _originPoint) {
        // Store snapshot in vertices_mod_tmp for scale/rotate operations
        this.getCurrentMesh().vertices_mod_tmp = new Array(this.getCurrentMesh().vertices_mod.length);
        for(var j = 0; j < this.getCurrentMesh().vertices_mod.length; j++){
            this.getCurrentMesh().vertices_mod_tmp[j] = this.getCurrentMesh().vertices_mod[j].clone();
        }
    },

    // call verticeSnapshot before scaling
	scaleVertice: function ( _currentPoint, _originPoint, _axisConstraint) {
        this.executeCommand(new WARP.ScaleVerticesCommand(_currentPoint, _originPoint, this.getCurrentMesh().myCursor_mod, _axisConstraint));
	},    // call verticeSnapshot before rotating
	rotateVertice: function ( _currentPoint, _originPoint) {
        this.executeCommand(new WARP.RotateVerticesCommand(_currentPoint, _originPoint, this.getCurrentMesh().myCursor_mod));
    },

	resetVertice: function ( ) {
        this.executeCommand(new WARP.ResetVerticesCommand());
    },

    deleteVertices: function ( ) {
        this.executeCommand(new WARP.DeleteVerticesCommand());
    },

    // gets the vertice index from the lattice-modified mesh and passes it to
    // the current mesh
    pickRayLatMod: function ( _pickRay ) {
        var prindex = WARP.GeometryQueries.pickRayLattice(this.getCurrentMesh(), _pickRay);
        if(prindex != this.lastPickRayIndex){
            this.hasItChanged = true;
        }
        this.lastPickRayIndex = prindex;
	},

	pickRay: function ( _pickRay ) {
        var prindex = WARP.GeometryQueries.pickRay(this.getCurrentMesh(), _pickRay);
        if(prindex != this.lastPickRayIndex){
           this.hasItChanged = true;
        }
        this.lastPickRayIndex = prindex;
 	}
};
