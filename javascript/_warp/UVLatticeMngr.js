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
 * UV Lattice Manager
 * Manages lattice deformation for UV coordinates (0-1 space)
 * Similar to LatticeMngr but with UV-specific coordinate transformations
 */
WARP.UVLatticeMngr = function ( manager ) {

	this.manager = 'default';
	this.lattice = new WARP.Lattice2D();
    this.commandHistory = new WARP.CommandHistory(100);

    this.hasItChanged = false;
	this.hasGeomChanged = false;

    this.lastPickRayIndex = [-1, -1];
    
    // Initialize with a default 3x3 lattice
    var cmd = new WARP.CreateLatticeCommand([3, 3, 0., 0., 0., 0.]);
    cmd.execute(this.lattice);
 };

WARP.UVLatticeMngr.prototype = {

	constructor: WARP.UVLatticeMngr,

    getCurrentLattice: function ( ) {
 		return this.lattice;
 	},

    // Execute a command and update flags
    executeCommand: function ( command ) {
        this.commandHistory.execute(command, this.lattice);
        this.hasItChanged = true;
        this.hasGeomChanged = true;
 	},

    save: function ( fout ) {
        if (fout.isopen) {
            fout.writeline("uld " + this.getCurrentLattice().dim[0] + " " + this.getCurrentLattice().dim[1]);
            fout.writeline("ulr " + this.getCurrentLattice().rimL + " " + this.getCurrentLattice().rimR + " " + this.getCurrentLattice().rimB + " " + this.getCurrentLattice().rimT);
            for(var x = 0; x < this.getCurrentLattice().dim[0]; x++){
                for(var y = 0; y < this.getCurrentLattice().dim[1]; y++){
                    fout.writeline("ulv " + this.getCurrentLattice().vertices[x][y].x + " " + this.getCurrentLattice().vertices[x][y].y + " " + this.getCurrentLattice().vertices[x][y].z);
                }
            }
            return true;
        }
        return false;
    },

    // Modify the provided geometry's UVs with lattice deformation
	modify: function ( _geometry, _force ) {
		if(this.hasItChanged || _force){
            _geometry.uvs_mod_lat = [];
            
            // Loop through all UV coordinates
            for (var x = 0; x < _geometry.uvs_mod.length; x++) {
                var uv = _geometry.uvs_mod[x];
                var bPoints = new Array(this.getCurrentLattice().dim[0]);
                
                // Loop through all x-dimensions of the lattice
                for (var i = 0; i < bPoints.length; i++) {
                    // Compute new list of UV y-values
                    bPoints[i] = this.computePoint(
                        this.getCurrentLattice().vertices[i], 
                        this.uv2normalized(uv.y, this.getCurrentLattice().rimB, this.getCurrentLattice().rimT)
                    );
                }
                
                var d2result = this.computePoint(
                    bPoints, 
                    this.uv2normalized(uv.x, this.getCurrentLattice().rimL, this.getCurrentLattice().rimR)
                );
                
                // Convert back from viewport coordinates to UV coordinates
                _geometry.uvs_mod_lat.push(new THREE.Vector2(
                    this.viewport2uv(d2result.x), 
                    this.viewport2uv(d2result.y)
                ));
            }

            // Calculate the UV cursor
            var crsr = _geometry.myUVCursor_mod;
            
            // Convert UV cursor to viewport for lattice calculation
            var crsr_viewport = this.uv2viewport(crsr);
            
            var bPoints = new Array(this.getCurrentLattice().dim[0]);
            for (var i = 0; i < bPoints.length; i++) {
                bPoints[i] = this.computePoint(
                    this.getCurrentLattice().vertices[i], 
                    this.uv2normalized(crsr.y, this.getCurrentLattice().rimB, this.getCurrentLattice().rimT)
                );
            }
            
            var result = this.computePoint(
                bPoints, 
                this.uv2normalized(crsr.x, this.getCurrentLattice().rimL, this.getCurrentLattice().rimR)
            );
            
            // Convert result back to UV space
            _geometry.myUVCursor_mod_lat = new THREE.Vector2(
                this.viewport2uv(result.x),
                this.viewport2uv(result.y)
            );
        }
 	},

    // Helper function: Compute interpolated point using Bezier-like curve
    // _vertList: list of 2D/3D vertices
    // _w: linear interpolant (scalar)
	computePoint: function ( _vertList, _w ) {
		var out;
        
		for (var i = _vertList.length - 1; i > 0; i--) {
			var lerped = new Array(i);
		  	for (var p = 0; p < i; p++) {
				lerped[p] = _vertList[p].clone().lerp(_vertList[p + 1], _w);
		  	}
		  	_vertList = lerped;
			if (_vertList.length == 1)
                out = _vertList[0];
		}
		return out;
	},

    lerp: function(_vec1, _vec2, _alpha){
        _vec1.x += ( _vec2.x  - _vec1.x) * _alpha;
        _vec1.y += ( _vec2.y  - _vec1.y) * _alpha;
        return _vec1;
    },

    /**
     * Convert UV coordinate (0-1) to normalized lattice coordinate (0-1 with rims)
     * This is different from vpc2normalized which handles viewport coords (-1 to +1)
     */
	uv2normalized: function ( _factor , _rimA, _rimB) {
        return (_factor + _rimA) / (1. + (_rimA + _rimB));
 	},

    /**
     * Convert UV to viewport coordinates for display
     */
    uv2viewport: function(uv) {
        return new THREE.Vector2(
            uv.x * 2.0 - 1.0,  // 0-1 → -1 to +1
            uv.y * 2.0 - 1.0
        );
    },

    /**
     * Convert viewport coordinates back to UV
     */
    viewport2uv: function(coord) {
        return (coord + 1.0) * 0.5;  // -1 to +1 → 0-1
    },

    hasChanged: function ( ) {
        return this.hasItChanged;
	},

    hasGeometryChanged: function ( ) {
        return this.hasGeomChanged;
	},

    load: function ( _dim, _rim, _loadverts ) {
        this.executeCommand(new WARP.LoadLatticeCommand(_dim, _rim, _loadverts));
	},

	create: function ( _dim ) {
        this.executeCommand(new WARP.CreateLatticeCommand(_dim));
	},

    // Make a clone for undo purposes - compatibility method
    makeClone: function ( ) {
        // Command pattern handles this internally
    },

    undoLattice: function ( ) {
        if(this.commandHistory.undo(this.lattice)){
            this.hasItChanged = true;
            this.hasGeomChanged = true;
        }
	},

    redoLattice: function ( ) {
        if(this.commandHistory.redo(this.lattice)){
            this.hasItChanged = true;
            this.hasGeomChanged = true;
        }
	},

    draw: function ( _lattice_sketch, _drawMode, _cameraScale ) {
        WARP.LatticeQueries.draw(this.getCurrentLattice(), _lattice_sketch, _drawMode, _cameraScale);
        this.hasItChanged = false;
        this.hasGeomChanged = false;
	},

    hasSelection: function ( ) {
        return WARP.LatticeQueries.hasSelection(this.getCurrentLattice());
	},

	select: function ( ) {
        this.executeCommand(new WARP.SelectLatticeCommand(this.getCurrentLattice().pickrayindx, false));
	},

	selectAdd: function ( ) {
        this.executeCommand(new WARP.SelectLatticeCommand(this.getCurrentLattice().pickrayindx, true));
	},

    selectAll: function ( ) {
        this.executeCommand(new WARP.SelectAllLatticeCommand());
	},

	setVertice: function ( _point) {
        this.executeCommand(new WARP.MoveLatticeVerticesCommand(_point));
	},

	resetVertice: function ( ) {
        this.executeCommand(new WARP.ResetLatticeVerticesCommand());
	},

    /**
     * Pick ray for UV lattice
     * The lattice vertices are in viewport space (-1 to +1) just like mesh lattice
     * No transformation needed for picking
     */
	pickray: function ( _pickray ) {
        var prindex = WARP.LatticeQueries.pickRay(this.getCurrentLattice(), _pickray);
        
        if(prindex[0] != this.lastPickRayIndex[0] || prindex[1] != this.lastPickRayIndex[1]){
            this.hasItChanged = true;
        }
        this.lastPickRayIndex = prindex;
	}
};
