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
 
WARP.LatticeMngr = function ( manager ) {

	this.manager = 'default';
	this.lattice = new WARP.Lattice2D();
    this.commandHistory = new WARP.CommandHistory(20);

    this.hasItChanged = false;
	this.hasGeomChanged = false;

    this.lastPickRayIndex = [-1, -1];
    
    // Initialize with a default 3x3 lattice
    var cmd = new WARP.CreateLatticeCommand([3, 3, 0., 0., 0., 0.]);
    cmd.execute(this.lattice);
 };

WARP.LatticeMngr.prototype = {

	constructor: WARP.LatticeMngr,

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
            fout.writeline("ld " + this.getCurrentLattice().dim[0] + " " + this.getCurrentLattice().dim[1]);
            fout.writeline("lr " + this.getCurrentLattice().rimL + " " + this.getCurrentLattice().rimR+ " " + this.getCurrentLattice().rimT + " " + this.getCurrentLattice().rimB);
            for(var i = 0; i < this.getCurrentLattice().dim[0]; i++){
                for(var j = 0; j < this.getCurrentLattice().dim[1]; j++){
                    fout.writeline("lv " + this.getCurrentLattice().vertices[i][j].x + " " + this.getCurrentLattice().vertices[i][j].y + " " + this.getCurrentLattice().vertices[i][j].z);
                }
            }
            return true;
        }
        return false;
    },

    // modify the provided geometry
	modify: function ( _geometry, _force ) {
		if(this.hasItChanged || _force){
            _geometry.vertices_mod_lat = [];
            // loop through all the mesh vertices
            for (var x = 0; x < _geometry.vertices_mod.length; x++) {
                var vert = _geometry.vertices_mod[x];
                var bPoints = new Array(this.getCurrentLattice().dim[0]);
                // loop through all the x - dimensions of the lattice
                for (var i = 0; i < bPoints.length; i++) {
                    // compute new list of mesh vertice y - values
                    // pass the x(i) - row of all lattice vertices
                    bPoints[i] = this.computePoint(this.getCurrentLattice().vertices[i], this.vpc2normalized(vert.y, this.getCurrentLattice().rimB, this.getCurrentLattice().rimT));
                }
                var d2result = this.computePoint(bPoints, this.vpc2normalized(vert.x, this.getCurrentLattice().rimL, this.getCurrentLattice().rimR));
                _geometry.vertices_mod_lat.push(new THREE.Vector3( d2result.x, d2result.y, vert.z));
            }

            // calculate the cursor:
            //post("modify: " +_geometry.myCursor_mod + "\n");
            var crsr = _geometry.myCursor_mod;
            var bPoints = new Array(this.getCurrentLattice().dim[0]);
            for (var i = 0; i < bPoints.length; i++) {
                bPoints[i] = this.computePoint(this.getCurrentLattice().vertices[i], this.vpc2normalized(crsr.y, this.getCurrentLattice().rimB, this.getCurrentLattice().rimT));
            }
            //var retrn = this.computePoint(bPoints, this.vpc2normalized(crsr.x));
            _geometry.myCursor_mod_lat = this.computePoint(bPoints, this.vpc2normalized(crsr.x, this.getCurrentLattice().rimL, this.getCurrentLattice().rimR));
            //post("mod cursor: x = " +crsr.x + " y = " +crsr.y + "\n");
            //post("mod lat cursor: x = " +_geometry.myCursor_mod_lat.x + " y = " +_geometry.myCursor_mod_lat.y + "\n");
        }
        //post("this.getCurrentLattice().rimL = " +this.getCurrentLattice().rimL + "\n");

 	},

    // private helper function of the modify function
    // _vertList: is a list of 2 dimensional vertices (vectors)
    // _w       : is the linear interpolant (scalar)
    // returns a single vector representing the linear interpolation
	computePoint: function ( _vertList, _w ) {
		var out;
        // reduction loop. starts with all the vertices
		for (var i = _vertList.length - 1; i > 0; i--) {
			var lerped = new Array(i);
            // and linear interpolates each one with all the others with the interpolant
		  	for (var p = 0; p < i; p++) {
				lerped[p] = _vertList[p].clone().lerp(_vertList[p + 1], _w);
//				lerped[p] = this.lerp(_vertList[p].clone(), _vertList[p + 1], _w);
		  	}
            // this reults in a new list (lerped) of vectors with the lerped_size = previous_size - 1
		  	_vertList = lerped;
            // stores the final value of the last iteration
			if (_vertList.length == 1)
                out = _vertList[0];
		}
		return out;
	},

    lerp: function(_vec1, _vec2, _alpha){
        //_vec1.x += ( _vec2.x  - _vec1.x) * Math.exp(-((_vec1.x - _alpha)*(_alpha + _vec2.x))/2) * _alpha;
        //_vec1.y += ( _vec2.y  - _vec1.y) * Math.exp(-((_vec1.y - _alpha)*(_alpha + _vec2.y))/2) * _alpha;
        _vec1.x += ( _vec2.x  - _vec1.x) * ((1 - Math.abs(_vec1.x - _alpha))^2 + (_vec2.x - _alpha)^2);
        _vec1.y += ( _vec2.y  - _vec1.y) * ((_vec1.y - _alpha)^2 + (_vec2.y - _alpha)^2);

        return _vec1;
    },

    // private helper function of the modify function
	vpc2normalized: function ( _factor , _rimA, _rimB) {
        //post("_rim = " +_rim + "\n");
        return (_factor + 1. + _rimA)/ (2. + (_rimA + _rimB));
 		//return (_factor + 1.2)/ (2.4);
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

    // called when jumping into a modify mode - no longer needed with command pattern
    makeClone: function ( ) {
        // This method is kept for compatibility but doesn't need to do anything
        // The command pattern handles cloning internally
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

    draw: function ( _lattice_sketch, _drawMode ) {
        WARP.LatticeQueries.draw(this.getCurrentLattice(), _lattice_sketch, _drawMode);
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

	pickray: function ( _pickray ) {
        var prindex = WARP.LatticeQueries.pickRay(this.getCurrentLattice(), _pickray);
        if(prindex[0]*5 + prindex[1] !=  this.lastPickRayIndex[0]*5 + this.lastPickRayIndex[1]){
            this.hasItChanged = true;
        }
        this.lastPickRayIndex = prindex;
 	}
};
