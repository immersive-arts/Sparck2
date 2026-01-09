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

package com.tecartlab.sparck.newcalib;

import com.cycling74.max.*;

import com.tecartlab.jay3dee.model.Vertice;
import com.tecartlab.jay3dee.model.drawer.MaxSketchModelMeshDrawer;
import com.tecartlab.tools.math.la.Linef;
import com.tecartlab.tools.math.la.Quaternionf;
import com.tecartlab.tools.math.la.Vector3f;
import com.tecartlab.tools.threedee.Node;
import com.tecartlab.utils.Debug;

/**
 * Simplified ObjectContainer without publish/subscribe mechanism.
 * Designed for direct usage within SparckCalibrator.
 * Manages a 3D model with transformations and provides API for vertex picking.
 */
public class SimpleObjectContainer {

	/**
	 * Interface for listening to model load completion events.
	 */
	public interface LoadCompleteListener {
		void onModelLoadComplete(SimpleObjectContainer container);
	}

	private SimpleModelContainer model;
	public MaxSketchModelMeshDrawer drawer;
	String modelname;
	private LoadCompleteListener loadCompleteListener;

	public Node objTransformation;

	public SimpleObjectContainer()
	{
		objTransformation = new Node();

		drawer = new MaxSketchModelMeshDrawer();
		drawer.setLayer(0);
		drawer.setRenderMode(MaxSketchModelMeshDrawer.RENDER_ALL);
		// Initialize drawer in disabled state, like Jay3DeeObject does
		drawer.anything("enable", Atom.newAtom(0));
	}

	/**
	 * Set listener to be notified when model loading is complete.
	 * @param listener the listener to notify
	 */
	public void setLoadCompleteListener(LoadCompleteListener listener) {
		this.loadCompleteListener = listener;
	}

	/**
	 * Loads a 3D model from file and initializes the drawer.
	 * Model loading happens asynchronously in a background thread.
	 * @param _filepath path to the model file
	 */
	public void loadModel(String _filepath){
		model = new SimpleModelContainer(this);
		modelname = _filepath;
		model.load(_filepath);
		// Note: drawer initialization happens in modelLoadComplete() callback
		// after the background thread finishes parsing the file
	}

	/**
	 * Called by SimpleModelContainer when async file loading is complete.
	 * This is when we can safely initialize the drawer with the loaded model data.
	 */
	void modelLoadComplete(){
		if(model != null && model.isOperational()){
			drawer.initialize(model.model);
			// Call draw() like ObjectContainer does, not drawraw()
			drawer.draw();
			Debug.info("SimpleObjectContainer", "Model loaded and initialized: " + modelname);
			// Notify listener if set
			if(loadCompleteListener != null) {
				loadCompleteListener.onModelLoadComplete(this);
			}
		} else {
			Debug.error("SimpleObjectContainer", "Failed to initialize model after loading: " + modelname);
		}
	}

	/**
	 * Forces drawing of object
	 * returns vertex matrix name
	 */
	public String draw(){
		return drawer.drawraw();
	}

	public void editRenderMode(boolean flag){
		drawer.editRenderMode(flag);
	}

	/**
	 * Called when object is deleted
	 */
	public void notifyDeleted()
	{
		if(drawer != null){
			drawer.notifyDeleted();
		}
	}

	/**
	 * Set the World - Position of the Object
	 * @param _position - Atom Array with x, y, and z float value
	 */
	public void position(Atom[] _position){
		drawer.position(_position);
		objTransformation.setPosition(new Vector3f(_position[0].toFloat(), _position[1].toFloat(), _position[2].toFloat()));
	}

	/**
	 * Set the World - Quaternion of the Object
	 * @param _quat - Atom Array with x, y, z and w float value
	 */
	public void quat(Atom[] _quat){
		drawer.quat(_quat);
		objTransformation.setOrientation(new Quaternionf(_quat[0].toFloat(), _quat[1].toFloat(), _quat[2].toFloat(), _quat[3].toFloat()));
	}

	/**
	 * Set the World - Rotation of the Object
	 * @param _rotatexyz - Atom Array with Euler Angle float value
	 */
	public void rotatexyz(Atom[] _rotatexyz){
		drawer.rotatexyz(_rotatexyz);
		Quaternionf rotatexyz = new Quaternionf();
		rotatexyz.setEulerAngles(_rotatexyz[0].toFloat(), _rotatexyz[1].toFloat(), _rotatexyz[2].toFloat());
		objTransformation.setOrientation(rotatexyz);
	}

	/**
	 * Set the World - Scale of the Object
	 * @param _scale - Atom Array with x, y and z float value
	 */
	public void scale(Atom[] _scale){
		drawer.scale(_scale);
		objTransformation.setScale(new Vector3f(_scale[0].toFloat(), _scale[1].toFloat(), _scale[2].toFloat()));
	}


	/*******************************************
	 *          Edit Model methods
	 *******************************************/

	/**
	 * pick closest vertice to viewray (ergo: pickray)
	 * @param pickray
	 * @return true if new vertice was picked
	 */
	public boolean pickVertice(Linef pickray){
		if(model != null && pickray != null){
			if(model.pickVertice(pickray.transform(objTransformation.getInvWorldTransformationMatrix()))){
				// Update the drawer's selection state and trigger a redraw
				drawer.selectionChange();
				drawer.draw();
				return true;
			}
		}
		return false;
	}

	/**
	 * selects the picked vertice and returns a clone of the vertice (in local coordinate system)
	 * @return
	 */
	public Vertice selectPickVertice(){
		if(model != null){
			Vertice result = model.selectPickedVertice();
			if(result != null){
				drawer.selectionChange();
				drawer.draw();
			}
			return result;
		}
		return null;
	}

	public void unselectPickVertice(){
		if(model != null){
			model.unselectPickedVertice();
			drawer.selectionChange();
			drawer.draw();
		}
	}

	/**
	 * returns the selectedVertices - in the local coordinate system.
	 * @return
	 */
	public Vertice[] getSelectedVerticesLocal(){
		Vertice[] vertices = null;
		if(model != null)
			vertices = model.getSelectedVertices();
		return vertices;
	}

	/**
	 * Returns the vertice (in local coord. system) with the lowest
	 * 	index number if more than one vertices are selected.
	 * @return null if no vertice has been selected
	 */
	public Vertice getSelectedVerticeLocal(){
		Vertice[] vertices = getSelectedVerticesLocal();
		if(vertices != null && vertices.length > 0)
			return vertices[0];
		return null;
	}

	/**
	 * Returns the vertice (in world coord. system) with the lowest
	 * 	index number if more than one vertices are selected.
	 * @return null if no vertice has been selected
	 */
	public Vertice getSelectedVerticeWorld(){
		Vertice[] vertices = getSelectedVerticesLocal();
		if(vertices != null && vertices.length > 0)
			return transformToWorld(vertices[0]);
		return null;
	}

	/**
	 * Returns the model vertice in local coordinate system at the provided index
	 * @param index
	 * @return
	 */
	public Vertice getModelVerticeLocal(int index){
		if(model != null)
			return model.getModelVertice(index);
		return null;
	}

	/**
	 * Returns the model vertice in world coordinate system at the provided index
	 * @param index
	 * @return
	 */
	public Vertice getModelVerticeWorld(int index){
		if(model != null)
			return transformToWorld(model.getModelVertice(index));
		return null;
	}

	/**
	 * Returns the nearest model vertice in local coordinate system at the provided point
	 * @param _pos in local coordinate system
	 * @return vertice in local coordinate system
	 */
	public Vertice getModelVerticeLocal(Vector3f _pos){
		if(model != null){
			return model.getModelVertice(_pos);
		}
		return null;
	}

	/**
	 * Returns the nearest model vertice in world coordinate system at the provided point
	 * @param _pos in local coordinate system
	 * @return vertice in world coordinate system
	 */
	public Vertice getModelVerticeWorld(Vector3f _pos){
		if(model != null){
			return transformToWorld(model.getModelVertice(_pos));
		}
		return null;
	}


	/*******************************************
	 *          Transform methods
	 *******************************************/

	/**
	 * Transforms the provided vertice into world coordinate system
	 * @param _vertice
	 * @return
	 */
	public Vertice transformToWorld(Vertice _vertice){
		return (Vertice)_vertice.transform(objTransformation.getWorldTransformationMatrix());
	}


	/*******************************************
	 *         Organizational methods
	 *******************************************/

	/**
	 * this method takes all the undefined messages and passes them to the drawer.
	 *
	 * @param message
	 * @param args
	 */
	public void anything(String message, Atom[] args){
		drawer.anything(message, args);
	}

	/**
	 * Creates a model with the specified points.
	 * Three points make a vertice, with each vertice drawing a line to the XY plane.
	 * @param vertices array of floats (x,y,z triplets)
	 */
	public void createToXY(Atom[] vertices) {
		// Initialize model container if it doesn't exist (allows createToXY without loadModel)
		if(model == null) {
			model = new SimpleModelContainer(this);
			modelname = "created_model";
		}
		model.createToXY(vertices);
	}

	/**
	 * Adds to a loaded model the specified points.
	 * Three points make a vertice, with each vertice drawing a line to the XY plane.
	 * @param vertices array of floats (x,y,z triplets)
	 */
	public void addToXY(Atom[] vertices) {
		// Initialize model container if it doesn't exist (allows addToXY without loadModel)
		if(model == null) {
			model = new SimpleModelContainer(this);
			modelname = "created_model";
		}
		model.addToXY(vertices);
	}

	/**
	 * Checks if the Object fulfills all internal conditions to be operational. It is STRONGLY suggested
	 * to call the method before any operations are done.
	 * @return
	 */
	public boolean isOperational(){
		if(model != null)
			if(model.isOperational())
				return true;
			else
				Debug.warning("SimpleObjectContainer["+modelname+"]", "Model is not operational: " + modelname);
		else
			Debug.warning("SimpleObjectContainer["+modelname+"]", "Model is not loaded: " + modelname);

		return false;
	}
}
