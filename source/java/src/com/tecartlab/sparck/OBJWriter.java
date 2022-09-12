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

package com.tecartlab.sparck;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintWriter;

import toxi.geom.Vec2D;
import toxi.geom.Vec3D;

public class OBJWriter {

    public final String VERSION = "0.1";

    protected OutputStream objStream;
    protected PrintWriter objWriter;

    protected int numVerticesWritten = 0;
    protected int numNormalsWritten = 0;
    protected int numTexturesWritten = 0;

    public void beginSave(OutputStream stream) {
        try {
            objStream = stream;
            handleBeginSave();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void beginSave(String fn) {
        try {
            objStream = new FileOutputStream(fn);
            handleBeginSave();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void endSave() {
        try {
            objWriter.flush();
            objWriter.close();
            objStream.flush();
            objStream.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public void face(int a, int b, int c) {
        objWriter.println("f " + a + " " + b + " " + c);
    }

    public void faceList() {
        objWriter.println("s off");
    }

    public void faceWithNormals(int a, int b, int c, int ta, int tb, int tc, int na, int nb, int nc) {
        objWriter.println("f " + a + "/" + ta + "/" + na + " " + b + "/" + tb + "/" + nb + " " + c
                + "/" + tc + "/" + nc);
    }

    public int getCurrNormalOffset() {
        return numNormalsWritten;
    }

    public int getCurrVertexOffset() {
        return numVerticesWritten;
    }

    public int getCurrTextureOffset() {
        return numTexturesWritten;
    }

    protected void handleBeginSave() {
        objWriter = new PrintWriter(objStream);
        objWriter.println("# generated by beamstreamer calibration tool v" + VERSION);
        numVerticesWritten = 0;
        numNormalsWritten = 0;
        numTexturesWritten = 0;
    }

    public void newObject(String name) {
        objWriter.println("o " + name);
    }

    public void texture(Vec2D n) {
        objWriter.println("vt " + n.x + " " + n.y);
        numTexturesWritten++;
    }

    public void normal(Vec3D n) {
        objWriter.println("vn " + n.x + " " + n.y + " " + n.z);
        numNormalsWritten++;
    }

    public void vertex(Vec3D v) {
        objWriter.println("v " + v.x + " " + v.y + " " + v.z);
        numVerticesWritten++;
    }
}