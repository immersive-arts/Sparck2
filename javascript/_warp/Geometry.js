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
 
WARP.Geometry = function () {
	this.vertices = []; // original vertice
	this.vertices_mod = []; // modified vertice
    this.vertices_mod_lat = []; // modified and latticed deformed vertice
    this.vertices_mod_tmp = []; // modified vertice temporary storage

    this.uvs = []; // original uv
	this.uvs_mod = []; // modified uvs
    this.uvs_mod_lat = []; // modified and latticed deformed uvs
    this.uvs_mod_tmp = []; // modified uvs temporary storage
	this.normals = [];
	this.faces = [];

    this.selectedVertices = [];
    this.hasSelectedVertices = -1;

    this.selectedUVs = []; // selected UV vertices
    this.hasSelectedUVs = -1;

    this.selectedStore = []; // selected vertices storage
    this.selectedUVStore = []; // selected UV storage

    this.pickRayIndx = -1;
    this.pickRayUVIndx = -1;

    this.myCursor = new THREE.Vector3(0, 0, 0);
    this.myCursor_mod = new THREE.Vector3(0, 0, 0);
    this.myCursor_mod_lat = new THREE.Vector3(0, 0, 0);
    
    this.myUVCursor = new THREE.Vector2(0.5, 0.5);
    this.myUVCursor_mod = new THREE.Vector2(0.5, 0.5);
    this.myUVCursor_mod_lat = new THREE.Vector2(0.5, 0.5);
};

WARP.Geometry.prototype = {

	constructor: WARP.Geometry,

    /**
     * Clone the geometry
     * This is the only method that remains - pure data operation
     */
    clone: function ( ) {
        var clon = new WARP.Geometry();

        clon.vertices = new Array( this.vertices.length );
        for(var i = 0; i < this.vertices.length; i++){
            clon.vertices[i] = this.vertices[i].clone();
        }

        clon.vertices_mod = new Array( this.vertices_mod.length );
        for(var i = 0; i < this.vertices_mod.length; i++){
            clon.vertices_mod[i] = this.vertices_mod[i].clone();
        }

        clon.vertices_mod_lat = new Array( this.vertices_mod_lat.length );
        for(var i = 0; i < this.vertices_mod_lat.length; i++){
            clon.vertices_mod_lat[i] = this.vertices_mod_lat[i].clone();
        }

        clon.vertices_mod_tmp = new Array( this.vertices_mod_tmp.length );
        for(var i = 0; i < this.vertices_mod_tmp.length; i++){
            clon.vertices_mod_tmp[i] = this.vertices_mod_tmp[i].clone();
        }

        clon.uvs = new Array( this.uvs.length );
        for(var i = 0; i < this.uvs.length; i++){
            clon.uvs[i] = this.uvs[i].clone();
        }

        clon.uvs_mod = new Array( this.uvs_mod.length );
        for(var i = 0; i < this.uvs_mod.length; i++){
            clon.uvs_mod[i] = this.uvs_mod[i].clone();
        }

        clon.uvs_mod_lat = new Array( this.uvs_mod_lat.length );
        for(var i = 0; i < this.uvs_mod_lat.length; i++){
            clon.uvs_mod_lat[i] = this.uvs_mod_lat[i].clone();
        }

        clon.uvs_mod_tmp = new Array( this.uvs_mod_tmp.length );
        for(var i = 0; i < this.uvs_mod_tmp.length; i++){
            clon.uvs_mod_tmp[i] = this.uvs_mod_tmp[i].clone();
        }

        clon.normals = new Array( this.normals.length );
        for(var i = 0; i < this.normals.length; i++){
            clon.normals[i] = this.normals[i].clone();
        }

        clon.faces = new Array( this.faces.length );
        for(var i = 0; i < this.faces.length; i++){
            clon.faces[i] = this.faces[i].clone();
        }

        clon.selectedVertices = this.selectedVertices.slice(0,this.selectedVertices.length);

        clon.hasSelectedVertices = this.hasSelectedVertices;

        clon.selectedUVs = this.selectedUVs.slice(0,this.selectedUVs.length);

        clon.hasSelectedUVs = this.hasSelectedUVs;

        clon.selectedStore = new Array(this.selectedStore.length);
        for(var i = 0; i < this.selectedStore.length; i++){
            if(this.selectedStore[i] != null)
                clon.selectedStore[i] = this.selectedStore[i].slice(0);
        }

        clon.selectedUVStore = new Array(this.selectedUVStore.length);
        for(var i = 0; i < this.selectedUVStore.length; i++){
            if(this.selectedUVStore[i] != null)
                clon.selectedUVStore[i] = this.selectedUVStore[i].slice(0);
        }

        clon.myCursor = new THREE.Vector3(this.myCursor.x, this.myCursor.y, this.myCursor.z);
        clon.myCursor_mod = new THREE.Vector3(this.myCursor_mod.x, this.myCursor_mod.y, this.myCursor_mod.z);
        clon.myCursor_mod_lat = new THREE.Vector3(this.myCursor_mod_lat.x, this.myCursor_mod_lat.y, this.myCursor_mod_lat.z);
        
        clon.myUVCursor = new THREE.Vector2(this.myUVCursor.x, this.myUVCursor.y);
        clon.myUVCursor_mod = new THREE.Vector2(this.myUVCursor_mod.x, this.myUVCursor_mod.y);
        clon.myUVCursor_mod_lat = new THREE.Vector2(this.myUVCursor_mod_lat.x, this.myUVCursor_mod_lat.y);
        
        clon.pickRayIndx = this.pickRayIndx;
        clon.pickRayUVIndx = this.pickRayUVIndx;

        return clon;
    },

    /**
     * Apply matrix transformation to vertices
     * This is needed for the original transform functions
     */
    applyMatrix: function ( matrix ) {
		var normalMatrix = new THREE.Matrix3().getNormalMatrix( matrix );

		for ( var i = 0, il = this.vertices.length; i < il; i ++ ) {
			var vertex = this.vertices[ i ];
			vertex.applyMatrix4( matrix );
		}
	},

	rotateX: function () {
		// rotate geometry around world x-axis
		var m1;

		return function rotateX( angle ) {
			if ( m1 === undefined ) m1 = new THREE.Matrix4();
			m1.makeRotationX( angle );
			this.applyMatrix( m1 );
			return this;
		};
	}(),

	rotateY: function () {
		// rotate geometry around world y-axis
		var m1;

		return function rotateY( angle ) {
			if ( m1 === undefined ) m1 = new THREE.Matrix4();
			m1.makeRotationY( angle );
			this.applyMatrix( m1 );
			return this;
		};
	}(),

	rotateZ: function () {
		// rotate geometry around world z-axis
		var m1;

		return function rotateZ( angle ) {
			if ( m1 === undefined ) m1 = new THREE.Matrix4();
			m1.makeRotationZ( angle );
			this.applyMatrix( m1 );
			return this;
		};
	}(),

	translate: function () {
		// translate geometry
		var m1;

		return function translate( x, y, z ) {
			if ( m1 === undefined ) m1 = new THREE.Matrix4();
			m1.makeTranslation( x, y, z );
			this.applyMatrix( m1 );
			return this;
		};
	}(),

	scale: function () {
		// scale geometry
		var m1;

		return function scale( x, y, z ) {
			if ( m1 === undefined ) m1 = new THREE.Matrix4();
			m1.makeScale( x, y, z );
			this.applyMatrix( m1 );
			return this;
		};
	}()

};
