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
 * Geometry Queries
 * Non-modifying operations on geometry data
 */
WARP.GeometryQueries = {
    
    /**
     * Check if geometry has selected vertices
     */
    hasSelection: function(geometry) {
        return (geometry.hasSelectedVertices > 0) ? true : false;
    },
    
    /**
     * Pick ray against vertices
     */
    pickRay: function(geometry, pickRay) {
        var distance = 10000000;
        var bestIndex = -1;
        
        for(var j = 0; j < geometry.vertices.length; j++){
            var dist = pickRay.distanceToPoint(geometry.vertices[j]);
            if(dist < distance){
                distance = dist;
                bestIndex = j;
            }
        }
        
        geometry.pickRayIndx = bestIndex;
        return bestIndex;
    },
    
    /**
     * Pick ray against lattice-modified vertices
     */
    pickRayLattice: function(geometry, pickRay) {
        var distance = 10000000;
        var bestIndex = -1;
        
        for(var j = 0; j < geometry.vertices_mod_lat.length; j++){
            var dist = pickRay.distanceToPoint(geometry.vertices_mod_lat[j]);
            if(dist < distance){
                distance = dist;
                bestIndex = j;
            }
        }
        
        geometry.pickRayIndx = bestIndex;
        return bestIndex;
    },

    
    /**
     * Get list of selected vertices for a store index
     */
    getSelectStoreList: function(geometry, storeIndex) {
        var storeList = "";
        if(storeIndex < geometry.selectedStore.length && geometry.selectedStore[storeIndex] != null){
            for(var j = 0; j < geometry.selectedStore[storeIndex].length; j++){
                storeList = storeList + " " + (geometry.selectedStore[storeIndex][j] + 1);
            }
        }
        return storeList;
    },
    
    /**
     * Check if a point is inside a triangle
     */
    pointInTriangle: function(p, v0, v1, v2){
        var b1, b2, b3 = false;
        
        b1 = (this.sign(p, v0, v1) < 0.0) ? true : false;
        b2 = (this.sign(p, v1, v2) < 0.0) ? true : false;
        b3 = (this.sign(p, v2, v0) < 0.0) ? true : false;
        
        return ((b1 == b2) && (b2 == b3));
    },
    
    /**
     * Helper function for pointInTriangle
     */
    sign: function(p1, p2, p3){
        return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
    },
    
    /**
     * Get barycentric coordinates of a point within a triangle
     */
    getBarycentricCoordinates: function(p, v0, v1, v2){
        // Based on algorithm from:
        // http://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-rendering-a-triangle/barycentric-coordinates
        
        // Compute plane's normal
        var v0v1 = v1.clone().sub(v0);
        var v0v2 = v2.clone().sub(v0);
        // No need to normalize
        var N = v0v1.cross(v0v2);
        var area2 = N.length();
        
        // Create a ray that is perpendicular to the x-y plane
        var NdotRayDirection = new THREE.Vector3(0, 0, 1);
        
        // Compute d parameter using equation 2
        var d = N.clone().dot(v0);
        
        // Compute t (equation 3)
        var t = (N.clone().dot(p) + d) / NdotRayDirection;
        
        // Compute the intersection point using equation 1
        var P = p.clone().add(NdotRayDirection.clone().multiplyScalar(t));
        
        // Edge 1
        var edge1 = v2.clone().sub(v1);
        var vp1 = P.clone().sub(v1);
        var C = edge1.cross(vp1);
        var u = C.length() / area2;
        
        // Edge 2
        var edge2 = v0.clone().sub(v2);
        var vp2 = P.clone().sub(v2);
        C = edge2.cross(vp2);
        var v = C.length() / area2;
        
        var w = 1 - u - v;
        
        return new Array(u, v, w);
    },
    
    /**
     * Generate matrix from geometry for rendering
     */
    generateMatrix: function(geometry, meshMatrix, subDiv, color) {
        // Calculate total vertices needed, accounting for quads vs triangles
        var totalVertices = 0;
        for(var j = 0; j < geometry.faces.length; j++) {
            var face = geometry.faces[j];
            if(face.isQuad) {
                // Quad: subdivides to 4^subDiv quads, each triangulated to 2 triangles (6 vertices)
                totalVertices += 6 * Math.pow(4, subDiv);
            } else {
                // Triangle: subdivides to 4^subDiv triangles (3 vertices each)
                totalVertices += 3 * Math.pow(4, subDiv);
            }
        }
        
        meshMatrix.dim = totalVertices;
        var offset = 0;
        for(var j = 0; j < geometry.faces.length; j++) {
            offset += geometry.faces[j].populate(meshMatrix, offset, subDiv, geometry.vertices_mod_lat, geometry.uvs_mod, geometry.normals, color);
        }
        return meshMatrix;
    },
    
    /**
     * Draw geometry
     */
    draw: function(geometry, latticeSketch, drawMode, modFlag) {
        latticeSketch.glcolor(0., 0.8, 0., 1.);
        latticeSketch.glpointsize(10.);
        latticeSketch.gllinewidth(2.0);
        
        // Draw first the faces and lines
        for(var i = 0; i < geometry.faces.length; i++){
            var useVertice;
            if(modFlag == 1){
                useVertice = geometry.vertices_mod;
            } else if(modFlag == 2){
                useVertice = geometry.vertices_mod_lat;
            } else {
                useVertice = geometry.vertices;
            }
            
            var face = geometry.faces[i];
            
            if(face.isQuad) {
                // For quads: draw all 4 edges + diagonal B-D to match triangulation (A-B-D and B-C-D)
                latticeSketch.linesegment(useVertice[face.vertA].x, useVertice[face.vertA].y, useVertice[face.vertA].z, useVertice[face.vertB].x, useVertice[face.vertB].y, useVertice[face.vertB].z);
                latticeSketch.linesegment(useVertice[face.vertB].x, useVertice[face.vertB].y, useVertice[face.vertB].z, useVertice[face.vertC].x, useVertice[face.vertC].y, useVertice[face.vertC].z);
                latticeSketch.linesegment(useVertice[face.vertC].x, useVertice[face.vertC].y, useVertice[face.vertC].z, useVertice[face.vertD].x, useVertice[face.vertD].y, useVertice[face.vertD].z);
                latticeSketch.linesegment(useVertice[face.vertD].x, useVertice[face.vertD].y, useVertice[face.vertD].z, useVertice[face.vertA].x, useVertice[face.vertA].y, useVertice[face.vertA].z);
            } else {
                // For triangles: draw all 3 edges
                latticeSketch.linesegment(useVertice[face.vertA].x, useVertice[face.vertA].y, useVertice[face.vertA].z, useVertice[face.vertB].x, useVertice[face.vertB].y, useVertice[face.vertB].z);
                latticeSketch.linesegment(useVertice[face.vertB].x, useVertice[face.vertB].y, useVertice[face.vertB].z, useVertice[face.vertC].x, useVertice[face.vertC].y, useVertice[face.vertC].z);
                latticeSketch.linesegment(useVertice[face.vertA].x, useVertice[face.vertA].y, useVertice[face.vertA].z, useVertice[face.vertC].x, useVertice[face.vertC].y, useVertice[face.vertC].z);
            }
        }
        
        // Then draw the points
        if(drawMode == 'edit'){
            latticeSketch.layer = 30;
            
            for(var j = 0; j < geometry.vertices.length; j++){

                // If no selection, draw it normally
                latticeSketch.glcolor(0., 0.6, 0., 1.);
                if(modFlag == 1)
                    latticeSketch.moveto(geometry.vertices_mod[j].x, geometry.vertices_mod[j].y, geometry.vertices_mod[j].z);
                else if(modFlag == 2)
                    latticeSketch.moveto(geometry.vertices_mod_lat[j].x, geometry.vertices_mod_lat[j].y, geometry.vertices_mod_lat[j].z);
                else
                    latticeSketch.moveto(geometry.vertices[j].x, geometry.vertices[j].y, geometry.vertices[j].z);
                latticeSketch.circle(0.02);

                if(geometry.pickRayIndx == j){
                    latticeSketch.glcolor(0., 0.9, 0., 1.);
                    if(modFlag == 1)
                        latticeSketch.moveto(geometry.vertices_mod[j].x, geometry.vertices_mod[j].y, geometry.vertices_mod[j].z);
                    else if(modFlag == 2)
                        latticeSketch.moveto(geometry.vertices_mod_lat[j].x, geometry.vertices_mod_lat[j].y, geometry.vertices_mod_lat[j].z);
                    else
                        latticeSketch.moveto(geometry.vertices[j].x, geometry.vertices[j].y, geometry.vertices[j].z);
                    latticeSketch.circle(0.025);
                }
                
                // Draw selected point
                if(geometry.selectedVertices[j] == 1){
                    latticeSketch.glcolor(0., 1., 0., 1.);
                    if(modFlag == 1){
                        latticeSketch.moveto(geometry.vertices_mod[j].x, geometry.vertices_mod[j].y, geometry.vertices_mod[j].z);
                    } else if(modFlag == 2){
                        latticeSketch.moveto(geometry.vertices_mod_lat[j].x, geometry.vertices_mod_lat[j].y, geometry.vertices_mod_lat[j].z);
                    } else {
                        latticeSketch.moveto(geometry.vertices[j].x, geometry.vertices[j].y, geometry.vertices[j].z);
                    }
                    latticeSketch.circle(0.02);
                } 
            }
            
            // Draw cursor
            var useCursor;
            if(modFlag == 1){
                useCursor = geometry.myCursor_mod;
            } else if(modFlag == 2){
                useCursor = geometry.myCursor_mod_lat;
            } else {
                useCursor = geometry.myCursor;
            }
            latticeSketch.glcolor(0., 0., 0., 1.);
            latticeSketch.linesegment(useCursor.x - 0.06, useCursor.y, useCursor.z, useCursor.x + 0.06, useCursor.y, useCursor.z);
            latticeSketch.linesegment(useCursor.x, useCursor.y - 0.06, useCursor.z, useCursor.x, useCursor.y + 0.06, useCursor.z);
            latticeSketch.moveto(useCursor.x, useCursor.y, useCursor.z);
            latticeSketch.gllinewidth(2.0);
            latticeSketch.framecircle(.05);
            
            latticeSketch.glcolor(0.7, 0.0, 0.7, 1.);
        } else {
            latticeSketch.layer = 20;
            latticeSketch.glcolor(0.3, 0.3, 0.3, 1.);
        }
    },
    
    /**
     * UV QUERIES
     * UV-specific query operations
     */
    
    /**
     * Check if geometry has selected UVs
     */
    hasUVSelection: function(geometry) {
        return (geometry.hasSelectedUVs > 0) ? true : false;
    },
    
    /**
     * Pick ray against UVs (in viewport space)
     * UVs need to be converted to viewport coordinates for picking
     */
    pickRayUV: function(geometry, pickRay) {
        var distance = 10000000;
        var bestIndex = -1;
        
        for(var j = 0; j < geometry.uvs.length; j++){
            // Convert UV to viewport coordinates
            var uvViewport = new THREE.Vector3(
                geometry.uvs[j].x * 2.0 - 1.0,
                geometry.uvs[j].y * 2.0 - 1.0,
                0
            );
            var dist = pickRay.distanceToPoint(uvViewport);
            if(dist < distance){
                distance = dist;
                bestIndex = j;
            }
        }
        
        geometry.pickRayUVIndx = bestIndex;
        return bestIndex;
    },
    
    /**
     * Pick ray against lattice-modified UVs
     */
    pickRayUVLattice: function(geometry, pickRay) {
        var distance = 10000000;
        var bestIndex = -1;
        
        for(var j = 0; j < geometry.uvs_mod_lat.length; j++){
            // Convert UV to viewport coordinates
            var uvViewport = new THREE.Vector3(
                geometry.uvs_mod_lat[j].x * 2.0 - 1.0,
                geometry.uvs_mod_lat[j].y * 2.0 - 1.0,
                0
            );
            var dist = pickRay.distanceToPoint(uvViewport);
            if(dist < distance){
                distance = dist;
                bestIndex = j;
            }
        }
        
        geometry.pickRayUVIndx = bestIndex;
        return bestIndex;
    },
    
    /**
     * Get list of selected UVs for a store index
     */
    getUVSelectStoreList: function(geometry, storeIndex) {
        var storeList = "";
        if(storeIndex < geometry.selectedUVStore.length && geometry.selectedUVStore[storeIndex] != null){
            for(var j = 0; j < geometry.selectedUVStore[storeIndex].length; j++){
                storeList = storeList + " " + (geometry.selectedUVStore[storeIndex][j] + 1);
            }
        }
        return storeList;
    },
    
    /**
     * Generate matrix with lattice-modified UVs
     */
    generateUVMatrix: function(geometry, meshMatrix, subDiv, color) {
        // Calculate total vertices needed, accounting for quads vs triangles
        var totalVertices = 0;
        for(var j = 0; j < geometry.faces.length; j++) {
            var face = geometry.faces[j];
            if(face.isQuad) {
                // Quad: subdivides to 4^subDiv quads, each triangulated to 2 triangles (6 vertices)
                totalVertices += 6 * Math.pow(4, subDiv);
            } else {
                // Triangle: subdivides to 4^subDiv triangles (3 vertices each)
                totalVertices += 3 * Math.pow(4, subDiv);
            }
        }
        
        meshMatrix.dim = totalVertices;
        var offset = 0;
        for(var j = 0; j < geometry.faces.length; j++) {
            offset += geometry.faces[j].populate(meshMatrix, offset, subDiv, geometry.vertices_mod_lat, geometry.uvs_mod_lat, geometry.normals, color);
        }
        return meshMatrix;
    },
    
    /**
     * Draw UVs in viewport
     * modFlag: 0 = original, 1 = modified, 2 = lattice-modified
     */
    drawUV: function(geometry, latticeSketch, drawMode, modFlag) {
        latticeSketch.glcolor(0.0, 0.7, 0.7, 1.);
        latticeSketch.glpointsize(10.);
        latticeSketch.gllinewidth(2.0);

        // Draw UV faces and lines
        for(var i = 0; i < geometry.faces.length; i++){
            var useUV;
            if(modFlag == 1){
                useUV = geometry.uvs_mod;
            } else if(modFlag == 2){
                useUV = geometry.uvs_mod_lat;
            } else {
                useUV = geometry.uvs;
            }
            
            var face = geometry.faces[i];
            
            // Convert UV coordinates to viewport for drawing
            var uvA = new THREE.Vector2(useUV[face.uvA].x * 2.0 - 1.0, useUV[face.uvA].y * 2.0 - 1.0);
            var uvB = new THREE.Vector2(useUV[face.uvB].x * 2.0 - 1.0, useUV[face.uvB].y * 2.0 - 1.0);
            var uvC = new THREE.Vector2(useUV[face.uvC].x * 2.0 - 1.0, useUV[face.uvC].y * 2.0 - 1.0);
            
            if(face.isQuad) {
                // For quads: draw all 4 edges (no diagonal needed for UV display)
                var uvD = new THREE.Vector2(useUV[face.uvD].x * 2.0 - 1.0, useUV[face.uvD].y * 2.0 - 1.0);
                latticeSketch.linesegment(uvA.x, uvA.y, 0, uvB.x, uvB.y, 0);
                latticeSketch.linesegment(uvB.x, uvB.y, 0, uvC.x, uvC.y, 0);
                latticeSketch.linesegment(uvC.x, uvC.y, 0, uvD.x, uvD.y, 0);
                latticeSketch.linesegment(uvD.x, uvD.y, 0, uvA.x, uvA.y, 0);
            } else {
                // For triangles: draw all 3 edges
                latticeSketch.linesegment(uvA.x, uvA.y, 0, uvB.x, uvB.y, 0);
                latticeSketch.linesegment(uvB.x, uvB.y, 0, uvC.x, uvC.y, 0);
                latticeSketch.linesegment(uvA.x, uvA.y, 0, uvC.x, uvC.y, 0);
            }
        }
        
        // Draw UV points
        if(drawMode == 'edit'){
            latticeSketch.layer = 30;
            
            for(var j = 0; j < geometry.uvs.length; j++){
                var useUV;
                if(modFlag == 1)
                    useUV = geometry.uvs_mod[j];
                else if(modFlag == 2)
                    useUV = geometry.uvs_mod_lat[j];
                else
                    useUV = geometry.uvs[j];
                
                // Convert to viewport coordinates
                var uvViewport = new THREE.Vector2(useUV.x * 2.0 - 1.0, useUV.y * 2.0 - 1.0);
                
                // Normal point
                latticeSketch.glcolor(0.0, 0.7, 0.7, 1.);
                latticeSketch.moveto(uvViewport.x, uvViewport.y, 0);
                latticeSketch.circle(0.02);
                
                // Highlighted point under cursor
                if(geometry.pickRayUVIndx == j){
                    latticeSketch.glcolor(0.0, 0.9, 0.9, 1.);
                    latticeSketch.moveto(uvViewport.x, uvViewport.y, 0);
                    latticeSketch.circle(0.025);
                }
                
                // Selected point
                if(geometry.selectedUVs[j] == 1){
                    latticeSketch.glcolor(0.0, 1.0, 1.0, 1.);
                    latticeSketch.moveto(uvViewport.x, uvViewport.y, 0);
                    latticeSketch.circle(0.02);
                }
            }
            
            // Draw UV cursor
            var useCursor;
            if(modFlag == 1){
                useCursor = geometry.myUVCursor_mod;
            } else if(modFlag == 2){
                useCursor = geometry.myUVCursor_mod_lat;
            } else {
                useCursor = geometry.myUVCursor;
            }
            
            // Convert cursor to viewport
            var cursorViewport = new THREE.Vector2(useCursor.x * 2.0 - 1.0, useCursor.y * 2.0 - 1.0);
            
            latticeSketch.glcolor(0.7, 0.7, 0., 1.);
            latticeSketch.linesegment(cursorViewport.x - 0.06, cursorViewport.y, 0, cursorViewport.x + 0.06, cursorViewport.y, 0);
            latticeSketch.linesegment(cursorViewport.x, cursorViewport.y - 0.06, 0, cursorViewport.x, cursorViewport.y + 0.06, 0);
            latticeSketch.moveto(cursorViewport.x, cursorViewport.y, 0);
            latticeSketch.gllinewidth(2.0);
            latticeSketch.framecircle(.05);
            
            latticeSketch.glcolor(0.9, 0.5, 0., 1.);
        } else {
            latticeSketch.layer = 20;
            latticeSketch.glcolor(0.3, 0.3, 0.3, 1.);
        }
    }
};
