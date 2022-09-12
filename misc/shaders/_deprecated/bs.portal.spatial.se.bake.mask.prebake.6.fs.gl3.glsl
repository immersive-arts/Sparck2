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

#version 330 core
#extension GL_ARB_texture_rectangle : enable

/*
	Multifunctional texture projection shader with full feature set.
*/

layout (location = 0) out vec4 outColor0;
layout (location = 1) out vec4 outColor1;
layout (location = 2) out vec4 outColor2;
layout (location = 3) out vec4 outColor3;
layout (location = 4) out vec4 outColor4;
layout (location = 5) out vec4 outColor5;
layout (location = 6) out vec4 outColor6;

// vertex
uniform float projection_mode;
uniform int stage_mode;
uniform int mode;

// samplers
uniform sampler2DRect tex0;
uniform sampler2DRect tex1;
uniform sampler2DRect tex2;
uniform sampler2DRect tex3;
uniform sampler2DRect tex4;
uniform sampler2DRect tex5;

uniform int beamer_count;
uniform vec4 beamer_color[6];

uniform vec3 beamer_pos[6];
uniform vec3 beamer_dir[6];

uniform float bevel_size[6];
uniform float bevel_curve[6];
uniform int bevel_round[6];

uniform vec4 offColor; 	// off color

uniform float distance_influence;
uniform float back_blend;
uniform float blend_spread;
uniform float angle_mode;

uniform float angle_limit_low[6];
uniform float angle_limit_high[6];

uniform float far_clip[6];

uniform float interpolation_correction;

// generated by the vertex shader
in jit_PerVertex {
    vec4 jit_texcoord0;
    vec4 beamer_uv[6];
    vec2 beamer_texcoord[6];
    vec3 normal;
    vec3 worldPos;
} jit_in;

float blendSpread = pow(((0.5 + (blend_spread)*10))*2., 4.);

// constants
const float PI = 3.1415926535897932384626433832795;
const float PI_HALF = PI / 2.0;
const vec4 WHITE = vec4( 1.0, 1.0, 1.0, 1.0);
const vec4 BLACK = vec4( 0.0, 0.0, 0.0, 1.0);

vec4 alphablend(vec4 src, vec4 dst){
	float outA = src.a + dst.a * (1.0 - src.a);
	return vec4((src.rgb * src.a + dst.rgb * dst.a * (1.0 - src.a))/outA, outA);
}

// entry point
void main()
{
	float	vcurve[6];
	float 	vangle[6];
	float 	spreadedAngle[6];
	float 	veepee[6];

	int   	indexSort[6];

	vec3 	ray, raynormal;
	vec2 	col;
	float 	curve, angle, linearCurve, powerCurve, visible;
  int 	i, j;

  for( i = 0; i < 6; i++){
		vcurve[i] = 0.0;
		vangle[i] = 0.0;
		veepee[i] = 0.0;
		spreadedAngle[i] = 0.0;
		indexSort[i] = i;
	}

    //Calculating the factor of importance for each beamer
	for( i = 0; i < beamer_count; i++){
		// calculate the viewray from the camera to this fragment
		ray = beamer_pos[i] - jit_in.worldPos;
		raynormal = normalize(ray);

		// calculate the angle between the surface normal and the projected beam.
		// 		rsp. the angle between the surface normal and the projector direction.
		angle = dot(jit_in.normal, raynormal * (1.0 - angle_mode) + beamer_dir[i] * angle_mode);

		// checks if the worldPos is in front of the camera.
		//   the interpolation_correction factor is making sure that fragment
		//   interpolation errors will be cut away, with the negative
		//   sideeffect of less total angle visibility.
		angle = angle * max(sign(dot(beamer_dir[i],raynormal)-interpolation_correction), 0.);

		// sets from which side (back, both, front) it is visible
		angle = (projection_mode == 0.)? abs(angle):angle * projection_mode;

		// it calculates the relation between the distance and the far clip
		angle *= min(1.0, 1.0 - distance_influence * length(ray) / far_clip[i]);

		//calculates the visibility factor for the angle;
		visible = smoothstep(angle_limit_low[i], angle_limit_high[i], angle);

		// calculate the viewport linear box blend
		col = (0.5 - abs(jit_in.beamer_uv[i].xy - 0.5)) * (20. - bevel_size[i] * 18.0);
		col = clamp(col, 0.0, 1.0);

		// transform the box blend into a chanfer box
		linearCurve = (bevel_round[i] == 1)?1.0 - clamp(sqrt(pow(1.0-col.y,2.0) + pow(1.0-col.x,2.0)), 0.0, 1.0):clamp(min(col.x,col.y), 0., 1.);

		veepee[i] = sign(linearCurve);

		// transform the linear blend into an s-shaped blend
		float powFactor = 1.0 + abs(bevel_curve[i] * 5.0);
		powerCurve = linearCurve * linearCurve * (3. - 2. * linearCurve);
		powerCurve = (bevel_curve[i] > 0.)?1.0 - pow(1.0 - powerCurve, powFactor):pow(powerCurve, powFactor);

		vcurve[i] = powerCurve * visible;
		vangle[i] = angle * visible * veepee[i];
	}

	//Sorting the viewport values
	int idxmax;

  for(i = (beamer_count - 1); i > 0; --i){
    for(j = 0; j < i; j++){
	    idxmax = (vangle[indexSort[j]] > vangle[indexSort[j+1]])? indexSort[j]: indexSort[j + 1];
    	indexSort[j + 1] = indexSort[j] + indexSort[j + 1] - idxmax;
    	indexSort[j] = idxmax;
    }
  }

	//spread the angles and calc the blend factor for each of the four possible beams
	spreadedAngle[indexSort[0]] = vcurve[indexSort[0]] * vangle[indexSort[0]];
	spreadedAngle[indexSort[1]] = vcurve[indexSort[1]] * vangle[indexSort[1]] * pow((1. - vangle[indexSort[0]] + vangle[indexSort[1]]), blendSpread);
	spreadedAngle[indexSort[2]] = vcurve[indexSort[2]] * vangle[indexSort[2]] * pow((1. - vangle[indexSort[0]] + vangle[indexSort[2]]), blendSpread);
	spreadedAngle[indexSort[3]] = vcurve[indexSort[3]] * vangle[indexSort[3]] * pow((1. - vangle[indexSort[0]] + vangle[indexSort[3]]), blendSpread);
	spreadedAngle[indexSort[4]] = vcurve[indexSort[4]] * vangle[indexSort[4]] * pow((1. - vangle[indexSort[0]] + vangle[indexSort[4]]), blendSpread);
	spreadedAngle[indexSort[5]] = vcurve[indexSort[5]] * vangle[indexSort[5]] * pow((1. - vangle[indexSort[0]] + vangle[indexSort[5]]), blendSpread);

	float sumAngle =
		spreadedAngle[indexSort[0]] +
		spreadedAngle[indexSort[1]] +
		spreadedAngle[indexSort[2]] +
		spreadedAngle[indexSort[3]] +
		spreadedAngle[indexSort[4]] +
		spreadedAngle[indexSort[5]];

	// normalizing the blend factors for the first time
	// and multiply it with the curve.
	float normalizeOne = 1.0 / sumAngle;

	spreadedAngle[indexSort[0]] *= normalizeOne;
	spreadedAngle[indexSort[1]] *= normalizeOne;
	spreadedAngle[indexSort[2]] *= normalizeOne;
	spreadedAngle[indexSort[3]] *= normalizeOne;
	spreadedAngle[indexSort[4]] *= normalizeOne;
	spreadedAngle[indexSort[5]] *= normalizeOne;

	float sumCurve =
		vcurve[indexSort[0]] +
		vcurve[indexSort[1]] +
		vcurve[indexSort[2]] +
		vcurve[indexSort[3]] +
		vcurve[indexSort[4]] +
		vcurve[indexSort[5]];

	//absolute blend factor, used to blend in the background color
	//    make sure it is not bigger than 1.
	float blendRef = min(1.0,sumCurve + (1. - back_blend)) * sign(sumAngle);

  // we output up to 7 textures:
  //  the first texture is for mode=0, which is for display inside the 3dviewer. so we precalculate the
  //    false color texture, even though we wont need it most of the time, but this is much faster
  //    further down the line than calculating it inside the model shader (bs.portal.spatial.se.bake.mask.6.jxs)

  vec4 blendColor[6];
  vec4 sumBeamerCol = vec4(0., 0., 0., 0.);

  for(i = 0; i < beamer_count; i++){
    blendColor[i] = vec4(WHITE.rgb * spreadedAngle[i] * blendRef * veepee[i], 1.);
    sumBeamerCol += beamer_color[i] * blendColor[i];
  }

  outColor0 = sumBeamerCol;
  outColor1 = blendColor[0];
  outColor2 = blendColor[1];
  outColor3 = blendColor[2];
  outColor4 = blendColor[3];
  outColor5 = blendColor[4];
  outColor6 = blendColor[5];
}
