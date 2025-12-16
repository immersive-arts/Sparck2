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
 
WARP.Face3 = function ( _vertA, _vertB, _vertC, _uvA, _uvB, _uvC, _normA, _normB, _normC) {

	this.vertA = _vertA;
	this.vertB = _vertB;
	this.vertC = _vertC;

    this.uvA = _uvA;
    this.uvB = _uvB;
    this.uvC = _uvC;

    this.normA = _normA;
    this.normB = _normB;
    this.normC = _normC;

};

WARP.Face3.prototype = {

	constructor: WARP.Face3,

	populate: function ( _meshMatrix, _idx, _subDiv, _vertices, _uvs, _normals, _color ) {
            var vA = _vertices[this.vertA];
            var vB = _vertices[this.vertB];
            var vC = _vertices[this.vertC];
            var uA = _uvs[this.uvA];
            var uB = _uvs[this.uvB];
            var uC = _uvs[this.uvC];
            var nA = _normals[this.normA];
            var nB = _normals[this.normB];
            var nC = _normals[this.normC];
            if(nA == null){
                nA = new THREE.Vector3( 0, 0, 1);
                nB = nA;
                nC = nA;
            }
            if(_color == null){
                _color = [1.0, 1.0, 1.0, 1.0];
            }
            
            // If no subdivision, output the triangle directly
            if(_subDiv <= 0){
                _meshMatrix.setcell(_idx + 0,"val",vA.x, vA.y, vA.z, uA.x, uA.y, nA.x, nA.y, nA.z, _color[0], _color[1], _color[2], _color[3]);
                _meshMatrix.setcell(_idx + 1,"val",vB.x, vB.y, vB.z, uB.x, uB.y, nB.x, nB.y, nB.z, _color[0], _color[1], _color[2], _color[3]);
                _meshMatrix.setcell(_idx + 2,"val",vC.x, vC.y, vC.z, uC.x, uC.y, nC.x, nC.y, nC.z, _color[0], _color[1], _color[2], _color[3]);
            } else {
                // Subdivide the triangle
                this._subdivideAndPopulate(_meshMatrix, _idx, _subDiv, vA, vB, vC, uA, uB, uC, nA, nB, nC, _color);
            }
	},
    
    /**
     * Recursively subdivide a triangle and populate the matrix
     * Uses midpoint subdivision to create 4 sub-triangles per level
     */
    _subdivideAndPopulate: function(_meshMatrix, _startIdx, _level, vA, vB, vC, uA, uB, uC, nA, nB, nC, _color) {
        if(_level <= 0) {
            // Base case: write the triangle to the matrix
            _meshMatrix.setcell(_startIdx + 0, "val", vA.x, vA.y, vA.z, uA.x, uA.y, nA.x, nA.y, nA.z, _color[0], _color[1], _color[2], _color[3]);
            _meshMatrix.setcell(_startIdx + 1, "val", vB.x, vB.y, vB.z, uB.x, uB.y, nB.x, nB.y, nB.z, _color[0], _color[1], _color[2], _color[3]);
            _meshMatrix.setcell(_startIdx + 2, "val", vC.x, vC.y, vC.z, uC.x, uC.y, nC.x, nC.y, nC.z, _color[0], _color[1], _color[2], _color[3]);
            return 3; // Return number of vertices written
        }
        
        // Calculate midpoints for vertices
        var vAB = new THREE.Vector3(
            (vA.x + vB.x) * 0.5,
            (vA.y + vB.y) * 0.5,
            (vA.z + vB.z) * 0.5
        );
        var vBC = new THREE.Vector3(
            (vB.x + vC.x) * 0.5,
            (vB.y + vC.y) * 0.5,
            (vB.z + vC.z) * 0.5
        );
        var vCA = new THREE.Vector3(
            (vC.x + vA.x) * 0.5,
            (vC.y + vA.y) * 0.5,
            (vC.z + vA.z) * 0.5
        );
        
        // Calculate midpoints for UVs
        var uAB = new THREE.Vector2(
            (uA.x + uB.x) * 0.5,
            (uA.y + uB.y) * 0.5
        );
        var uBC = new THREE.Vector2(
            (uB.x + uC.x) * 0.5,
            (uB.y + uC.y) * 0.5
        );
        var uCA = new THREE.Vector2(
            (uC.x + uA.x) * 0.5,
            (uC.y + uA.y) * 0.5
        );
        
        // Calculate midpoints for normals (and normalize)
        var nAB = new THREE.Vector3(
            (nA.x + nB.x) * 0.5,
            (nA.y + nB.y) * 0.5,
            (nA.z + nB.z) * 0.5
        );
        nAB.normalize();
        
        var nBC = new THREE.Vector3(
            (nB.x + nC.x) * 0.5,
            (nB.y + nC.y) * 0.5,
            (nB.z + nC.z) * 0.5
        );
        nBC.normalize();
        
        var nCA = new THREE.Vector3(
            (nC.x + nA.x) * 0.5,
            (nC.y + nA.y) * 0.5,
            (nC.z + nA.z) * 0.5
        );
        nCA.normalize();
        
        // Recursively subdivide the 4 sub-triangles
        var nextLevel = _level - 1;
        var offset = 0;
        
        // Triangle 1: A - AB - CA
        offset += this._subdivideAndPopulate(_meshMatrix, _startIdx + offset, nextLevel, 
            vA, vAB, vCA, uA, uAB, uCA, nA, nAB, nCA, _color);
        
        // Triangle 2: AB - B - BC
        offset += this._subdivideAndPopulate(_meshMatrix, _startIdx + offset, nextLevel, 
            vAB, vB, vBC, uAB, uB, uBC, nAB, nB, nBC, _color);
        
        // Triangle 3: CA - BC - C
        offset += this._subdivideAndPopulate(_meshMatrix, _startIdx + offset, nextLevel, 
            vCA, vBC, vC, uCA, uBC, uC, nCA, nBC, nC, _color);
        
        // Triangle 4: AB - BC - CA (center triangle)
        offset += this._subdivideAndPopulate(_meshMatrix, _startIdx + offset, nextLevel, 
            vAB, vBC, vCA, uAB, uBC, uCA, nAB, nBC, nCA, _color);
        
        return offset; // Return total number of vertices written
    },

    clone: function ( ) {
        var clon = new WARP.Face3();

       	clon.vertA = this.vertA;
        clon.vertB = this.vertB;
        clon.vertC = this.vertC;

        clon.uvA = this.uvA;
        clon.uvB = this.uvB;
        clon.uvC = this.uvC;

        clon.normA = this.normA;
        clon.normB = this.normB;
        clon.normC = this.normC;

        return clon;
    }
};
