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
 * Lattice Queries
 * Non-modifying operations on lattice data
 */
WARP.LatticeQueries = {
    
    /**
     * Check if lattice has selected vertices
     */
    hasSelection: function(lattice) {
        return lattice.hasSelectedVertices > 0;
    },
    
    /**
     * Pick ray against lattice vertices
     */
    pickRay: function(lattice, pickRay) {
        var distance = 10000000;
        var bestIndex = [-1, -1];
        
        for(var i = 0; i < lattice.dim[0]; i++){
            for(var j = 0; j < lattice.dim[1]; j++){
                var dist = pickRay.distanceToPoint(lattice.vertices[i][j]);
                if(dist < distance){
                    distance = dist;
                    bestIndex = [i, j];
                }
            }
        }
        
        lattice.pickrayindx = bestIndex;
        return bestIndex;
    },
    
    /**
     * Draw lattice
     */
    draw: function(lattice, latticeSketch, drawMode) {
        latticeSketch.glpointsize(10.);
        
        for(var i = 0; i < lattice.dim[0]; i++){
            for(var j = 0; j < lattice.dim[1]; j++){
                latticeSketch.glcolor(1., 0., 0., 1.);
                
                // Draw lines
                if(j < lattice.dim[1] - 1){
                    latticeSketch.linesegment(
                        lattice.vertices[i][j].x, lattice.vertices[i][j].y, lattice.vertices[i][j].z,
                        lattice.vertices[i][j+1].x, lattice.vertices[i][j+1].y, lattice.vertices[i][j+1].z
                    );
                }
                if(i < lattice.dim[0] - 1){
                    latticeSketch.linesegment(
                        lattice.vertices[i][j].x, lattice.vertices[i][j].y, lattice.vertices[i][j].z,
                        lattice.vertices[i+1][j].x, lattice.vertices[i+1][j].y, lattice.vertices[i+1][j].z
                    );
                }
                
                // Draw points in edit mode
                if(drawMode == 'edit'){
                    latticeSketch.glcolor(1., 0., 0., 1.);
                    latticeSketch.moveto(lattice.vertices[i][j].x, lattice.vertices[i][j].y, lattice.vertices[i][j].z);
                    latticeSketch.sphere(0.02);
                    
                    // Highlight picked vertex
                    if(lattice.pickrayindx[0] == i && lattice.pickrayindx[1] == j){
                        latticeSketch.glcolor(0.9, 0., 0., 1.);
                        latticeSketch.moveto(lattice.vertices[i][j].x, lattice.vertices[i][j].y, lattice.vertices[i][j].z);
                        latticeSketch.sphere(0.02);
                    }
                    
                    // Highlight selected vertices
                    if(lattice.selectedVertices[i][j] == 1){
                        latticeSketch.glcolor(0., 0., 0., 1.);
                        latticeSketch.moveto(lattice.vertices[i][j].x, lattice.vertices[i][j].y, lattice.vertices[i][j].z);
                        latticeSketch.sphere(0.03);
                    }
                }
            }
        }
        
        latticeSketch.layer = (drawMode == 'edit') ? 30 : 20;
    },
    
    /**
     * Debug function to reflect lattice data
     */
    reflect: function(lattice) {
        post("dim[0] = " + lattice.dim[0] + "\n");
        post("dim[1] = " + lattice.dim[1] + "\n");
        for(var i = 0; i < lattice.dim[0]; i++){
            for(var j = 0; j < lattice.dim[1]; j++){
                post("vertices["+i+"]["+j+"] = " + lattice.vertices[i][j].x + " | " + lattice.vertices[i][j].y + " | " + lattice.vertices[i][j].z + "\n");
            }
        }
    }
};
