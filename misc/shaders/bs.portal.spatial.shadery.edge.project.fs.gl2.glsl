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

#version 120
#extension GL_ARB_texture_rectangle : enable

/*
	Multifunctional texture projection shader with full feature set.
*/

uniform float projection_mode;
uniform int stage_mode;
uniform int mode;
uniform int occlusion;

// samplers
uniform sampler2DRect tex0;
uniform sampler2DRect tex1;
uniform sampler2DRect tex2;
uniform sampler2DRect tex3;
uniform sampler2DRect tex4;
uniform sampler2DRect tex5;
uniform sampler2DRect tex6;
uniform sampler2DRect tex7;

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

uniform float gradient[101];
uniform float blend_power;
uniform float blend_luminance;

// generated by the vertex shader

varying vec4 beamer_uv[6];		// beamer uv position
varying vec2 beamer_texcoord[6];// beamer texcoord

varying float depth[6];// beamer distance

varying vec3 normal;	// surface normal
varying vec3 worldPos;	// vertex world position

float blendSpread = pow(((0.5 + (blend_spread)*10))*2., 4.);

// constants

const float PI = 3.1415926535897932384626433832795;
const float PI_HALF = PI / 2.0;
const vec4 WHITE = vec4( 1.0, 1.0, 1.0, 1.0);
const vec4 BLACK = vec4( 0.0, 0.0, 0.0, 1.0);

// since the first texture is the objects default texture, we are starting with the second one..
vec4 getTexture2DRect(int index, vec2 coord){
	return
        (index == 0)?texture2DRect(tex1, coord):
        (index == 1)?texture2DRect(tex2, coord):
        (index == 2)?texture2DRect(tex3, coord):
        (index == 3)?texture2DRect(tex4, coord):
        (index == 4)?texture2DRect(tex5, coord):texture2DRect(tex6, coord);
}

vec4 getTextureColor(int i){
	return getTexture2DRect(i, beamer_texcoord[i]);
}

vec4 alphablend(vec4 src, vec4 dst){
	float outA = src.a + dst.a * (1.0 - src.a);
	return vec4((src.rgb * src.a + dst.rgb * dst.a * (1.0 - src.a))/outA, outA);
}

float softedgeblend(float _factor){
	// calculate alpha blend channel
	return (_factor < 0.5)?
			blend_luminance * pow((2. * _factor), blend_power):
			1. - (1. - blend_luminance) * pow(2. * (1. - _factor), blend_power);
}

// entry point
void main()
{
	float	vcurve[6];
	float 	vangle[6];
	float 	spreadedAngle[6];
	float 	veepee[6];
  float   occDepth[6];

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
      occDepth[i] = 0.0;
		indexSort[i] = i;
	}

  if (occlusion == 1){
      occDepth[0] = texture2DRect(tex0, beamer_texcoord[0]).r;
      occDepth[1] = texture2DRect(tex1, beamer_texcoord[1]).r;
      occDepth[2] = texture2DRect(tex2, beamer_texcoord[2]).r;
      occDepth[3] = texture2DRect(tex3, beamer_texcoord[3]).r;
      occDepth[4] = texture2DRect(tex4, beamer_texcoord[4]).r;
      occDepth[5] = texture2DRect(tex5, beamer_texcoord[5]).r;
  }

  //Calculating the factor of importance for each beamer
	for( i = 0; i < beamer_count; i++){
		// calculate the viewray from the camera to this fragment
		ray = beamer_pos[i] - worldPos;
		raynormal = normalize(ray);

		// calculate the angle between the surface normal and the projected beam.
		// 		rsp. the angle between the surface normal and the projector direction.
		angle = dot(normal, raynormal * (1.0 - angle_mode) + beamer_dir[i] * angle_mode);

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
		col = (0.5 - abs(beamer_uv[i].xy - 0.5)) * (20. - bevel_size[i] * 18.0);
		col = clamp(col, 0.0, 1.0);

		// transform the box blend into a chanfer box
		linearCurve = (bevel_round[i] == 1)?1.0 - clamp(sqrt(pow(1.0-col.y,2.0) + pow(1.0-col.x,2.0)), 0.0, 1.0):clamp(min(col.x,col.y), 0., 1.);

		veepee[i] = sign(linearCurve);

		// transform the linear blend into an s-shaped blend
		float powFactor = 1.0 + abs(bevel_curve[i] * 5.0);
		powerCurve = linearCurve * linearCurve * (3. - 2. * linearCurve);
		powerCurve = (bevel_curve[i] > 0.)?1.0 - pow(1.0 - powerCurve, powFactor):pow(powerCurve, powFactor);

        // calculate depth-difference to detect occlusions -> allway 1 if occlusion is disabled
        float depth_diff = (abs(occDepth[i] - depth[i]) > 0.005)? (1. - occlusion): 1.0;

		vcurve[i] = powerCurve * visible * depth_diff;
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

  // calculate the mode
	if(mode == 0){
		// it is drawn inside the 3dviewer

		// calculate the color mode
    if(stage_mode == 1){
			// create the colormix with up to 4 beamers
			vec4 col= beamer_color[indexSort[0]] * spreadedAngle[indexSort[0]];
			col += beamer_color[indexSort[1]] * spreadedAngle[indexSort[1]];
			col += beamer_color[indexSort[2]] * spreadedAngle[indexSort[2]];
			col += beamer_color[indexSort[3]] * spreadedAngle[indexSort[3]];
			gl_FragColor = alphablend(col, offColor);
		//gl_FragColor = beamer_color[indexSort[0]];
		} else if(stage_mode == 2){
			// create the colormix with up to 4 beamers
			gl_FragColor =  WHITE - vec4(0.2, 0.2, 0.2, 0.0);
		} else if(stage_mode == 3){
			// create the colormix with up to 4 beamers
			gl_FragColor =  beamer_color[indexSort[0]] * vangle[indexSort[0]] +
							beamer_color[indexSort[1]] * vangle[indexSort[1]] +
							beamer_color[indexSort[2]] * vangle[indexSort[2]] +
							beamer_color[indexSort[3]] * vangle[indexSort[3]];
		} else if(stage_mode > 3){
			// create the colormix with up to 4 beamers
			gl_FragColor = vec4(beamer_color[stage_mode - 4].rgb * spreadedAngle[stage_mode - 4], 1.);
		}
	} else if(mode > 0){
		// float gradientCorrected = softedgeblend(gradient[int(spreadedAngle[mode - 1] * 100.)]);
    // gl_FragColor = alphablend(texture2DRect(tex1, camera_texcoord[0]) * gradientCorrected, texture2DRect(tex0, custom_texcoord));
    // it has to output a mask
		gl_FragColor = vec4(spreadedAngle[mode - 1], spreadedAngle[mode - 1], spreadedAngle[mode - 1], 1.);
	}
}
