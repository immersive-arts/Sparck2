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

import com.cycling74.max.Atom;
import com.tecartlab.jay3dee.CallBackInterface;
import com.tecartlab.jay3dee.FileManager;
import com.tecartlab.jay3dee.model.*;
import com.tecartlab.tools.math.la.*;
import com.tecartlab.utils.Debug;
import java.util.ArrayList;

/**
 * Simplified ModelContainer without publish/subscribe mechanism.
 * Designed for direct usage within SparckCalibrator.
 */
public class SimpleModelContainer implements CallBackInterface {

	public ModelData model;
	public String modelname;
	public FileManager fileManager;
	private SimpleObjectContainer parentContainer;

	public SimpleModelContainer(SimpleObjectContainer parent) {
		model = new ModelData(this);
		fileManager = new FileManager(10);
		modelname = "simple_model";
		this.parentContainer = parent;
	}

	/****************************************************************
	 * FILES / UN-DO
	 ****************************************************************/

	public void undo() {
		model = fileManager.unDo(model);
	}

	public void redo() {
		model = fileManager.reDo(model);
	}

	/**
	 * Loads a model from the specified file.
	 * @param filename
	 */
	public void load(String filename) {
		fileManager.load(model, filename);
		Debug.info("SimpleModelContainer", "Loaded model from: " + filename);
	}

	public void saveAs(String filename) {
		fileManager.saveAs(model, filename);
	}

	public void save() {
		fileManager.save(model);
	}

	/****************************************************************
	 * Create / Add Vertices
	 ****************************************************************/

	/**
	 * Creates a model with the specified points.
	 * Three points make a vertice, with each vertice drawing a line to the XY plane.
	 * @param vertices array of floats (x,y,z triplets)
	 */
	public void createToXY(Atom[] vertices) {
		if((vertices.length % 3) == 0){
			ArrayList<Vertice> verts = new ArrayList<Vertice>(vertices.length / 3);
			for(int i = 0; i < vertices.length; i = i + 3){
				verts.add(new Vertice(vertices[i].toFloat(), vertices[i+1].toFloat(), vertices[i+2].toFloat()));
			}
			model.create(verts, 0);
		} else {
			Debug.error("SimpleModelContainer", "'createToXY' the number of values need to be multiple of 3.");
		}
	}

	/**
	 * Adds to a loaded model the specified points.
	 * Three points make a vertice, with each vertice drawing a line to the XY plane.
	 * @param vertices array of floats (x,y,z triplets)
	 */
	public void addToXY(Atom[] vertices) {
		if((vertices.length % 3) == 0){
			ArrayList<Vertice> verts = new ArrayList<Vertice>(vertices.length / 3);
			for(int i = 0; i < vertices.length; i = i + 3){
				verts.add(new Vertice(vertices[i].toFloat(), vertices[i+1].toFloat(), vertices[i+2].toFloat()));
			}
			model.add(verts, 0);
		} else {
			Debug.error("SimpleModelContainer", "'addToXY' the number of values need to be multiple of 3.");
		}
	}

	/****************************************************************
	 * New Picking - Selections
	 ****************************************************************/

	/**
	 * pick closest vertice to viewray (ergo: pickray)
	 * @param pickray
	 * @return true if new vertice was picked
	 */
	public boolean pickVertice(Linef pickray){
		if(model.pickModelVertice(pickray)){
			return true;
		}
		return false;
	}

	/**
	 * selects the picked vertice and returns a clone of the vertice
	 * @return
	 */
	public Vertice selectPickedVertice(){
		Vertice temp = model.selectPickedModelVertice();
		if(temp != null){
			return temp.clone();
		}
		return null;
	}

	public void unselectPickedVertice(){
		model.unselectAllVertices();
	}

	/**
	 * Returns clones of all selected vertices.
	 * @return
	 */
	public Vertice[] getSelectedVertices(){
		Vertice[] vertices = model.getSelectedVertices();
		for(int i = 0; i < vertices.length; i++)
			vertices[i] = (Vertice)vertices[i].clone();
		return vertices;
	}

	/**
	 * Returns a clone of the modelvertice at this index.
	 * @param index
	 * @return
	 */
	public Vertice getModelVertice(int index){
		return model.getModelVertice(index).clone();
	}

	/**
	 * Returns a clone of the nearest modelvertice to the specified point.
	 * @param _pos in local coordinate system
	 * @return clone of model vertice
	 */
	public Vertice getModelVertice(Vector3f _pos){
		return model.getModelVertice(_pos).clone();
	}

	/**
	 * Checks if the model is operational (has valid data)
	 * @return true if model has faces or vertices
	 */
	public boolean isOperational(){
		if(model.getFaceCount() > 0){
			return true;
		} else if(model.getModelVerticesCount() > 0){
			return true;
		} else {
			Debug.warning("SimpleModelContainer["+modelname+"]", "No valid model loaded!");
		}
		return false;
	}

	/**
	 * Called by the model when it needs to notify about changes.
	 * Notifies parent container when file parsing is complete.
	 */
	public void dataEvent(String message) {
		if(message.equals("fileparsed") && parentContainer != null) {
			parentContainer.modelLoadComplete();
		}
	}
}
