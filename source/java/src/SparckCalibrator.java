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


import java.io.File;
import java.io.UnsupportedEncodingException;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Vector;

import org.bytedeco.javacpp.Loader;
import org.bytedeco.opencv.opencv_java;

import org.opencv.calib3d.Calib3d;
import org.opencv.core.Core;
import org.opencv.core.CvType;
import org.opencv.core.Mat;
import org.opencv.core.MatOfPoint2f;
import org.opencv.core.MatOfPoint3f;
import org.opencv.core.Size;

import com.cycling74.max.*;

import com.tecartlab.tools.math.la.Matrix4x4d;
import com.tecartlab.tools.math.la.Vector3f;
import com.tecartlab.tools.threedee.Camera;
import com.tecartlab.tools.threedee.Frustum;
import com.tecartlab.tools.threedee.Node;
import com.tecartlab.utils.Debug;
import com.tecartlab.utils.dyndist.DynSubscriber;
import com.tecartlab.utils.dyndist.DynSubscription;
import com.tecartlab.sparck.calib.CalibVertice;
import com.tecartlab.sparck.calib.Calibrations;
import com.tecartlab.sparck.calib.Intrinsics;
import com.tecartlab.sparck.calib.ProjProps;
import com.tecartlab.sparck.newcalib.SimpleObjectContainer;
import com.tecartlab.jay3dee.*;
import com.tecartlab.jay3dee.tracker.GuiTracker;
import com.tecartlab.jay3dee.tracker.TrackerEvent;
import com.tecartlab.jay3dee.tracker.TrackerListener;

public class SparckCalibrator extends MaxObject implements ProjProps.Listener, SimpleObjectContainer.LoadCompleteListener{

	static final int EDIT_M_TARGET = 0;
	static final int EDIT_M_WARP = 1;

	static final int OUTLET_STORAGE = 0;
	static final int OUTLET_SKETCH = 1;
	static final int OUTLET_DUMP = 2;

	String editorname;

	String trackername;
	String objectName;
	String propertyName;

	private String[] drawingContexts;

	private TrackerSubscriber trackerSubscriber;

	GuiTracker tracker;
	SimpleObjectContainer modelObject;
	Camera virtualCamera;
	ProjProps props;
	Calibrations calibObject;
	//NumberCruncher crunchy;

	private Callback infoOutlet;

	// MaxQelem for deferred GL operations
	private MaxQelem createQelem;
	private MaxQelem addQelem;
	private volatile Atom[] pendingCreateVertices;
	private volatile Atom[] pendingAddVertices;
	private final Object verticesLock = new Object();
	// Flag to track whether calibration update is needed after model loading
	private volatile boolean needsCalibrationUpdate = false;
	// Flag to track if createToXY has been called since calibration was loaded from file
	private boolean createToXYCalledAfterCalibLoad = false;

	int editMode = 0;

	boolean isEnabled;

	boolean showCalibModel = true;

	String filePath = null;

	public SparckCalibrator(Atom args[])
	{
        Loader.load(opencv_java.class);

        Debug.info("SparckCalibrator v1.0.2", "OpenCV has been initialized");

		virtualCamera = createVirtualCamera();
		calibObject = new Calibrations();
		props = new ProjProps(this);
		trackerSubscriber = new TrackerSubscriber();
		modelObject = new SimpleObjectContainer();
		// Set this as listener to be notified when model loading completes
		modelObject.setLoadCompleteListener(this);
		// Initialize MaxQelem for deferred GL operations
		createQelem = new MaxQelem(new Callback(this, "createToXY_deferred"));
		addQelem = new MaxQelem(new Callback(this, "addToXY_deferred"));
		
		if (args.length < 1)
			Debug.warning("SparckCalibrator", "needs an editorname and optionally a trackername as arguments. otherwise use 'seteditorname', 'settracker'.");
		else{
			setmsgtitle(args[0].toString());
			if(args.length >= 2)
				settrackername(args[1].toString());
		}

		declareIO(1,3);
		declareAttribute("trackername", null, "settrackername");
		declareAttribute("modelfile", null, "loadmodel");
		this.setOutletAssist(OUTLET_SKETCH, "sketch draw data");
		isEnabled = false;
	}

	private Camera createVirtualCamera(){
		Camera virt = new Camera();
		return virt;
	}

	public void editmode(int _mode){
		if(_mode == EDIT_M_TARGET)
			editMode = EDIT_M_TARGET;
		if(_mode == EDIT_M_WARP)
			editMode = EDIT_M_WARP;
	}

	/**
	 * Sets the editorname.
	 * @param _editorname
	 */
	public void setmsgtitle(String _editorname){
		editorname = _editorname;
	}

	/**
	 * sets via the nodeid the relevant tracker
	 * @param _nodeid
	 */
	public void nodeid(String _nodeid){
		settrackername(_nodeid + ".tracker");
	}

	/**
	 * Sets the name of the tracker the editor is listening to.
	 * @param _trackerName name of the tracker
	 */
	public void settrackername(String _trackerName){
		trackerSubscriber.subscribeTracker(_trackerName);
	}

	/**
	 * Loads the 3D model file for calibration.
	 * @param _filepath path to the model file
	 */
	public void loadmodel(String _filepath){
		if(modelObject != null){
			modelObject.loadModel(_filepath);
			objectName = _filepath;
			if(isOperational()){
				updateCalibrationObject();
			}
		}
	}

	/**
	 * Set the World - Position of the model Object
	 * @param _position - Atom Array with x, y, and z float value
	 */
	public void position(Atom[] _position){
		if(modelObject != null && _position.length == 3){
			modelObject.position(_position);
			updateCalibrationObject();
		}
	}

	/**
	 * Set the World - Quaternion of the model Object
	 * @param _quat - Atom Array with x, y, z and w float value
	 */
	public void quat(Atom[] _quat){
		if(modelObject != null && _quat.length == 4){
			modelObject.quat(_quat);
			updateCalibrationObject();
		}
	}

	/**
	 * Set the World - Rotation of the model Object
	 * @param _rotatexyz - Atom Array with Euler Angle float value
	 */
	public void rotatexyz(Atom[] _rotatexyz){
		if(modelObject != null && _rotatexyz.length == 3){
			modelObject.rotatexyz(_rotatexyz);
			updateCalibrationObject();
		}
	}

	/**
	 * Set the World - Scale of the model Object
	 * @param _scale - Atom Array with x, y and z float value
	 */
	public void scale(Atom[] _scale){
		if(modelObject != null && _scale.length == 3){
			modelObject.scale(_scale);
			updateCalibrationObject();
		}
	}

	/**
	 * Scales the calibration object drawing. This can be useful if the calibration object appears
	 * Skewed compared to the object. This happens if the Jay3DeeCamera renders to a jit.gl.node object
	 *
	 * @param scale
	 */
	public void scale_calibration(Atom[] scale){
		calibObject.scale(scale);
	}

	/**
	 * Set the render mode of the model drawer
	 * @param mode render mode integer
	 */
	public void render_mode(int mode){
		if(modelObject != null){
			modelObject.drawer.setRenderMode(mode);
		}
	}

	/**
	 * Set the drawing layer of the model
	 * @param layer layer number
	 */
	public void layer(int layer){
		if(modelObject != null){
			modelObject.drawer.setLayer(layer);
		}
	}

	/**
	 * Pass any other messages to the model drawer
	 * @param message message name
	 * @param args arguments
	 */
	public void anything(String message, Atom[] args){
		if(modelObject != null){
			modelObject.anything(message, args);
		}
	}
	
	/**
	 * Creates a model with the specified points.
	 * Three points make a vertice, with each vertice drawing a line to the XY plane.
	 * @param vertices array of floats (x,y,z triplets)
	 */
	public void createToXY(Atom[] vertices) {
		if((vertices.length % 3) == 0){
			// Store vertices and defer GL operations to main thread
			synchronized(verticesLock) {
				pendingCreateVertices = vertices;
			}
			createQelem.set();
		} else {
			Debug.error("SparckCalibrator", "'createToXY' the number of values need to be multiple of 3.");
		}
	}

	/**
	 * Deferred callback executed on Max main thread to safely perform GL operations.
	 */
	public void createToXY_deferred() {
		Atom[] vertices;
		synchronized(verticesLock) {
			vertices = pendingCreateVertices;
			pendingCreateVertices = null;
		}
		if(vertices != null && modelObject != null) {
			// If this is the first createToXY call after loading calibration from file,
			// clear the calibration vertices since we're creating a new unrelated model
			if(!createToXYCalledAfterCalibLoad && calibObject != null && calibObject.isLoaded()) {
				calibObject.reset();
				Debug.info("SparckCalibrator", "Cleared calibration vertices for new model created by createToXY");
			}
			createToXYCalledAfterCalibLoad = true;
			
			modelObject.createToXY(vertices);
			// Mark that calibration needs updating after model loads
			needsCalibrationUpdate = true;
			// Note: actual update happens in modelLoadComplete() after async loading
		}
	}

	/**
	 * Adds to a loaded model the specified points.
	 * Three points make a vertice, with each vertice drawing a line to the XY plane.
	 * @param vertices array of floats (x,y,z triplets)
	 */
	public void addToXY(Atom[] vertices) {
		if((vertices.length % 3) == 0){
			// Store vertices and defer GL operations to main thread
			synchronized(verticesLock) {
				pendingAddVertices = vertices;
			}
			addQelem.set();
		} else {
			Debug.error("SparckCalibrator", "'addToXY' the number of values need to be multiple of 3.");
		}
	}

	/**
	 * Deferred callback executed on Max main thread to safely perform GL operations.
	 */
	public void addToXY_deferred() {
		Atom[] vertices;
		synchronized(verticesLock) {
			vertices = pendingAddVertices;
			pendingAddVertices = null;
		}
		if(vertices != null && modelObject != null) {
			modelObject.addToXY(vertices);
			// Mark that calibration needs updating after model loads
			needsCalibrationUpdate = true;
			// Note: actual update happens in modelLoadComplete() after async loading
		}
	}

	public void enable(int _enable){
		isEnabled = (_enable == 0)?false: true;
		if(modelObject != null){
			if(_enable == 1){
				modelObject.drawer.updateRenderMode();
			} else {
				modelObject.drawer.anything("enable", Atom.newAtom(0));
			}
		}
		calibObject.enable(_enable);
		updateCalibrationObject();
	}

	public void drawto(Atom[] _contexts){
		String[] newContexts = Atom.toString(_contexts);
		// first remove the already set additional drawing contexts
		if(drawingContexts != null){
			calibObject.removeContexts(drawingContexts);
		}
		// then add the new drawing contexts
		if(newContexts != null){
			// Remove "stageview" from the array if present
			// we dont want to render the calibration UI element in the stageview
			drawingContexts = Arrays.stream(newContexts)
				.filter(s -> !s.equals("stageview"))
				.toArray(String[]::new);
			calibObject.addContexts(drawingContexts);
		}
		if(modelObject != null){
			modelObject.drawer.setContext(_contexts);
		}
	}

	/**
	 * Loads the calibration object
	 * @param _filepath
	 */
	public void read(String _filepath){
		filePath = _filepath;
		calibObject.load(filePath);
		// Reset flag so first createToXY call will clear calibration vertices
		createToXYCalledAfterCalibLoad = false;
		if(isOperational() && filePath != null){
			props.applyTo(virtualCamera);
			updateCalibrationObject();
		}
	}

	/**
	 * Saves the calibration object under the loaded filepath
	 */
	public void save(){
		if(isOperational() && filePath != null){
			updateCalibrationObject();
			calibObject.save(filePath);
			calibObject.saveDelaunayMesh(filePath);
		}
	}

	/**
	 * Saves the calibration object under the specified filepath
	 * @param _filepath
	 */
	public void saveas(String _filepath){
		filePath = _filepath;
		if(isOperational() && filePath != null){
			updateCalibrationObject();
			calibObject.saveas(_filepath);
			calibObject.saveDelaunayMesh(filePath);
		}
	}

	public void SOLVE(){
		if(isOperational()){
			if(calibObject.getVerticeCount() >= 4){
				
				int WIDTH = props.getInt(ProjProps.IDX_resolution_width);
				int HEIGHT = props.getInt(ProjProps.IDX_resolution_height);

				MatOfPoint3f objectPoint = calibObject.getObjectPoints();
				MatOfPoint2f imagePoint = calibObject.getImagePoints(WIDTH, HEIGHT);

				List<Mat> objectPoints = new ArrayList<Mat>(1);
				List<Mat> imagePoints = new ArrayList<Mat>(1);

				objectPoints.add(objectPoint);
				imagePoints.add(imagePoint);
				
				int flags =
						Calib3d.CALIB_USE_INTRINSIC_GUESS | // must have: causes error if this flag is off
						Calib3d.CALIB_FIX_INTRINSIC * props.getInt(ProjProps.IDX_flag_fixIntrinsic)|
						Calib3d.CALIB_FIX_ASPECT_RATIO * props.getInt(ProjProps.IDX_flag_fixAspectRatio)|
						Calib3d.CALIB_ZERO_TANGENT_DIST * props.getInt(ProjProps.IDX_flag_zeroTangentDistance)|
						Calib3d.CALIB_FIX_K1 * props.getInt(ProjProps.IDX_flag_fixK1)|
						Calib3d.CALIB_FIX_K2 * props.getInt(ProjProps.IDX_flag_fixK2)|
						Calib3d.CALIB_FIX_K3 * props.getInt(ProjProps.IDX_flag_fixK3)|

						Calib3d.CALIB_FIX_K4 * props.getInt(ProjProps.IDX_flag_fixK4)| 				// no effect
						Calib3d.CALIB_FIX_K5 * props.getInt(ProjProps.IDX_flag_fixK5)| 				// no effect
						Calib3d.CALIB_FIX_K6 * props.getInt(ProjProps.IDX_flag_fixK6)|				// no effect
						Calib3d.CALIB_FIX_PRINCIPAL_POINT * 0; 	// counter productive
				
				
				float lastDistance 	= 100000;
				float avrgDist 		= 10000;

				while(avrgDist < lastDistance){
					lastDistance = avrgDist;

					// prepare empty result container:
					List<Mat> rvecs = new ArrayList<Mat>();
					List<Mat> tvecs = new ArrayList<Mat>();
					Mat distCoeffs = new Mat();

					Mat cameraMatrix = Mat.eye(3, 3, CvType.CV_32FC1);
					double fx = 30d / 180d * Math.PI * (double)WIDTH;
					cameraMatrix.put(0, 0, fx);
					cameraMatrix.put(1, 1, fx);
					cameraMatrix.put(0, 2, WIDTH / 2.0);
					cameraMatrix.put(1, 2, HEIGHT / 2.0);

					Size imageSize = new Size(WIDTH,HEIGHT);

					Calib3d.calibrateCamera(objectPoints, imagePoints, imageSize, cameraMatrix, distCoeffs, rvecs, tvecs, flags);

					Matrix4x4d viewMatrix = makeViewMatrix(rvecs.get(0), tvecs.get(0));

					Matrix4x4d modelMatrix = Matrix4x4d.inverse(viewMatrix);

					//post("result: " + modelMatrix.toString());
					//post("translation = " + modelMatrix.get()[12] + ", " + modelMatrix.get()[13] + ", " + modelMatrix.get()[14]);

					Intrinsics intrinsics = new Intrinsics();
					intrinsics.setup(cameraMatrix, imageSize, imageSize);

					Frustum frustum = intrinsics.getFrustum(props.getFloat(ProjProps.IDX_intrinsic_frustumNear), props.getFloat(ProjProps.IDX_intrinsic_frustumFar));
					//post("frustum: " + frustum.toString());

					props.set(ProjProps.IDX_calibration_matrix, modelMatrix.getMatrix4x4f().get());

					props.set(ProjProps.IDX_intrinsic_frustumLeft, frustum.left);
					props.set(ProjProps.IDX_intrinsic_frustumRight, frustum.right);
					props.set(ProjProps.IDX_intrinsic_frustumBottom, frustum.bottom);
					props.set(ProjProps.IDX_intrinsic_frustumTop, frustum.top);

					props.changeEvent();

					float sum = 0;
					int countVerts = 0;
					for(int i = 0; i < calibObject.getVerticeCount(); i++){
						CalibVertice vert = calibObject.getVertice(i);
						if(vert.isTargetType()){
							vert.calibrationError = (float)
									Math.sqrt(
									Math.pow(Math.abs((double)(vert.getTargetVertice().x() - vert.getModelScreenVertice().x())) * imageSize.width,2) +
									Math.pow(Math.abs((double)(vert.getTargetVertice().y() - vert.getModelScreenVertice().y())) * imageSize.height,2));
							sum += vert.calibrationError;
							countVerts++;
						}
					}
					avrgDist = (sum / countVerts);
				}

				post("Calibration statistics:");
				for(int i = 0; i < calibObject.getVerticeCount(); i++){
					CalibVertice vert = calibObject.getVertice(i);
					if(vert.isTargetType()){
						post("    t" + i + ": distance: " + vert.calibrationError + " [px]");
					}
				}
				post("    average distance: " + avrgDist + " [px]");


			} else {
				Debug.error("Calibrator [" + editorname + "]", "Not enough target verticies defined ("+calibObject.getVerticeCount()+"): required are 4 or more.");
			}
		}
	}

	public static Matrix4x4d makeViewMatrix(Mat rot, Mat trans){
		// http://answers.opencv.org/question/23089/opencv-opengl-proper-camera-pose-using-solvepnp/

		// first get the rotation values into a rotation matrix
		Mat rotation = new Mat(3, 3, CvType.CV_32FC1);
		if(rot.rows() == 3 && rot.cols() == 3) {
			rotation = rot;
		} else {
			Calib3d.Rodrigues(rot, rotation);
		}

		// openCV's matrices are ROW MAJOR, so we first comply with that:
		Matrix4x4d viewMatrix = new Matrix4x4d(
				rotation.get(0, 0)[0], rotation.get(0, 1)[0], rotation.get(0, 2)[0], trans.get(0, 0)[0],
				rotation.get(1, 0)[0], rotation.get(1, 1)[0], rotation.get(1, 2)[0], trans.get(1, 0)[0],
				rotation.get(2, 0)[0], rotation.get(2, 1)[0], rotation.get(2, 2)[0], trans.get(2, 0)[0],
				0, 0, 0, 1.0d);

		// then we need a transfer matrix, since openCL has Y and Z axis inverted
		Matrix4x4d cvToGl = new Matrix4x4d();
		cvToGl.setElement(0, 0, 1);
		cvToGl.setElement(1, 1, -1); // Invert the y axis
		cvToGl.setElement(2, 2, -1); // invert the z axis
		cvToGl.setElement(3, 3, 1);

		// invert the y and z axis
		cvToGl.multiply(viewMatrix);

		// and then go from ROW Major to COLUM Major by transposing
		cvToGl.transpose();

		return cvToGl;
	}

	public void startcrunch(){
	}

	public void stopcrunch(){
	}

	/**
	 * Updates the calibration object.
	 */
	public void updateCalibrationObject(){
		if(isEnabled){
			if(tracker != null && tracker.isOperational()){
				//virtualCamera.viewport = new Viewport(tracker.getCameraHandler().getViewport());
				//String context = tracker.getCameraHandler().getContext();
				//calibObject.addContext(context);
				if(calibObject.isLoaded() && modelObject != null && modelObject.isOperational()){
					calibObject.link(modelObject);
					try{
						calibObject.update(virtualCamera);
					} catch (NoSuchElementException e){
						// there are cases where this exception is thrown from inside the 
						// generation of the delaunay code. no clue why.
						// maybe if the warp vertices are too close together.
						// there is only one quick and dirty remedy, 
						// which is not sure it will fix all cases:
						calibObject.adjustWarpToTarget();
						calibObject.update(virtualCamera);
					}
					calibObject.draw();
				}
			}
		}
	}

	/**
	 * called by the external pattrstorage object when it is done dumping its content.
	 * This indicates that the properties are set and operational.
	 */
	public void pattrOn(){
		props.setOperational();
		propertyUpdate();
	}

	/**
	 * This method is called when the outside PattrStorage object dumps its content
	 */
	public void pattrEvent(Atom[] _values){
		props.pattrSet(_values[0].getString(), Atom.removeFirst(_values));
		if(props.isOperational())
			propertyUpdate();
	}

	/**
	 * This method is called when a property value was changed internally and the outside
	 * PattrStorage object needs to be updated
	 */
	public void propertyEvent(Vector<String> _changedProps) {
		for(String prop: _changedProps){
			outlet(OUTLET_STORAGE, prop, props.get(prop));
		}
		propertyUpdate();
	}

	/**
	 * Is called by the property event functions
	 */
	private void propertyUpdate(){
		//the virtual cameras properties are set
		props.applyTo(virtualCamera);
		if(isOperational()){
			updateCalibrationObject();
		}
	}


	/**
	 * This message is called by the Tracker if a user interface event has happened.
	 * @param tevent
	 */
	public void trackEvent(TrackerEvent tevent) {
		if(isOperational() && isEnabled){
			//virtualCamera.viewport = new Viewport(tevent.cameraWidth, tevent.cameraHeigth);
			// if there is no object attached or the object is not operational, none of this makes sense...

			if(tevent.mouseInsideCameraCanvas){			//only if mouse is inside camera canvas
				calibObject.resetModified();

				if(tevent.keyDown_Char == tevent.KEY_H && !tevent.keyPressed_Shift){//key Help
					boolean show = calibObject.toggleHelpVisibility();
				}
				if(tevent.keyDown_Char == tevent.KEY_H && tevent.keyPressed_Shift){//key Help
					calibObject.changeHelpColor();
				}
				if(tevent.keyDown_Char == tevent.KEY_L){//key toggle visibility of lable
					calibObject.toggleLabelVisibility();
				}
				if(tevent.keyDown_Char == tevent.KEY_K){//key toggle visibility of calibration result
					calibObject.toggleCalibResultVisibility();
				}
				// store calibration file
				if(tevent.keyDown_Char == tevent.KEY_S){
					if(filePath != null){
						calibObject.save(filePath);
						calibObject.saveDelaunayMesh(filePath);
					}
				}
				// Switching Editmodes...
				if(tevent.keyDown_Tab){						// else if tab is pressed
					if(!calibObject.isModifyModeNone()){
						calibObject.setModifyModeToNone();
						if(modelObject != null){
							modelObject.editRenderMode(true);
							modelObject.drawer.setRenderMode(com.tecartlab.jay3dee.model.drawer.MaxSketchModelMeshDrawer.RENDER_ALL);
						}
						editMode = EDIT_M_TARGET;
					} else if(!calibObject.isModifyModeWarp()){
						calibObject.setModifyModeToWarp();
						if(modelObject != null)
							modelObject.editRenderMode(false);
						editMode = EDIT_M_TARGET;
					}
					updateCalibrationObject();
				}

				if(calibObject.isModifyModeNone()){

					/*
					 * Creating and removing Target Vertices
					 */
					// purge calibration file
					if(tevent.keyDown_Char == tevent.KEY_P){
						calibObject.setEditModeToValueListening("p");
					}

					//purge calibration
					if(calibObject.isEditModeValueListening("p")){
						if(tevent.keyDown_Char == tevent.KEY_Y){
							calibObject.reset();
							calibObject.setEditModeToNone();
						} else if (tevent.keyDown_Esc){
							calibObject.setEditModeToNone();
						}
					}

					/*
					 * selecting vertices...
					 */
					if(calibObject.isEditModeNone()){
						// ... then we check if there is a target vertice picked, so select it.
						if(calibObject.pick(tevent.mouseNormPosX, tevent.mouseNormPosY)){
							if(tevent.keyDown_mouse && calibObject.select()){
								if(calibObject.isPickedAWarpOnly()){
									calibObject.setModifyModeToWarp();
								} else {
									calibObject.setModifyModeToTarget();
								}
								if(modelObject != null)
									modelObject.unselectPickVertice();
								calibObject.setEditModeToSelected();
							}
						} else if(modelObject != null) {
							// first we pick a model vertice...
							modelObject.pickVertice(virtualCamera.getViewportRay( tevent.mouseNormPosX, tevent.mouseNormPosY));
							// ... if not, select the picked model vertice..
							if(tevent.keyDown_mouse){
								modelObject.selectPickVertice();
								calibObject.setModifyModeToModel();
								calibObject.setEditModeToSelected();
							}
						}

						//Adjust all target vertices
						if(tevent.keyDown_Char == tevent.KEY_J){
							calibObject.setEditModeToValueListening("j");
						}
					}
				}

				if(calibObject.isModifyModeWarp()){
					if(calibObject.isEditModeNone()){
						if(calibObject.pick(tevent.mouseNormPosX, tevent.mouseNormPosY)){
							if(tevent.keyPressed_mouse){
								calibObject.doubleSelect();
								calibObject.setEditModeToSelected();
							}
						}

						// create a new warp vertice
						if(tevent.keyDown_Char == tevent.KEY_W){
							calibObject.add(virtualCamera, tevent.mouseNormPosX, tevent.mouseNormPosY);
						}

						//Set frame subdiv
						if(tevent.keyDown_Char == tevent.KEY_F){
							calibObject.setEditModeToValueListening("f");
						}

						//Set frame subdiv
						if(tevent.keyDown_Char == tevent.KEY_D){
							calibObject.setEditModeToValueListening("d");
						}

						//Adjust all warp vertices
						if(tevent.keyDown_Char == tevent.KEY_J){
							calibObject.setEditModeToValueListening("j");
						}
					} else if(calibObject.isEditModeSelected()){
						// set it as a target vertice
						if(tevent.keyDown_Char == tevent.KEY_T)
							calibObject.getSelectedVertice().setTargetType(true);

						//remove vertice
						if(tevent.keyDown_Char == tevent.KEY_X){
							calibObject.remove(false, true);
						}

						//Adjust this vertice
						if(tevent.keyDown_Char == tevent.KEY_J){
							calibObject.setEditModeToValueListening("j");
						}

						//create delaunay lines
						if(tevent.keyDown_Char >= 48  && tevent.keyDown_Char <= 57){//key 0...9
							if(calibObject.isDoubleSelected()){
								calibObject.createLine(tevent.keyDown_Char-48);
							}
						}

						// move vertice with arrowkeys
						if(tevent.keyDown_Char == -9){//key UP pressed
							calibObject.addmove(0, 0.5f / tevent.cameraHeigth);
							calibObject.update(virtualCamera);
						} else if(tevent.keyDown_Char == -10){//key DOWN pressed
							calibObject.addmove(0, - 0.5f / tevent.cameraHeigth);
							calibObject.update(virtualCamera);
						} else if(tevent.keyDown_Char == -11){//key LEFT pressed
							calibObject.addmove(- 0.5f / tevent.cameraWidth, 0);
							calibObject.update(virtualCamera);
						} else if(tevent.keyDown_Char == -12){//key RIGHT pressed
							calibObject.addmove(0.5f / tevent.cameraWidth, 0);
							calibObject.update(virtualCamera);
						}

						//deselect vertice
						if(tevent.keyDown_mouse){
							if(calibObject.pick(tevent.mouseNormPosX, tevent.mouseNormPosY)){
								calibObject.doubleSelect();
							} else {
								calibObject.deselect();
								calibObject.setEditModeToNone();
								calibObject.setModifyModeToNone();
							}
						}

						//grab vertice with mouse
						if(tevent.keyDown_Char == tevent.KEY_G)
							calibObject.setEditModeToGrab();
					}

					//grabing with mouse
					if(calibObject.isEditModeGrab()){
						//moove vertice with mouse until mouseclick or enter
						calibObject.move(tevent.mouseNormPosX, tevent.mouseNormPosY);
						calibObject.update(virtualCamera);
						if(tevent.keyDown_Return || tevent.keyDown_mouse){
							calibObject.setEditModeToSelected();
						}
					}

					//set frame subdivision
					if(calibObject.isEditModeValueListening("f")){
						if(tevent.keyDown_Char >= 48  && tevent.keyDown_Char <= 57){//key 0...9
							calibObject.setDelaunayMeshFrame(tevent.keyDown_Char-48);
							calibObject.setEditModeToNone();
						} else if (tevent.keyDown_Esc){
							calibObject.setEditModeToNone();
						}
					}

					// set subdivision
					if(calibObject.isEditModeValueListening("d")){
						if(tevent.keyDown_Char >= 48  && tevent.keyDown_Char <= 53){//key 0...5
							calibObject.setDelaunayMeshSubDiv(tevent.keyDown_Char-48);
							calibObject.setEditModeToNone();
						} else if (tevent.keyDown_Esc){
							calibObject.setEditModeToNone();
						}
					}

					//adjusting to vertice
					if(calibObject.isEditModeValueListening("j")){
						if(tevent.keyDown_Char == tevent.KEY_T){
							calibObject.adjustWarpToTarget();
							calibObject.setEditModeToNone();
						} else if(tevent.keyDown_Char == tevent.KEY_M){
							calibObject.adjustWarpToModel();
							calibObject.setEditModeToNone();
						} else if (tevent.keyDown_Esc){
							calibObject.setEditModeToNone();
						}
					}
				}

				if(calibObject.isModifyModeTarget()){
					/*
					 * Setting Target Vertices
					 */
					if(calibObject.isEditModeSelected()){

						//switch render appearance
						if(tevent.keyDown_Char == TrackerEvent.KEY_Z && modelObject != null){
							if(modelObject.drawer.getRenderMode() == com.tecartlab.jay3dee.model.drawer.MaxSketchModelMeshDrawer.RENDER_LINES)
								modelObject.drawer.setRenderMode(com.tecartlab.jay3dee.model.drawer.MaxSketchModelMeshDrawer.RENDER_ALL);
							else
								modelObject.drawer.setRenderMode(com.tecartlab.jay3dee.model.drawer.MaxSketchModelMeshDrawer.RENDER_LINES);
						}

						// remove target vertice
						if(tevent.keyDown_Char == tevent.KEY_X){
							calibObject.remove(true, false);
							calibObject.setEditModeToNone();
							calibObject.setModifyModeToNone();
						}

						// add warp vertice to this vertice
						if(tevent.keyDown_Char == tevent.KEY_W){
							calibObject.getSelectedVertice().setWarpType(true);
						}

						//Adjust this vertice
						if(tevent.keyDown_Char == tevent.KEY_J){
							calibObject.setEditModeToValueListening("j");
						}

						//Adjust this vertice
						//if(tevent.keyDown_Char == tevent.KEY_U){
						//	calibObject.setSelectedIDToDisregardID();
						//}

						//Adjust this vertice
						if(tevent.keyDown_Char == tevent.KEY_C){
							calibObject.toggleCrossHairMode();
						}

						// move vertice with arrowkeys
						if(tevent.keyDown_Char == -9)//key UP pressed
							calibObject.addmove(0, 0.5f / tevent.cameraHeigth);
						if(tevent.keyDown_Char == -10)//key DOWN pressed
							calibObject.addmove(0, - 0.5f / tevent.cameraHeigth);
						if(tevent.keyDown_Char == -11)//key LEFT pressed
							calibObject.addmove(- 0.5f / tevent.cameraWidth, 0);
						if(tevent.keyDown_Char == -12)//key RIGHT pressed
							calibObject.addmove(0.5f / tevent.cameraWidth, 0);

						//swap index
						if(tevent.keyDown_Char >= 48  && tevent.keyDown_Char <= 57)//key 0...9
							calibObject.swapIndex(tevent.keyDown_Char-48);

						// deselect vertice
						if(tevent.keyDown_mouse){
							if(calibObject.pick(tevent.mouseNormPosX, tevent.mouseNormPosY)){
								calibObject.select();
							} else {
								calibObject.deselect();

								// first we pick a model vertice...
								modelObject.pickVertice(virtualCamera.getViewportRay( tevent.mouseNormPosX, tevent.mouseNormPosY));
								// ... if not, select the picked model vertice..
								if(tevent.keyDown_mouse){
									modelObject.selectPickVertice();
									calibObject.setModifyModeToModel();
									calibObject.setEditModeToSelected();
								}
							}
						}

						// grab vertice with mouse
						if(tevent.keyDown_Char == tevent.KEY_G)
							calibObject.setEditModeToGrab();
					}

					if(calibObject.isEditModeGrab()){
						// move vertice with mouse until mouse click or enter
						calibObject.move(tevent.mouseNormPosX, tevent.mouseNormPosY);
						if(tevent.keyDown_Return || tevent.keyDown_mouse)
							calibObject.setEditModeToSelected();

					}

					//adjust target to
					if(calibObject.isEditModeValueListening("j")){
						if(tevent.keyDown_Char == tevent.KEY_W){
							calibObject.adjustTargetToWarp();
							calibObject.setEditModeToSelected();
						} else if(tevent.keyDown_Char == tevent.KEY_M){
							calibObject.adjustTargetToModel();
							calibObject.setEditModeToSelected();
						} else if (tevent.keyDown_Esc){
							calibObject.setEditModeToSelected();
						}
					}

					if(tevent.keyDown_Char == tevent.KEY_O){//key show calibration object
						showCalibModel = !showCalibModel;
						modelObject.drawer.anything("enable", Atom.newAtom((showCalibModel)?1:0));
					}

				} else if(calibObject.isModifyModeModel()){
					if(calibObject.isEditModeSelected()){

						//create vertice with target and warp
						if(tevent.keyDown_Char == tevent.KEY_V){
							calibObject.add(modelObject, virtualCamera, true, true);
							calibObject.setEditModeToNone();
							calibObject.setModifyModeToNone();
						}

						//create vertice with warp
						if(tevent.keyDown_Char == tevent.KEY_W){
							calibObject.add(modelObject, virtualCamera, false, true);
							calibObject.setEditModeToNone();
							calibObject.setModifyModeToNone();
						}

						//create vertice with target
						if(tevent.keyDown_Char == tevent.KEY_T){
							calibObject.add(modelObject, virtualCamera, true, false);
							calibObject.setEditModeToNone();
							calibObject.setModifyModeToNone();
						}

						//remove vertice
						if(tevent.keyDown_Char == tevent.KEY_X){
							calibObject.remove(modelObject.getSelectedVerticeWorld());
							calibObject.setEditModeToNone();
							calibObject.setModifyModeToNone();
						}

						//deselect
						if(modelObject != null && modelObject.pickVertice(virtualCamera.getViewportRay( tevent.mouseNormPosX, tevent.mouseNormPosY))){
							//modelObject.unselectPickVertice();
							calibObject.setEditModeToNone();
							calibObject.setModifyModeToNone();
						}
					}
				}
				if(calibObject.wasModified()){
					calibObject.draw();
					outlet(OUTLET_SKETCH, "editmode", editMode);
					if(editMode == EDIT_M_WARP){
						outlet(OUTLET_SKETCH, "jit_matrix", calibObject.generateGeometry());
						outlet(OUTLET_SKETCH, "draw_mode", "triangles");
					}

				}
			}
		}
	}

	/**
	 * Called my Max if this MaxObject is deleted
	 */
	public void notifyDeleted(){
		stopcrunch();
		if(createQelem != null)
			createQelem.release();
		if(addQelem != null)
			addQelem.release();
		trackerSubscriber.notifyDeleted();
		if(modelObject != null)
			modelObject.notifyDeleted();
		calibObject.notifyDeleted();
		//crunchy.notifyDeleted();
	}

	/**
	 * Called by SimpleObjectContainer when async model loading is complete.
	 * This is where we update the calibration object once the model is ready.
	 */
	@Override
	public void onModelLoadComplete(SimpleObjectContainer container) {
		if(needsCalibrationUpdate) {
			needsCalibrationUpdate = false;
			updateCalibrationObject();
			Debug.info("SparckCalibrator", "Calibration updated after model load");
		}
	}

	/**
	 * checks if there is
	 * an operational tracker
	 * and an operational modelobject
	 * and operational properties
	 * @return true if this is the case
	 */
	public boolean isOperational(){
		if(tracker != null)
			if(tracker.isOperational())
				if(modelObject != null)
					if(modelObject.isOperational())
						if(props.isOperational())
							return true;
						else
							Debug.warning("Calibrator [" + editorname + "]", "Properties are not operational.");
					else
						Debug.warning("Calibrator [" + editorname + "]", "Model is not operational: " + (objectName != null ? objectName : "no model loaded"));
				else {
					calibObject.unlink();
					Debug.warning("Calibrator [" + editorname + "]", "Model is not loaded. Use 'loadmodel' to load a 3D model file.");
				}
			else
				Debug.warning("Calibrator [" + editorname + "]", "Tracker is not operational : " + trackername);
		else
			Debug.warning("Calibrator [" + editorname + "]", "Tracker is not connected : " + trackername);

		return false;
	}

	protected class TrackerSubscriber implements DynSubscriber, TrackerListener{

		private DynSubscription subscription;

		public TrackerSubscriber(){
		}

		public void subscribeTracker(String _trackerName){
			Debug.verbose("Calibrator [" + editorname + "]", "Subscribing to get connected to Tracker: " + _trackerName);
			subscription = Env.getEnv().trackerDistributor.create(this, _trackerName, this);
			trackername = _trackerName;
			subscription.subscribe();
		}

		public void notifyDeleted(){
			Debug.verbose("Calibrator [" + editorname + "]", "Unsubscribe from Tracker: " + trackername);
			if(subscription != null)
				subscription.unsubscribe();
			tracker = null;
		}

		public void publicationConnected(String distributor, DynSubscription subscription) {
			Debug.verbose("Calibrator [" + editorname + "]", "Connected to published tracker: " + trackername);
			tracker = (GuiTracker) subscription.getPublishedObject();
		}

		public void publicationDisonnected(String distributor, DynSubscription subscription) {
			Debug.verbose("Calibrator [" + editorname + "]", "disconnected from recalled tracker: " + trackername);
			tracker = null;
		}

		public void trackerEvent(TrackerEvent tevent) {
			trackEvent(tevent);
		}

	}

}
