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

autowatch = 1;

// set up inlets/outlets/assist strings
inlets = 1;
outlets = 3;

include("_three.js");
include("_gui.js");
include("_warp.js");
include("_draw.js");

var OUTLET_MESH = 0;
var OUTLET_WINDOW = 1;
var OUTLET_ERROR = 2;

var EDITMODE_LATTICE_SELECT = 0;
var EDITMODE_LATTICE_GRAB = 1;
var EDITMODE_MESH_SELECT = 5;
var EDITMODE_MESH_SELECT_STORE = 6;
var EDITMODE_MESH_GRAB = 10;
var EDITMODE_MESH_SCALE = 11;
var EDITMODE_MESH_ROTATE = 12;

// UV Edit Modes
var EDITMODE_UV_LATTICE_SELECT = 15;
var EDITMODE_UV_LATTICE_GRAB = 16;
var EDITMODE_UV_SELECT = 20;
var EDITMODE_UV_SELECT_STORE = 21;
var EDITMODE_UV_GRAB = 25;

var warploader = new WARP.WarpLoader();
var meshSaver = new WARP.OBJWriter();
var help = new DRAW.Warp2d_EditorHelper();
var pickRay = new THREE.Ray(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1));
var uiEvent = new GUI.UIEvent();
var editPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
var editModeHasChanged = false;


var editMode = EDITMODE_LATTICE_SELECT;
var lastEditMode = EDITMODE_LATTICE_SELECT;
var meshMngr = new WARP.MeshMngr();
var latticeMngr = new WARP.LatticeMngr();
var uvMeshMngr = null;  // Will be initialized with geometry
var uvLatticeMngr = new WARP.UVLatticeMngr();
var cameraMatrix = new THREE.Matrix4();
var editor_enable = 0;
var fileName;

// create our jitter objects
var latticeObj = null;
var cameraAnimNode = null;
var cameraObj = null;
var nodeObj = null;
var meshObj = null;
var meshMatrix = new JitterMatrix(12, "float32", 10);
var meshColor = [1.0, 0.0, 1.0, 1.0];

// global Function Key
var functionKey;
var lastMouse;

var lastPlacePoint;

var isInit = false;

//post("bs.warp2d.js newLoad\n");

function bang(){
	loadbang();
}

function loadbang(){
	post("v0.0.1");
	init();
}

function init(){
	if(isInit == false){
		// Initialize UV mesh manager with shared geometry
		uvMeshMngr = new WARP.UVMeshMngr(meshMngr.getCurrentMesh());
		
		nodeObj = new JitterObject("jit.gl.node","editor");
    	nodeObj.enable = editor_enable;
		cameraAnimNode = new JitterObject("jit.anim.node");
		cameraAnimNode.position = [0, 0, 3.0];
		cameraAnimNode.fsaa = 1;
		cameraObj = new JitterObject("jit.gl.camera");
		cameraObj.drawto = nodeObj.name;
		cameraObj.anim = cameraAnimNode.name;
    	cameraObj.enable = editor_enable;
   	    cameraObj.ortho = 1;
		latticeObj = new JitterObject("jit.gl.sketch");
		latticeObj.drawto = nodeObj.name;
		latticeObj.layer = 12;
    	latticeObj.enable = editor_enable;
        latticeObj.depth_enable = 0;
    	help.drawto(nodeObj.name);
    	help.enable(editor_enable);
    	help.printLATTICE_SELECT();
		meshObj = new JitterObject("jit.gl.mesh");
		meshObj.drawto = nodeObj.name;
		meshObj.layer = 11;
        meshObj.depth_enable = 0;
    	meshObj.enable = editor_enable;
		calcCameraMatrix();
    	isInit = true;

	    draw(false);
 	}
}

function enable(_enable){
    init();
	nodeObj.enable = _enable;
	cameraObj.enable = _enable;
	latticeObj.enable = _enable;
	meshObj.enable = _enable;
}

function update(){
    init();

    var force = false;
	// This method needs to be called at the beginning
	if(uiEvent.update_start()){
        if(uiEvent.mouseInWindows && uiEvent.mouseButtonPress == false && uiEvent.keyHit == true){
            // SHIFT+TAB: Toggle between mesh and UV editing domains
            if(uiEvent.special_ShiftKey && uiEvent.keyChar == 'tab'){
                if(editMode == EDITMODE_LATTICE_SELECT || editMode == EDITMODE_LATTICE_GRAB || 
                   editMode == EDITMODE_MESH_SELECT || editMode == EDITMODE_MESH_SELECT_STORE || 
                   editMode == EDITMODE_MESH_GRAB || editMode == EDITMODE_MESH_SCALE || editMode == EDITMODE_MESH_ROTATE){
                    // Switch to UV lattice mode
                    editMode = EDITMODE_UV_LATTICE_SELECT;
                    help.printUV_LATTICE_SELECT();
                } else if(editMode == EDITMODE_UV_LATTICE_SELECT || editMode == EDITMODE_UV_LATTICE_GRAB ||
                          editMode == EDITMODE_UV_SELECT || editMode == EDITMODE_UV_SELECT_STORE || editMode == EDITMODE_UV_GRAB){
                    // Switch back to mesh lattice mode
                    editMode = EDITMODE_LATTICE_SELECT;
                    help.printLATTICE_SELECT();
                }
            }
            // TAB: Cycle within current domain (mesh or UV)
            else if(uiEvent.keyChar == 'tab'){
                if(editMode == EDITMODE_LATTICE_SELECT){
                    editMode = EDITMODE_MESH_SELECT;
                    help.printMESH_SELECT();
                }else if(editMode == EDITMODE_MESH_SELECT){
                    editMode = EDITMODE_LATTICE_SELECT;
                    help.printLATTICE_SELECT();
                }else if(editMode == EDITMODE_UV_LATTICE_SELECT){
                    editMode = EDITMODE_UV_SELECT;
                    help.printUV_SELECT();
                }else if(editMode == EDITMODE_UV_SELECT){
                    editMode = EDITMODE_UV_LATTICE_SELECT;
                    help.printUV_LATTICE_SELECT();
                }
            } else if(uiEvent.keyChar == 'h'){
               help.toggleEnable();
            } else if(uiEvent.keyChar == 'H'){
                help.changeColor();
            } else if(uiEvent.keyChar == 'f'){
                save();
            }
        }

        if(editMode == EDITMODE_LATTICE_SELECT){
			if(uiEvent.mouseInWindows && !isNavigationEvent()){
                if(uiEvent.keyHit && uiEvent.keyChar == 'z'){
                    latticeMngr.undoLattice();
                } else if(uiEvent.keyHit && uiEvent.keyChar == 'Z'){
                    latticeMngr.redoLattice();
                } else if(uiEvent.keyHit && uiEvent.keyChar == 'i'){
                    latticeMngr.makeClone();
                    latticeMngr.resetVertice();
                } else if(uiEvent.special_ShiftKey && uiEvent.mouseButtonPress == true){
                    latticeMngr.selectAdd();
                } else if(uiEvent.mouseButtonPress == true){
                    latticeMngr.select();
                } else if(uiEvent.keyRelease){
                    var _step = 1. / uiEvent.windowSizeX * cameraAnimNode.position[2];
                    if(uiEvent.keyChar == 'up'){
                        latticeMngr.setVertice(new THREE.Vector3(0, _step, 0));
                    }else if(uiEvent.keyChar == 'down'){
                        latticeMngr.setVertice(new THREE.Vector3(0, -_step, 0));
                    }else if(uiEvent.keyChar == 'left'){
                        latticeMngr.setVertice(new THREE.Vector3(-_step, 0, 0));
                    }else if(uiEvent.keyChar == 'right'){
                        latticeMngr.setVertice(new THREE.Vector3(_step, 0, 0));
                    } else if((uiEvent.keyChar == 'g' || uiEvent.keyChar == 'G') && latticeMngr.hasSelection()){
                        //post("got g \n");
                        editMode = EDITMODE_LATTICE_GRAB;
                        help.printLATTICE_GRAB();
                        latticeMngr.makeClone();
                        lastPlacePoint = uiEvent.getPickRay().intersectPlane(editPlane);
                    } else if((uiEvent.keyChar == 'a' || uiEvent.keyChar == 'A')){
                        //post("got a \n");
                        latticeMngr.selectAll();
                    }
                }

                if(uiEvent.hasNewPickRay){
                    latticeMngr.pickray(uiEvent.getPickRay());
                }
            }
        }

        if(editMode == EDITMODE_LATTICE_GRAB){
			if(!isNavigationEvent()){
                if(uiEvent.hasNewPickRay){
                    var currentPlacePoint = uiEvent.getPickRay().intersectPlane(editPlane);
                    latticeMngr.setVertice(currentPlacePoint.sub(lastPlacePoint));
                    lastPlacePoint = uiEvent.getPickRay().intersectPlane(editPlane);
                }

                if(uiEvent.mouseButtonHit){
                    editMode = EDITMODE_LATTICE_SELECT;
                    help.printLATTICE_SELECT();
                }
            }
        }

        if(editMode == EDITMODE_MESH_SELECT){
			if(uiEvent.mouseInWindows && !isNavigationEvent()){
				// ignore all the rest
                if(uiEvent.keyHit && uiEvent.keyChar == 'z'){                                   // UNDO
                    meshMngr.undoMesh();
                } else if(uiEvent.keyHit && uiEvent.keyChar == 'Z'){                            // REDO
                    meshMngr.redoMesh();
                } else if(uiEvent.keyHit && uiEvent.keyChar == 'q'){                            // Set Cursor
                    meshMngr.setCursor();
                } else if(uiEvent.keyHit && uiEvent.keyChar == 'i'){                            // Reset Vertice
                    meshMngr.makeClone();
                    meshMngr.resetVertice();
                } else if(uiEvent.special_ShiftKey &&
                          uiEvent.mouseButtonPress == true){                                    // SHIFT SELECT
                    meshMngr.selectAdd();
                } else if(uiEvent.mouseButtonPress == true){                                    // SELECT
                    meshMngr.select();
                } else if(uiEvent.keyRelease && uiEvent.keyChar == 'p'){                        // STORE SELECTION
                    editMode = EDITMODE_MESH_SELECT_STORE;
                    help.printMESH_SELECT_STORE();
                } else if(uiEvent.keyRelease && uiEvent.keyChar >= 0 && uiEvent.keyChar <= 9){  // RECALL STORED SELECTION
                    meshMngr.recallStoreSelection(uiEvent.keyChar);
                } else if(uiEvent.keyRelease){
                    // Modifier-based step sizes for arrow keys
                    var _step;
                    if(uiEvent.special_ShiftKey){
                        _step = 0.001;  // Fine precision
                    } else if(uiEvent.special_CtrlKey){
                        _step = 0.1;    // Coarse precision
                    } else {
                        _step = 0.01;   // Normal precision
                    }
                    
                    if(uiEvent.keyChar == 'up'){
                        meshMngr.setVertice(new THREE.Vector3(0, _step, 0));
                    } else if(uiEvent.keyChar == 'down'){
                        meshMngr.setVertice(new THREE.Vector3(0, -_step, 0));
                    } else if(uiEvent.keyChar == 'left'){
                        meshMngr.setVertice(new THREE.Vector3(-_step, 0, 0));
                    } else if(uiEvent.keyChar == 'right'){
                        meshMngr.setVertice(new THREE.Vector3(_step, 0, 0));
                    } else if((uiEvent.keyChar == 'g' || uiEvent.keyChar == 'G') && meshMngr.hasSelection()){
                        //post("got g \n");
                        editMode = EDITMODE_MESH_GRAB;
                        help.printMESH_MODIFY();
                        meshMngr.makeClone();
                        lastPlacePoint = uiEvent.getPickRay().intersectPlane(editPlane);
                    } else if((uiEvent.keyChar == 's' || uiEvent.keyChar == 'S') && meshMngr.hasSelection()){
                        //post("got g \n");
                        editMode = EDITMODE_MESH_SCALE;
                        help.printMESH_MODIFY();
                        meshMngr.makeClone();
                        meshMngr.verticeSnapshot();
                        lastPlacePoint = uiEvent.getPickRay().intersectPlane(editPlane);
                    } else if((uiEvent.keyChar == 'r' || uiEvent.keyChar == 'R') && meshMngr.hasSelection()){
                        //post("got g \n");
                        editMode = EDITMODE_MESH_ROTATE;
                        help.printMESH_MODIFY();
                        meshMngr.makeClone();
                        meshMngr.verticeSnapshot();
                        lastPlacePoint = uiEvent.getPickRay().intersectPlane(editPlane);
                    } else if((uiEvent.keyChar == 'a' || uiEvent.keyChar == 'A')){
                        //post("got a \n");
                        meshMngr.selectAll();
                    }
                }

                if(uiEvent.hasNewPickRay){
                    meshMngr.pickRayLatMod(uiEvent.getPickRay());
                }
            }
        }

        if(editMode == EDITMODE_MESH_SELECT_STORE){
			if(uiEvent.mouseInWindows && !isNavigationEvent()){
                if(uiEvent.keyRelease && uiEvent.keyChar == 'tab'){
                    editMode = EDITMODE_MESH_SELECT;
                    help.printMESH_SELECT();
                }
				// ignore all the rest
                if(uiEvent.keyRelease && uiEvent.keyChar >= 0 && uiEvent.keyChar <= 9){
                    meshMngr.storeSelection(uiEvent.keyChar);
                    editMode = EDITMODE_MESH_SELECT;
                    help.printMESH_SELECT();
                }
            }
        }

        if(editMode == EDITMODE_MESH_GRAB){
			if(!isNavigationEvent()){
                if(uiEvent.hasNewPickRay){
                    var currentPlacePoint = uiEvent.getPickRay().intersectPlane(editPlane);
                    meshMngr.setVertice(currentPlacePoint.sub(lastPlacePoint));
                    lastPlacePoint = uiEvent.getPickRay().intersectPlane(editPlane);
                }

                if(uiEvent.mouseButtonHit){
                    editMode = EDITMODE_MESH_SELECT;
                    help.printMESH_SELECT();
                }
            }
        }

        if(editMode == EDITMODE_MESH_SCALE){
			if(!isNavigationEvent()){
                if(uiEvent.hasNewPickRay){
                    var currentPlacePoint = uiEvent.getPickRay().intersectPlane(editPlane);
                    meshMngr.scaleVertice(currentPlacePoint, lastPlacePoint);
                }

                if(uiEvent.mouseButtonHit){
                    editMode = EDITMODE_MESH_SELECT;
                    help.printMESH_SELECT();
                }
            }
        }

        if(editMode == EDITMODE_MESH_ROTATE){
			if(!isNavigationEvent()){
                if(uiEvent.hasNewPickRay){
                    var currentPlacePoint = uiEvent.getPickRay().intersectPlane(editPlane);
                    meshMngr.rotateVertice(currentPlacePoint, lastPlacePoint);
                }

                if(uiEvent.mouseButtonHit){
                    editMode = EDITMODE_MESH_SELECT;
                    help.printMESH_SELECT();
                }
            }
        }

        // UV EDITING MODES
        
        if(editMode == EDITMODE_UV_LATTICE_SELECT){
			if(uiEvent.mouseInWindows && !isNavigationEvent()){
                if(uiEvent.keyHit && uiEvent.keyChar == 'z'){
                    uvLatticeMngr.undoLattice();
                } else if(uiEvent.keyHit && uiEvent.keyChar == 'Z'){
                    uvLatticeMngr.redoLattice();
                } else if(uiEvent.keyHit && uiEvent.keyChar == 'i'){
                    uvLatticeMngr.makeClone();
                    uvLatticeMngr.resetVertice();
                } else if(uiEvent.special_ShiftKey && uiEvent.mouseButtonPress == true){
                    uvLatticeMngr.selectAdd();
                } else if(uiEvent.mouseButtonPress == true){
                    uvLatticeMngr.select();
                } else if(uiEvent.keyRelease){
                    var _step = 1. / uiEvent.windowSizeX * cameraAnimNode.position[2];
                    if(uiEvent.keyChar == 'up'){
                        uvLatticeMngr.setVertice(new THREE.Vector3(0, _step, 0));
                    }else if(uiEvent.keyChar == 'down'){
                        uvLatticeMngr.setVertice(new THREE.Vector3(0, -_step, 0));
                    }else if(uiEvent.keyChar == 'left'){
                        uvLatticeMngr.setVertice(new THREE.Vector3(-_step, 0, 0));
                    }else if(uiEvent.keyChar == 'right'){
                        uvLatticeMngr.setVertice(new THREE.Vector3(_step, 0, 0));
                    } else if((uiEvent.keyChar == 'g' || uiEvent.keyChar == 'G') && uvLatticeMngr.hasSelection()){
                        editMode = EDITMODE_UV_LATTICE_GRAB;
                        help.printUV_LATTICE_GRAB();
                        uvLatticeMngr.makeClone();
                        lastPlacePoint = uiEvent.getPickRay().intersectPlane(editPlane);
                    } else if((uiEvent.keyChar == 'a' || uiEvent.keyChar == 'A')){
                        uvLatticeMngr.selectAll();
                    }
                }

                if(uiEvent.hasNewPickRay){
                    uvLatticeMngr.pickray(uiEvent.getPickRay());
                }
            }
        }

        if(editMode == EDITMODE_UV_LATTICE_GRAB){
			if(!isNavigationEvent()){
                if(uiEvent.hasNewPickRay){
                    var currentPlacePoint = uiEvent.getPickRay().intersectPlane(editPlane);
                    uvLatticeMngr.setVertice(currentPlacePoint.sub(lastPlacePoint));
                    lastPlacePoint = uiEvent.getPickRay().intersectPlane(editPlane);
                }

                if(uiEvent.mouseButtonHit){
                    editMode = EDITMODE_UV_LATTICE_SELECT;
                    help.printUV_LATTICE_SELECT();
                }
            }
        }

        if(editMode == EDITMODE_UV_SELECT){
			if(uiEvent.mouseInWindows && !isNavigationEvent()){
                if(uiEvent.keyHit && uiEvent.keyChar == 'z'){
                    uvMeshMngr.undoUV();
                } else if(uiEvent.keyHit && uiEvent.keyChar == 'Z'){
                    uvMeshMngr.redoUV();
                } else if(uiEvent.keyHit && uiEvent.keyChar == 'q'){
                    uvMeshMngr.setCursor();
                } else if(uiEvent.keyHit && uiEvent.keyChar == 'i'){
                    uvMeshMngr.makeClone();
                    uvMeshMngr.resetUV();
                } else if(uiEvent.special_ShiftKey && uiEvent.mouseButtonPress == true){
                    uvMeshMngr.selectAdd();
                } else if(uiEvent.mouseButtonPress == true){
                    uvMeshMngr.select();
                } else if(uiEvent.keyRelease && uiEvent.keyChar == 'p'){
                    editMode = EDITMODE_UV_SELECT_STORE;
                    help.printUV_SELECT_STORE();
                } else if(uiEvent.keyRelease && uiEvent.keyChar >= 0 && uiEvent.keyChar <= 9){
                    uvMeshMngr.recallStoreSelection(uiEvent.keyChar);
                } else if(uiEvent.keyRelease){
                    // Step sizes for UV editing (smaller because 0-1 space)
                    var _step;
                    if(uiEvent.special_ShiftKey){
                        _step = 0.0005;  // Fine precision
                    } else if(uiEvent.special_CtrlKey){
                        _step = 0.05;    // Coarse precision
                    } else {
                        _step = 0.005;   // Normal precision
                    }
                    
                    if(uiEvent.keyChar == 'up'){
                        uvMeshMngr.setUV(new THREE.Vector3(0, _step, 0));
                    } else if(uiEvent.keyChar == 'down'){
                        uvMeshMngr.setUV(new THREE.Vector3(0, -_step, 0));
                    } else if(uiEvent.keyChar == 'left'){
                        uvMeshMngr.setUV(new THREE.Vector3(-_step, 0, 0));
                    } else if(uiEvent.keyChar == 'right'){
                        uvMeshMngr.setUV(new THREE.Vector3(_step, 0, 0));
                    } else if((uiEvent.keyChar == 'g' || uiEvent.keyChar == 'G') && uvMeshMngr.hasSelection()){
                        editMode = EDITMODE_UV_GRAB;
                        help.printUV_MODIFY();
                        uvMeshMngr.makeClone();
                        lastPlacePoint = uiEvent.getPickRay().intersectPlane(editPlane);
                    } else if((uiEvent.keyChar == 'a' || uiEvent.keyChar == 'A')){
                        uvMeshMngr.selectAll();
                    }
                }

                if(uiEvent.hasNewPickRay){
                    uvMeshMngr.pickRayLatMod(uiEvent.getPickRay());
                }
            }
        }

        if(editMode == EDITMODE_UV_SELECT_STORE){
			if(uiEvent.mouseInWindows && !isNavigationEvent()){
                if(uiEvent.keyRelease && uiEvent.keyChar == 'tab'){
                    editMode = EDITMODE_UV_SELECT;
                    help.printUV_SELECT();
                }
                if(uiEvent.keyRelease && uiEvent.keyChar >= 0 && uiEvent.keyChar <= 9){
                    uvMeshMngr.storeSelection(uiEvent.keyChar);
                    editMode = EDITMODE_UV_SELECT;
                    help.printUV_SELECT();
                }
            }
        }

        if(editMode == EDITMODE_UV_GRAB){
			if(!isNavigationEvent()){
                if(uiEvent.hasNewPickRay){
                    var currentPlacePoint = uiEvent.getPickRay().intersectPlane(editPlane);
                    uvMeshMngr.setUV(currentPlacePoint.sub(lastPlacePoint));
                    lastPlacePoint = uiEvent.getPickRay().intersectPlane(editPlane);
                }

                if(uiEvent.mouseButtonHit){
                    editMode = EDITMODE_UV_SELECT;
                    help.printUV_SELECT();
                }
            }
        }

    }


	// This method needs to be called at the end
	uiEvent.update_end();
    editModeHasChanged = (lastEditMode != editMode)?true: false;
    lastEditMode = editMode;
    // now draw the changes
    draw();
}

function isNavigationEvent(){
    if(uiEvent.special_CtrlKey){
        var diff = (uiEvent.lastDragPosY - uiEvent.currentPosY) / 10.;
        if(diff != 0){
            cameraObj.lens_angle = cameraObj.lens_angle + diff;
//				post("in zoom mode " + diff + " + " + cameraObj.position[2] + " \n");
            if((cameraAnimNode.position[2] + diff) > 1.0 && (cameraAnimNode.position[2] + diff) < 7.){
                cameraAnimNode.position = [
                    cameraAnimNode.position[0],
                    cameraAnimNode.position[1],
                    cameraAnimNode.position[2] + diff / 2.0];
                calcCameraMatrix();
            }
        }
//        post("isNavigationEvent - zoom\n");
        return true;
    } else if(uiEvent.special_AltKey){
        var diffY = (uiEvent.lastDragPosY - uiEvent.currentPosY) / 10.;
        var diffX = (uiEvent.lastDragPosX - uiEvent.currentPosX) / 10.;
        if(diffY != 0 || diffX != 0){
//				post("in zoom mode " + diff + " + " + cameraObj.position[2] + " \n");
            if((cameraAnimNode.position[1] - diffY / 10.0) > -2.0 && (cameraAnimNode.position[1] - diffY / 10.0) < 2.){
                cameraAnimNode.position = [
                    cameraAnimNode.position[0],
                    cameraAnimNode.position[1] - diffY / 10.0,
                    cameraAnimNode.position[2]];
//                            post("cameraAnimNode.position[1] " + cameraAnimNode.position[1] + " diffY " + diffY +" \n");
                calcCameraMatrix();
            }
            if((cameraAnimNode.position[0] + diffX / 10.0) > -2.0 && (cameraAnimNode.position[0] + diffX / 10.0) < 2.){
              cameraAnimNode.position = [
                    cameraAnimNode.position[0] + diffX / 10.0,
                    cameraAnimNode.position[1],
                    cameraAnimNode.position[2]];
                calcCameraMatrix();
            }
        }
//        post("isNavigationEvent - shifting\n");
        return true;
    }
    return false;
}

// set the background color of the editor
function erase_color(_red, _green, _blue, _alpha){
	init();
	cameraObj.erase_color = [_red, _green, _blue, _alpha];
}

function interpolateNewMesh( _interpolate ){
	init();
    meshMngr.interpolateNewMesh((_interpolate == 1)?true:false);
}

function save(){
    init();
    if(fileName != null)
        savewarp(fileName);
}

// save warp mesh
function savewarp(_warpPath){
    init();
    var fout = new File(_warpPath,"write","TEXT");
    fout.eof = 0;
    fout.writeline("# Warp File created by MeshWarp / sparck");
    fout.writeline("# www.tecartlab.com");
    fout.writeline("o MeshWarp");
    if(!meshMngr.save(fout, true) || !latticeMngr.save(fout)){
        error("MeshWarp save: Failed saving lattice to file: " + _warpPath + "\n");
    } else {
        post("MeshWarp save: Saved lattice to file: " + _warpPath + "\n");
		fileName = _warpPath;
    }
    fout.close();
 }

// export warp mesh
function generateWarpMesh(){
    init();
    if(fileName != null){
        var correctedPath = fileName.replace("\\", "/");
        var filename = correctedPath.substring(correctedPath.lastIndexOf("/"), correctedPath.lastIndexOf(".wrp"));
        var warpObjPath = correctedPath.substring(0, correctedPath.lastIndexOf("/_warps")) + "/_export/_warps" + filename + ".obj";

        var fout = new File(warpObjPath,"write","TEXT");
        fout.eof = 0;
        fout.writeline("# Warp File created by MeshWarp / sparck");
        fout.writeline("# www.tecartlab.com");
        fout.writeline("o MeshWarp");
        if(!meshMngr.saveModifiedOnly(fout)){
            error("MeshWarp export: Failed exporting mesh to file: " + warpObjPath + "\n");
        } else {
            post("MeshWarp export: Exported mesh to file: " + warpObjPath + "\n");
        }
        fout.close();
    }
}

// loading lattice warp
function loadwarp(_warpPath){
    init();
    if(warploader.load(_warpPath)){
        fileName = _warpPath;
        warploader.setLattice(latticeMngr);
        warploader.setMesh(meshMngr);
        draw();
    }
}

// loading simple mesh
function loadobj(objpath){
    init();
	if(warploader.load(objpath)){
        if(!warploader.setMesh(meshMngr)){
       		outlet(OUTLET_ERROR, "loadobj");
		} else {
       		outlet(OUTLET_ERROR, "off");
		}
    }
    draw(false);
}

function draw(_forceRefresh){
    init();
    if(latticeMngr.hasGeometryChanged() || uvLatticeMngr.hasGeometryChanged() || meshMngr.hasGeometryChanged() || uvMeshMngr.hasUVsChanged() || _forceRefresh){
        meshMngr.modifyWith(latticeMngr); //modifies the current mesh with the lattice
        uvMeshMngr.modifyWith(uvLatticeMngr); //modifies the UVs with the UV lattice
        
        // Use UV-lattice modified matrix if in UV mode
        if(editMode >= EDITMODE_UV_LATTICE_SELECT && editMode <= EDITMODE_UV_GRAB){
            meshMatrix = WARP.GeometryQueries.generateUVMatrix(meshMngr.getCurrentMesh(), meshMatrix, 0, meshColor);
        } else {
            meshMatrix = meshMngr.generateMatrix(meshMatrix, 0, meshColor);
        }
        
        meshObj.jit_matrix(meshMatrix.name);
        meshObj.draw_mode = 'triangles';
        outlet(OUTLET_MESH, "jit_matrix", meshMatrix.name);
        outlet(OUTLET_MESH, "draw_mode", "triangles");
    }
    if(latticeMngr.hasChanged() || uvLatticeMngr.hasChanged() || meshMngr.hasChanged() || uvMeshMngr.hasChanged() || editModeHasChanged || _forceRefresh){
        latticeObj.reset();
        latticeObj.glcolor(0., 0.5, 0., 1.);
        // draw the unit square
        latticeObj.linesegment(1.0, 1.0, 0.0, -1.0, 1.0, 0.0);
        latticeObj.linesegment(-1.0, 1.0, 0.0, -1.0, -1.0, 0.0);
        latticeObj.linesegment(-1.0, -1.0, 0.0, 1.0, -1.0, 0.0);
        latticeObj.linesegment(1.0, -1.0, 0.0, 1.0, 1.0, 0.0);
        // draw based on mode
        if(editMode == EDITMODE_LATTICE_SELECT || editMode == EDITMODE_LATTICE_GRAB){
            meshMngr.drawLatMod(latticeObj, 'bg'); // draw the mesh
            latticeMngr.draw(latticeObj, 'edit' ); // draw the lattice
        }else if(editMode == EDITMODE_MESH_SELECT || editMode == EDITMODE_MESH_SELECT_STORE || editMode == EDITMODE_MESH_GRAB || editMode == EDITMODE_MESH_SCALE || editMode == EDITMODE_MESH_ROTATE){
            latticeMngr.draw(latticeObj, 'bg'); // draw the lattice
            meshMngr.drawLatMod(latticeObj, 'edit'); // draw the mesh
        }else if(editMode == EDITMODE_UV_LATTICE_SELECT || editMode == EDITMODE_UV_LATTICE_GRAB){
            uvMeshMngr.drawLatMod(latticeObj, 'bg'); // draw the UVs
            uvLatticeMngr.draw(latticeObj, 'edit'); // draw the UV lattice
        }else if(editMode == EDITMODE_UV_SELECT || editMode == EDITMODE_UV_SELECT_STORE || editMode == EDITMODE_UV_GRAB){
            uvLatticeMngr.draw(latticeObj, 'bg'); // draw the UV lattice
            uvMeshMngr.drawLatMod(latticeObj, 'edit'); // draw the UVs
        }
    }
}

function applyLattice(){
    init();
    meshMngr.makeClone(); // make a new modification clone
    meshMngr.applyLattice(); // apply the lattice transformations to the mesh changes.
    latticeMngr.makeClone(); // make a new modfication clone of the lattice
    latticeMngr.selectAll(); // select all lattice vertices
	latticeMngr.resetVertice(); // resets the latice to its original shape.
    latticeMngr.selectAll(); // deselect all lattice vertices
    draw(false);
}

function applyUVLattice(){
    init();
    uvMeshMngr.makeClone(); // make a new modification clone
    uvMeshMngr.applyLattice(); // apply the lattice transformations to the UV changes.
    uvLatticeMngr.makeClone(); // make a new modfication clone of the UV lattice
    uvLatticeMngr.selectAll(); // select all lattice vertices
	uvLatticeMngr.resetVertice(); // resets the UV latice to its original shape.
    uvLatticeMngr.selectAll(); // deselect all lattice vertices
    draw(false);
}

function createLattice(){
    init();
	var a = arrayfromargs(arguments);
	latticeMngr.create(a);
    draw(false);
}

function createUVLattice(){
    init();
	var a = arrayfromargs(arguments);
	uvLatticeMngr.create(a);
    draw(false);
}


function color(){
	init();
	meshColor = arrayfromargs(arguments);
	draw(true);
}

function texture(){
    init();
    meshObj.texture = arrayfromargs(arguments);
}

function mesh_poly_mode(){
    init();
    meshObj.poly_mode = [arguments[0], arguments[1]];
}

function editor(_enable){
    init();
	var args = arrayfromargs(arguments);
	if(args[0] == 'enable'){
        editor_enable = args[1];
        nodeObj.enable = args[1];
        cameraObj.enable = args[1];
        latticeObj.enable = args[1];
        meshObj.enable = args[1];
    }
}

/*
	Setting uiEvent data for windows interaction
	Expects either:
	  - Old format: ui_keys(keyChar, pressed)
	  - New format: ui_keys('modifier', modifierType) or ui_keys('char'/'sym', keyChar, pressed)
*/
function ui_keys(){
    init();
	if(arguments.length == 2 && arguments[0] == 'modifier'){
		// Modifier message: ui_keys modifier shift/ctrl/alt/none
		uiEvent.modifier(arguments[1]);
	} else if(arguments.length == 3){
		// New format: ui_keys char/sym keyChar pressed
		uiEvent.key(arguments[0], arguments[1], arguments[2]);
	} else if(arguments.length == 2){
		// Old format: ui_keys keyChar pressed
		uiEvent.key(arguments[0], arguments[1]);
	}
}

/*
	Setting uiEvent data for windows interaction
*/
function ui_window(){
    init();
	var args = arrayfromargs(arguments);
	if(args[0] == 'mouse'){
		args.splice(0, 1);
		uiEvent.mouse(args[0],args[1],args[2],args[3],args[4],args[5],args[6],args[7], 0.);
	} else if(args[0] == 'mouseidle'){
		args.splice(0, 1);
		uiEvent.mouse(args[0],args[1],args[2],args[3],args[4],args[5],args[6],args[7], 0.);
	} else if(args[0] == 'mouseidleout'){
        outlet(OUTLET_WINDOW, "getsize");
	} else if(args[0] == 'mousewheel'){
		args.splice(0, 1);
		uiEvent.mouse(args[0],args[1],args[2],args[3],args[4],args[5],args[6],args[7],args[8]);
	} else if(args[0] == 'pickray'){
		args.splice(0, 1);
        if(cameraObj.enable == 1){
            args = cameraObj.getviewportray(uiEvent.currentPosX, uiEvent.currentPosY);
            if(args != null){
                uiEvent.pickray(args[0],args[1],args[2],args[3],args[4],args[5]);
            }
        }
	} else if(args[0] == 'size'){
		args.splice(0, 1);
		uiEvent.windowSize(args[0],args[1]);
	}
}

function calcCameraMatrix(){
	var camMat = cameraAnimNode.worldtransform;
	cameraMatrix.set(
		camMat[0], camMat[4], camMat[8], camMat[12],
		camMat[1], camMat[5], camMat[9], camMat[13],
		camMat[2], camMat[6], camMat[10], camMat[14],
		camMat[3], camMat[7], camMat[11], camMat[15]);
}

function notifydeleted(){
   	init();
    latticeObj.freepeer();
    cameraAnimNode.freepeer();
    cameraObj.freepeer();
    nodeObj.freepeer();
    meshObj.freepeer();
    meshMatrix.freepeer();
	help.freepeer();
}

// error("What just happened?\n");
// post(1,2,3,"violet",a);
// cpost (any arguments); -> to system console:
// messnamed (Max object name, message name, any arguments)
// messnamed("flower","bang”);
// a = new Array(900,1000,1100);
// jsthis -> this instance
//  autowatch (1) -> global code -> autoload after js-file was edited and saved

// patcher arguments
//if (jsarguments.length >= 2)
//    outlets = jsarguments[1];

// var stuff;
//  function anything(val)
//  {
//    if (arguments.length) // were there any arguments?
//      stuff[messagename] = val;
//  }

// function anything()
//  {
//    var a = arrayfromargs(messagename,arguments);

//    a.sort();
//    outlet(0,a);
//  }
