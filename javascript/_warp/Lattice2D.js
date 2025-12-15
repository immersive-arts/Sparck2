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
 
WARP.Lattice2D = function () {
    this.dim = [3, 3];
    this.rimL = 0.;
    this.rimR = 0.;
    this.rimT = 0.;
    this.rimB = 0.;
    this.vertices = [];   // two dimensional array
    this.selectedVertices = [];
    this.pickrayindx = [-1, -1];
    this.hasSelectedVertices = 0;
};

WARP.Lattice2D.prototype = {

	constructor: WARP.Lattice2D,

    /**
     * Clone the lattice
     * This is the only method that remains - pure data operation
     */
    clone: function ( ) {
        var newClone = new WARP.Lattice2D();
        newClone.dim = [this.dim[0], this.dim[1]];
        newClone.rimL = this.rimL;
        newClone.rimR = this.rimR;
        newClone.rimT = this.rimT;
        newClone.rimB = this.rimB;
        
        // Only clone vertices if they exist
        if(this.vertices && this.vertices.length > 0){
            newClone.vertices = new Array(this.dim[0]);
            newClone.selectedVertices = new Array(this.dim[0]);
            for (var i = 0; i < this.dim[0]; i++) {
                newClone.vertices[i] = new Array(this.dim[1]);
                newClone.selectedVertices[i] = new Array(this.dim[1]);
            }
            for(var i = 0; i < this.dim[0]; i++){
                for(var j = 0; j < this.dim[1]; j++){
                    newClone.vertices[i][j] = this.vertices[i][j].clone();
                    newClone.selectedVertices[i][j] = this.selectedVertices[i][j];
                }
            }
        } else {
            newClone.vertices = [];
            newClone.selectedVertices = [];
        }
        
        newClone.pickrayindx = [this.pickrayindx[0], this.pickrayindx[1]];
        newClone.hasSelectedVertices = this.hasSelectedVertices;
        return newClone;
    }
};
